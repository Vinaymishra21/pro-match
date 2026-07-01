const { User } = require('../models');
const { getWeeklyCounterState } = require('./entitlements');

// Spends one unit of a weekly-allowance consumable (Super Like, Boost). Tries
// the free weekly allowance first, then falls back to the credits wallet. All
// mutations are atomic findOneAndUpdate ops (never a full-doc save) so a
// concurrent credit spend elsewhere can't be clobbered.
//
// opts:
//   field       - the { weekStart, count } counter field on the user
//   freeLimit   - weekly allowance for free users
//   proLimit    - weekly allowance for Pro users
//   costCredits - credits charged once the allowance is exhausted
//   extraSet    - optional extra $set applied in the same atomic update
//                 (e.g. { boostExpiresAt } so the debit + activation are one op)
//
// Returns { ok, via: 'allowance'|'credits', charged, user, remaining } on
// success, or { ok:false, code:'INSUFFICIENT', costCredits, credits } when the
// user has neither allowance nor enough credits.
async function spendAllowanceOrCredits(user, { field, freeLimit, proLimit, costCredits, extraSet = {} }) {
  const state = getWeeklyCounterState(user, field, freeLimit, proLimit);
  const hasExtra = Object.keys(extraSet).length > 0;

  if (state.remaining > 0) {
    const updated = await User.findOneAndUpdate(
      { _id: user.id },
      { $set: { [field]: { weekStart: state.weekStart, count: state.used + 1 }, ...extraSet } },
      { new: true }
    );
    return { ok: true, via: 'allowance', charged: 0, user: updated, remaining: Math.max(0, state.remaining - 1) };
  }

  if ((user.credits || 0) >= costCredits) {
    const update = { $inc: { credits: -costCredits } };
    if (hasExtra) update.$set = extraSet;
    const updated = await User.findOneAndUpdate(
      { _id: user.id, credits: { $gte: costCredits } },
      update,
      { new: true }
    );
    if (updated) {
      return { ok: true, via: 'credits', charged: costCredits, user: updated, remaining: 0 };
    }
  }

  return { ok: false, code: 'INSUFFICIENT', costCredits, credits: user.credits || 0 };
}

module.exports = { spendAllowanceOrCredits };
