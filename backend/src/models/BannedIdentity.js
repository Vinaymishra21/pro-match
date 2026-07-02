const mongoose = require('mongoose');

const { Schema } = mongoose;

// Ban-evasion blocklist. When an account is banned we store a one-way hash of
// its identifiers (phone, email) here; new signups matching a hash are refused.
// A hash (not the raw value) so this list isn't itself a PII leak.
const bannedIdentitySchema = new Schema(
  {
    // sha256 of the normalized identifier.
    hash: { type: String, required: true, unique: true },
    kind: { type: String, enum: ['phone', 'email'], required: true },
    reason: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('BannedIdentity', bannedIdentitySchema);
