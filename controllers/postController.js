const Post = require('../models/Post');
const Tag = require('../models/Tag');
const s3 = require('../config/s3');
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuid } = require('uuid');
const sharp = require('sharp'); 

exports.createPost = async (req, res) => {
  try {
    const { title, desc } = req.body;
    let tagNames = req.body.tags;

    if (!tagNames) return res.status(400).json({ message: 'Tags are required' });

    if (typeof tagNames === 'string') {
      try {
        tagNames = JSON.parse(tagNames);
      } catch {
        return res.status(400).json({ message: 'Tags must be a valid JSON array' });
      }
    }

    if (!Array.isArray(tagNames)) {
      return res.status(400).json({ message: 'Tags must be an array' });
    }

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

    const matchingTags = await Tag.find({ name: regex });
    const matchingTagIds = matchingTags.map(tag => tag._id);

    const posts = await Post.find({
      $or: [
        { title: regex },
        { desc: regex },
        { image: regex },
        { tags: { $in: matchingTagIds } } // posts that include matching tag IDs
      ]
    }).populate('tags');

    res.json(posts);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
};