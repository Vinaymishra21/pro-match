const { FREE_WEEKLY_PROFESSION_UNLOCKS } = require('../config/monetization');

// True if the user currently has an active Pro subscription.
function isProActive(user) {
  return user.tier === 'pro' && user.proExpiresAt && new Date(user.proExpiresAt) > new Date();
}

// Monday 00:00:00.000 UTC of the week containing `date`. Used as the reset
// boundary for weekly cross-profession unlocks.
function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // days since Monday
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Returns this week's unlock state, auto-resetting if the stored weekStart is
// from a previous week. Does NOT persist — caller saves if it mutates.
function getWeeklyUnlockState(user) {
  const currentWeek = getWeekStart();
  const stored = user.professionUnlocks || { weekStart: null, professions: [] };
  const sameWeek = stored.weekStart && getWeekStart(stored.weekStart).getTime() === currentWeek.getTime();

  const professions = sameWeek ? [...stored.professions] : [];
  return {
    weekStart: currentWeek,
    professions,
    used: professions.length,
    limit: FREE_WEEKLY_PROFESSION_UNLOCKS,
    remaining: Math.max(0, FREE_WEEKLY_PROFESSION_UNLOCKS - professions.length)
  };
}

// Generic weekly allowance reader for a { weekStart, count } counter field
// (Super Likes, Boosts). Auto-resets when the stored week is stale. Does NOT
// persist — the caller writes back the incremented counter when it consumes one.
function getWeeklyCounterState(user, field, freeLimit, proLimit) {
  const currentWeek = getWeekStart();
  const stored = user[field] || { weekStart: null, count: 0 };
  const sameWeek =
    stored.weekStart && getWeekStart(stored.weekStart).getTime() === currentWeek.getTime();
  const used = sameWeek ? stored.count || 0 : 0;
  const limit = isProActive(user) ? proLimit : freeLimit;
  return { weekStart: currentWeek, used, limit, remaining: Math.max(0, limit - used) };
}

// Current Boost/Spotlight window state for a user.
function getBoostState(user) {
  const expiresAt = user.boostExpiresAt ? new Date(user.boostExpiresAt) : null;
  const active = Boolean(expiresAt && expiresAt.getTime() > Date.now());
  return {
    active,
    expiresAt: active ? expiresAt : null,
    remainingMs: active ? expiresAt.getTime() - Date.now() : 0
  };
}

// A user may VIEW a given profession's deck if:
//  - it's their own profession (always free), or
//  - they're Pro (unlimited), or
//  - they've already unlocked it this week, or
//  - they still have a free weekly slot left.
function canAccessProfession(user, profession) {
  if (!profession || profession === user.profession) {
    return { allowed: true, reason: 'own' };
  }
  if (isProActive(user)) {
    return { allowed: true, reason: 'pro' };
  }
  const state = getWeeklyUnlockState(user);
  if (state.professions.includes(profession)) {
    return { allowed: true, reason: 'already-unlocked' };
  }
  if (state.remaining > 0) {
    return { allowed: true, reason: 'slot-available', willConsumeSlot: true };
  }
  return { allowed: false, reason: 'limit-reached', remaining: 0 };
}

module.exports = {
  isProActive,
  getWeekStart,
  getWeeklyUnlockState,
  getWeeklyCounterState,
  getBoostState,
  canAccessProfession
};
