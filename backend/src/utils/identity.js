const crypto = require('crypto');
const { BannedIdentity } = require('../models');

// One-way hash of a normalized identifier (phone/email) for the ban-evasion list.
function hashIdentifier(value) {
  return crypto.createHash('sha256').update(String(value || '').trim().toLowerCase()).digest('hex');
}

// Record a user's identifiers on the ban-evasion blocklist (idempotent).
async function blocklistUserIdentifiers(user, reason = 'banned') {
  const entries = [];
  if (user.phone) entries.push({ hash: hashIdentifier(user.phone), kind: 'phone', reason });
  if (user.email) entries.push({ hash: hashIdentifier(user.email), kind: 'email', reason });
  for (const entry of entries) {
    try {
      await BannedIdentity.updateOne({ hash: entry.hash }, { $setOnInsert: entry }, { upsert: true });
    } catch (err) {
      if (err.code !== 11000) throw err; // ignore concurrent duplicate inserts
    }
  }
}

// True if an identifier is on the ban-evasion blocklist.
async function isIdentifierBanned(value) {
  if (!value) return false;
  const found = await BannedIdentity.findOne({ hash: hashIdentifier(value) }).select('_id');
  return Boolean(found);
}

module.exports = { hashIdentifier, blocklistUserIdentifiers, isIdentifierBanned };
