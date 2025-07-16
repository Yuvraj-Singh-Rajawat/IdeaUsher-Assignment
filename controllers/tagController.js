const Tag = require('../models/Tag');

exports.createTag = async (req, res) => {
  try {
    const tag = await Tag.create({ name: req.body.name });
    res.status(201).json(tag);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllTags = async (req, res) => {
  try {
    const tags = await Tag.find();
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
