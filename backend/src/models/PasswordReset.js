const mongoose = require('mongoose');

const { Schema } = mongoose;

// One active password-reset challenge per email (upserted). Mirrors the Otp
// model but keyed on email.
const passwordResetSchema = new Schema(
  {
    email: { type: String, required: true, index: true, lowercase: true, trim: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

// TTL index — Mongo auto-deletes the doc once expiresAt passes.
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
