const Tag = require('../models/Tag');

// Create a new tag
exports.createTag = async (req, res) => {
  try {
    const tag = await Tag.create({ name: req.body.name });
    res.status(201).json(tag);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all tags
exports.getAllTags = async (req, res) => {
  try {
    const tags = await Tag.find();
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
