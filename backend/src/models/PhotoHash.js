const mongoose = require('mongoose');

const { Schema } = mongoose;

// Exact-duplicate photo detection. On upload we store a sha256 of the image
// bytes keyed by user; if the same image is later uploaded by a DIFFERENT user,
// that's a strong catfish / fake-ring signal (stolen or reused photos). This
// catches identical files — not re-encoded variants (that needs perceptual
// hashing + an image lib, which is a later, service-backed upgrade).
const photoHashSchema = new Schema(
  {
    hash: { type: String, required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }
  },
  { timestamps: true }
);

// One row per (hash, user) — re-uploading your own photo isn't a collision.
photoHashSchema.index({ hash: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('PhotoHash', photoHashSchema);
