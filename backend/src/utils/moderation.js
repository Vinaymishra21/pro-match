const { User, Report } = require('../models');

// Escalation thresholds (tune here).
const SPAM_STRIKE_SHADOWBAN = 3; // blocked-content attempts before auto shadow ban
const REPORT_SHADOWBAN = 3; // distinct reporters (open reports) before auto shadow ban
const REPORT_WINDOW_DAYS = 30;

// Shadow-ban a user: hidden from discovery + who-likes-you, flagged for admin.
async function shadowBan(userId, reason) {
  await User.updateOne(
    { _id: userId, isShadowBanned: { $ne: true } },
    { isShadowBanned: true, shadowBannedAt: new Date(), flaggedForReview: true, flagReason: reason }
  );
}

// Records a blocked-content attempt. Atomically increments the strike counter and
// shadow-bans once the threshold is reached. Returns { strikes, shadowBanned }.
async function recordSpamStrike(userId, reason = 'repeated blocked content') {
  const updated = await User.findByIdAndUpdate(
    userId,
    { $inc: { spamStrikes: 1 } },
    { new: true, select: 'spamStrikes isShadowBanned' }
  );
  if (!updated) return { strikes: 0, shadowBanned: false };

  if (updated.spamStrikes >= SPAM_STRIKE_SHADOWBAN && !updated.isShadowBanned) {
    await shadowBan(userId, reason);
    return { strikes: updated.spamStrikes, shadowBanned: true };
  }
  return { strikes: updated.spamStrikes, shadowBanned: updated.isShadowBanned };
}

// After a new report, shadow-ban if enough DISTINCT reporters flagged this user
// within the window. Distinct-reporter count guards against one person spamming
// reports to nuke someone.
async function maybeShadowBanFromReports(reportedUserId) {
  const since = new Date(Date.now() - REPORT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const reporters = await Report.distinct('reporter', {
    reportedUser: reportedUserId,
    createdAt: { $gte: since }
  });
  if (reporters.length >= REPORT_SHADOWBAN) {
    await shadowBan(reportedUserId, `auto: ${reporters.length} reports in ${REPORT_WINDOW_DAYS}d`);
    return true;
  }
  return false;
}

module.exports = {
  SPAM_STRIKE_SHADOWBAN,
  REPORT_SHADOWBAN,
  REPORT_WINDOW_DAYS,
  shadowBan,
  recordSpamStrike,
  maybeShadowBanFromReports
};
