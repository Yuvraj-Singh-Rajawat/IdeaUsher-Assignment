const express = require('express');
const tagRouter = express.Router();
const { createTag, getAllTags } = require('../controllers/tagController');

tagRouter.post('/', createTag);
tagRouter.get('/', getAllTags);

module.exports = tagRouter;
