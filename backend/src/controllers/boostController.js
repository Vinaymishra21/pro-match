const { User } = require('../models');
const { isProActive, getWeeklyCounterState, getBoostState } = require('../utils/entitlements');
const { spendAllowanceOrCredits } = require('../utils/consumables');
const {
  BOOST_COST_CREDITS,
  BOOST_DURATION_MINUTES,
  FREE_WEEKLY_BOOSTS,
  PRO_WEEKLY_BOOSTS
} = require('../config/monetization');

const MIN_MS = 60 * 1000;

// POST /boost/activate — start (or extend) a Boost/Spotlight window. Uses the
// weekly free allowance first (Pro gets one/week), otherwise charges credits.
async function activateBoost(req, res) {
  const me = await User.findById(req.auth.id);
  if (!me) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Extend from the current expiry if a boost is already running, else from now.
  const current = getBoostState(me);
  const base = current.active ? current.expiresAt.getTime() : Date.now();
  const newExpiry = new Date(base + BOOST_DURATION_MINUTES * MIN_MS);

  const result = await spendAllowanceOrCredits(me, {
    field: 'boostUsage',
    freeLimit: FREE_WEEKLY_BOOSTS,
    proLimit: PRO_WEEKLY_BOOSTS,
    costCredits: BOOST_COST_CREDITS,
    extraSet: { boostExpiresAt: newExpiry }
  });

  if (!result.ok) {
    return res.status(402).json({
      message: 'Not enough credits to Boost. Buy credits or go Pro for a free weekly Boost.',
      code: 'INSUFFICIENT_BOOST',
      costCredits: BOOST_COST_CREDITS,
      credits: result.credits
    });
  }

  return res.json({
    ok: true,
    charged: result.charged,
    via: result.via,
    credits: result.user.credits,
    boost: getBoostState(result.user),
    durationMinutes: BOOST_DURATION_MINUTES
  });
}

// GET /boost/status — current boost window + this week's allowance, for the UI.
async function getBoostStatus(req, res) {
  const me = await User.findById(req.auth.id);
  if (!me) {
    return res.status(404).json({ message: 'User not found' });
  }

  const allowance = getWeeklyCounterState(me, 'boostUsage', FREE_WEEKLY_BOOSTS, PRO_WEEKLY_BOOSTS);
  return res.json({
    boost: getBoostState(me),
    allowance,
    costCredits: BOOST_COST_CREDITS,
    durationMinutes: BOOST_DURATION_MINUTES,
    credits: me.credits,
    isPro: isProActive(me)
  });
}

module.exports = { activateBoost, getBoostStatus };
