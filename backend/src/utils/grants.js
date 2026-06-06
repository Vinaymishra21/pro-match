const { PRO_PERIOD_DAYS } = require('../config/monetization');
const { isProActive } = require('./entitlements');

const DAY_MS = 24 * 60 * 60 * 1000;

// Grants/extends Pro. If already Pro, the new period stacks on the remaining time.
async function grantPro(user) {
  const base = isProActive(user) ? new Date(user.proExpiresAt).getTime() : Date.now();
  user.tier = 'pro';
  user.proExpiresAt = new Date(base + PRO_PERIOD_DAYS * DAY_MS);
  await user.save();
  return user;
}

async function grantCredits(user, credits) {
  user.credits = (user.credits || 0) + credits;
  await user.save();
  return user;
}

module.exports = { grantPro, grantCredits };
