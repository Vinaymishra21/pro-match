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

// Reverses a spend when the action it paid for is undone (e.g. rewinding a Super
// Like). `via` says which bucket to credit back — must match what the original
// spend returned, so we never over-refund (a credit refund for an allowance
// spend would let Pro users farm credits by super-like-then-undo).
async function refundAllowanceOrCredits(user, { field, freeLimit, proLimit, costCredits, via }) {
  if (via === 'credits') {
    return User.findOneAndUpdate({ _id: user.id }, { $inc: { credits: costCredits } }, { new: true });
  }
  if (via === 'allowance') {
    // Give the weekly unit back only if we're still in the same week it was
    // spent; getWeeklyCounterState returns used:0 once the week has rolled over,
    // in which case the allowance already reset and there's nothing to refund.
    const state = getWeeklyCounterState(user, field, freeLimit, proLimit);
    if (state.used <= 0) return user;
    return User.findOneAndUpdate(
      { _id: user.id },
      { $set: { [field]: { weekStart: state.weekStart, count: state.used - 1 } } },
      { new: true }
    );
  }
  return user;
}

module.exports = { spendAllowanceOrCredits, refundAllowanceOrCredits };
