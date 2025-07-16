const express = require('express');
const postRouter = express.Router();
const upload = require('../middleware/upload');
const { createPost, getAllPosts, searchPosts, filterPostsByTags } = require('../controllers/postController');

postRouter.post('/', upload.single('image'), createPost);
postRouter.get('/', getAllPosts);
postRouter.get('/search', searchPosts);
postRouter.get('/filter', filterPostsByTags);

module.exports = postRouter;
