const multer = require('multer');

// Store uploaded file in memory for validation-first processing
const storage = multer.memoryStorage();

const upload = multer({ storage });

module.exports = upload;
