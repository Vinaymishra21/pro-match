const mongoose = require('mongoose');

const { Schema } = mongoose;

const otpSchema = new Schema(
  {
    phone: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

// TTL index — Mongo auto-deletes the doc once expiresAt passes.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);
