const express = require('express');
const multer = require('multer');
const { authGuard } = require('../middleware/authGuard');
const { uploadPhoto } = require('../controllers/uploadController');

const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Only JPEG, PNG or WebP images are allowed'));
  }
});

const router = express.Router();

router.post('/photo', authGuard, upload.single('photo'), uploadPhoto);

module.exports = router;
