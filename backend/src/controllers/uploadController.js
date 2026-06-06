const { saveBuffer, publicUrl } = require('../utils/storage');

async function uploadPhoto(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided (field name must be "photo")' });
  }

  const filename = await saveBuffer(req.file.buffer, req.file.mimetype);
  return res.status(201).json({ url: publicUrl(req, filename) });
}

module.exports = { uploadPhoto };
