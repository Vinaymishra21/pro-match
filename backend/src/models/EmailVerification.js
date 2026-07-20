const mongoose = require('mongoose');

const { Schema } = mongoose;

// One active email-verification challenge per email (upserted). Mirrors Otp /
// PasswordReset but for confirming ownership of a signup email.
const emailVerificationSchema = new Schema(
  {
    email: { type: String, required: true, index: true, lowercase: true, trim: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

// TTL index — Mongo auto-deletes the doc once expiresAt passes.
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);
