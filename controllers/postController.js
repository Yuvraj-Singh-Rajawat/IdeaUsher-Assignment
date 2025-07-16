const Post = require('../models/Post');
const Tag = require('../models/Tag');
const s3 = require('../config/s3');
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuid } = require('uuid');
const sharp = require('sharp'); 

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const { title, desc } = req.body;
    let tagNames = req.body.tags;

    // if tags are not provided, return an error
    if (!tagNames) return res.status(400).json({ message: 'Tags are required' });

    // If tags are provided as a string, parse it to an array
    if (typeof tagNames === 'string') {
      try {
        tagNames = JSON.parse(tagNames);
      } catch {
        return res.status(400).json({ message: 'Tags must be a valid JSON array' });
      }
    }

    // Ensure tags is an array
    if (!Array.isArray(tagNames)) {
      return res.status(400).json({ message: 'Tags must be an array' });
    }

    // Check if all tags exist in the database
    const foundTags = await Tag.find({ name: { $in: tagNames } });
    if (foundTags.length !== tagNames.length) {
      const foundNames = foundTags.map(t => t.name);
      const missing = tagNames.filter(t => !foundNames.includes(t));
      return res.status(400).json({ message: `Tag(s) not found: ${missing.join(', ')}` });
    }

    let imageUrl = null;

    if (req.file) {

      // accessing the file from req.file which is due to multer.memorystorage

      const fileExt = req.file.originalname.split('.').pop();
      const key = `posts/${uuid()}.${fileExt}`;

      // compres the image since it was taking very much time to upload on the s3
      const compressedImageBuffer = await sharp(req.file.buffer)
        .resize({ width: 1024 })
        .jpeg({ quality: 70 }) 
        .toBuffer();

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: compressedImageBuffer,
        ContentType: 'image/jpeg',
      });

      await s3.send(command);

      // Generate a signed URL for the uploaded image
      // This allows us to access the image without making it public
      const signedUrl = await getSignedUrl(s3, new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      }), { expiresIn: 3600 }); // 1 hour
      
      imageUrl = signedUrl;
    }

    const post = await Post.create({
      title,
      desc,
      tags: foundTags.map(t => t._id),
      image: imageUrl
    });

    res.status(201).json(post);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ error: err.message });
  }
};



// Get All Posts with filters
exports.getAllPosts = async (req, res) => {
  try {
    let { page = 1, limit = 5, sort = 'createdAt', order = 'description', tag } = req.query;

    const query = {};
    if (tag) {
      query.tags = tag; 
    }

    // find the posts based on the query(initially empty if tag exists then it will be filled with the tag)
    const posts = await Post.find(query)
      .populate('tags')
      .sort({ [sort]: order === 'description' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const count = await Post.countDocuments(query);

    res.json({
      total: count,
      page: Number(page),
      limit: Number(limit),
      posts
    });
  } catch (err) {
    console.error('Get posts error:', err);
    res.status(500).json({ error: err.message });
  }
};


// Search Posts
exports.searchPosts = async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) return res.status(400).json({ message: 'Keyword is required' });

    const regex = new RegExp(keyword, 'i');

    // Find tags that match the keyword
    const matchingTags = await Tag.find({ name: regex });
    const matchingTagIds = matchingTags.map(tag => tag._id);
    
    // Find posts that match the keyword in title, desc, image or tags
    const posts = await Post.find({
      $or: [
        { title: regex },
        { desc: regex },
        { image: regex },
        { tags: { $in: matchingTagIds } }
      ]
    }).populate('tags');

    res.json(posts);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Filter posts by tags (tag names or tag IDs)
exports.filterPostsByTags = async (req, res) => {
  try {

    // query -> /api/posts/filter?tags=tag1,tag2
    const tagQuery = req.query.tags;

    if (!tagQuery) {
      return res.status(400).json({ message: 'Tag names or IDs are required' });
    }

    // Split the tag names by comma and trim whitespace
    // This allows for multiple tags to be passed in the query
    const tagValues = tagQuery.split(',').map(tag => tag.trim());

    // Find tags in the database that match the provided names
    const tags = await Tag.find({
      $or: [
        { name: { $in: tagValues } }
      ]
    });

    if (!tags.length) {
      return res.status(404).json({ message: 'No matching tags found' });
    }

    const tagIds = tags.map(tag => tag._id);

    const posts = await Post.find({ tags: { $in: tagIds } }).populate('tags');

    res.json(posts);
  } catch (err) {
    console.error('Error filtering posts:', err);
    res.status(500).json({ error: err.message });
  }
};
