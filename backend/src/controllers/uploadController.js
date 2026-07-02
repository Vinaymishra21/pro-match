const crypto = require('crypto');
const { saveBuffer, publicUrl } = require('../utils/storage');
const { PhotoHash, User } = require('../models');

async function uploadPhoto(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided (field name must be "photo")' });
  }

  const userId = req.auth.id;

  // Exact-duplicate detection: if this exact image already belongs to a DIFFERENT
  // user, that's a strong stolen/reused-photo signal — flag the uploader for
  // review. The upload still succeeds (we don't block on a signal that can false-
  // positive); an admin decides.
  const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
  const dupeOther = await PhotoHash.findOne({ hash, user: { $ne: userId } }).select('_id');
  if (dupeOther) {
    await User.updateOne(
      { _id: userId },
      { flaggedForReview: true, flagReason: 'duplicate photo (matches another account)' }
    );
  }
  try {
    await PhotoHash.updateOne({ hash, user: userId }, { $setOnInsert: { hash, user: userId } }, { upsert: true });
  } catch (err) {
    if (err.code !== 11000) throw err; // ignore concurrent duplicate inserts
  }

  const filename = await saveBuffer(req.file.buffer, req.file.mimetype);
  return res.status(201).json({ url: publicUrl(req, filename), duplicate: Boolean(dupeOther) });
}

module.exports = { uploadPhoto };
