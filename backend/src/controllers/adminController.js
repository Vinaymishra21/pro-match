const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Match, Message, Report, Swipe, Reveal } = require('../models');
const { CREDIT_PACKS, PRO_PRICE_INR, REVEAL_COST_CREDITS, CREDIT_VALUE_INR } = require('../config/monetization');

function adminToken(user) {
  return jwt.sign({ id: user.id, admin: true }, process.env.JWT_SECRET, { expiresIn: '1d' });
}

// POST /admin/login { email, password } — admin-only email/password login.
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const user = await User.findOne({ email: String(email).trim().toLowerCase() });
  if (!user || !user.isAdmin || !user.passwordHash) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  return res.json({ token: adminToken(user), admin: { id: user.id, name: user.name, email: user.email } });
}

// GET /admin/stats — at-a-glance counts for the dashboard home.
async function getStats(_req, res) {
  const [users, active, verified, pro, matches, messages, reportsOpen, deactivated] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isDeactivated: { $ne: true } }),
    User.countDocuments({ professionVerified: true }),
    User.countDocuments({ tier: 'pro' }),
    Match.countDocuments({ status: 'active' }),
    Message.countDocuments({}),
    Report.countDocuments({ status: 'open' }),
    User.countDocuments({ isDeactivated: true })
  ]);

  // Users per profession (top professions).
  const byProfession = await User.aggregate([
    { $match: { profession: { $ne: '' } } },
    { $group: { _id: '$profession', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  return res.json({
    stats: { users, active, deactivated, verified, pro, matches, messages, reportsOpen },
    byProfession: byProfession.map((p) => ({ profession: p._id, count: p.count }))
  });
}

// GET /admin/analytics?days=14 — time series + breakdowns + revenue estimate.
async function getAnalytics(req, res) {
  const days = Math.min(90, Math.max(7, parseInt(req.query.days, 10) || 14));
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  // Build an empty day-bucket map (YYYY-MM-DD → 0) to fill from aggregations.
  const buckets = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    buckets.push(d.toISOString().slice(0, 10));
  }
  const emptySeries = () => Object.fromEntries(buckets.map((b) => [b, 0]));

  const groupByDay = (createdField = 'createdAt') => [
    { $match: { [createdField]: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: `$${createdField}` } },
        count: { $sum: 1 }
      }
    }
  ];

  const [signupAgg, matchAgg, messageAgg, genderAgg, verifiedAgg, revealCount] = await Promise.all([
    User.aggregate(groupByDay()),
    Match.aggregate(groupByDay()),
    Message.aggregate(groupByDay()),
    User.aggregate([
      { $match: { gender: { $ne: '' } } },
      { $group: { _id: '$gender', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Promise.all([
      User.countDocuments({ professionVerified: true }),
      User.countDocuments({ professionVerified: { $ne: true } })
    ]),
    Reveal.countDocuments({})
  ]);

  const fill = (agg) => {
    const map = emptySeries();
    agg.forEach((row) => {
      if (row._id in map) map[row._id] = row.count;
    });
    return buckets.map((day) => ({ day, count: map[day] }));
  };

  // Revenue estimate (no payment records yet). Pro = subscribers × price;
  // credits ≈ reveals × reveal cost × credit value. Clearly an estimate.
  const proCount = await User.countDocuments({ tier: 'pro' });
  const revenue = {
    proInr: proCount * PRO_PRICE_INR,
    creditsInr: revealCount * REVEAL_COST_CREDITS * CREDIT_VALUE_INR,
    get totalInr() {
      return this.proInr + this.creditsInr;
    },
    estimated: true
  };

  return res.json({
    days,
    signups: fill(signupAgg),
    matches: fill(matchAgg),
    messages: fill(messageAgg),
    byGender: genderAgg.map((g) => ({ gender: g._id, count: g.count })),
    verified: { verified: verifiedAgg[0], unverified: verifiedAgg[1] },
    revenue: { proInr: revenue.proInr, creditsInr: revenue.creditsInr, totalInr: revenue.totalInr, estimated: true },
    packs: CREDIT_PACKS
  });
}

// GET /admin/users?search=&page=&limit= — paginated user list.
async function listUsers(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
  const search = (req.query.search || '').trim();

  const query = {};
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ name: rx }, { email: rx }, { phone: rx }, { profession: rx }];
  }

  const [total, users] = await Promise.all([
    User.countDocuments(query),
    User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
  ]);

  return res.json({
    total,
    page,
    pages: Math.ceil(total / limit),
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email || '',
      phone: u.phone || '',
      profession: u.profession || '',
      age: u.age,
      gender: u.gender || '',
      tier: u.tier,
      credits: u.credits,
      professionVerified: u.professionVerified,
      isDeactivated: u.isDeactivated,
      isAdmin: u.isAdmin,
      photo: (u.photos && u.photos[0]) || '',
      createdAt: u.createdAt
    }))
  });
}

// GET /admin/users/:id — full detail for one user.
async function getUser(req, res) {
  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ message: 'User not found' });
  return res.json({ user: u.toJSON() });
}

// POST /admin/users/:id/action { action } — moderation actions on a user.
async function userAction(req, res) {
  const { action } = req.body;
  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ message: 'User not found' });

  switch (action) {
    case 'deactivate':
      u.isDeactivated = true;
      u.deactivatedAt = new Date();
      break;
    case 'reactivate':
      u.isDeactivated = false;
      u.deactivatedAt = null;
      break;
    case 'ban':
      u.isBanned = true;
      u.bannedAt = new Date();
      // Also hide them from discovery immediately.
      u.isDeactivated = true;
      u.deactivatedAt = u.deactivatedAt || new Date();
      break;
    case 'unban':
      u.isBanned = false;
      u.bannedAt = null;
      u.isDeactivated = false;
      u.deactivatedAt = null;
      break;
    case 'verify':
      u.professionVerified = true;
      break;
    case 'unverify':
      u.professionVerified = false;
      break;
    default:
      return res.status(400).json({ message: 'Unknown action' });
  }

  await u.save();
  return res.json({ user: u.toJSON() });
}

// GET /admin/reports?status=&page= — moderation queue.
async function listReports(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
  const status = (req.query.status || '').trim();

  const query = {};
  if (status) query.status = status;

  const [total, reports] = await Promise.all([
    Report.countDocuments(query),
    Report.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('reporter', 'name profession')
      .populate('reportedUser', 'name profession isDeactivated photos')
  ]);

  return res.json({
    total,
    page,
    pages: Math.ceil(total / limit),
    reports: reports.map((r) => ({
      id: r.id,
      reason: r.reason,
      note: r.note,
      status: r.status,
      alsoBlocked: r.alsoBlocked,
      createdAt: r.createdAt,
      reporter: r.reporter ? { id: r.reporter.id, name: r.reporter.name, profession: r.reporter.profession } : null,
      reportedUser: r.reportedUser
        ? {
            id: r.reportedUser.id,
            name: r.reportedUser.name,
            profession: r.reportedUser.profession,
            isDeactivated: r.reportedUser.isDeactivated,
            photo: (r.reportedUser.photos && r.reportedUser.photos[0]) || ''
          }
        : null
    }))
  });
}

// POST /admin/reports/:id { status, banUser? } — resolve/dismiss a report,
// optionally banning (deactivating) the reported user.
async function updateReport(req, res) {
  const { status, banUser } = req.body;
  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ message: 'Report not found' });

  if (status && ['open', 'reviewing', 'resolved', 'dismissed'].includes(status)) {
    report.status = status;
  }
  await report.save();

  if (banUser && report.reportedUser) {
    // A moderation ban is permanent-until-lifted (isBanned), not a reversible
    // self-deactivation. Hide them from discovery too.
    await User.updateOne(
      { _id: report.reportedUser },
      { isBanned: true, bannedAt: new Date(), isDeactivated: true, deactivatedAt: new Date() }
    );
  }

  return res.json({ ok: true });
}

// GET /admin/matches?page= — match list for investigation.
async function listMatches(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));

  const [total, matches] = await Promise.all([
    Match.countDocuments({}),
    Match.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userA', 'name profession')
      .populate('userB', 'name profession')
  ]);

  const withCounts = await Promise.all(
    matches.map(async (m) => ({
      id: m.id,
      status: m.status,
      crossProfession: m.crossProfession,
      createdAt: m.createdAt,
      lastMessageAt: m.lastMessageAt,
      messageCount: await Message.countDocuments({ matchId: m._id }),
      userA: m.userA ? { id: m.userA.id, name: m.userA.name, profession: m.userA.profession } : null,
      userB: m.userB ? { id: m.userB.id, name: m.userB.name, profession: m.userB.profession } : null
    }))
  );

  return res.json({ total, page, pages: Math.ceil(total / limit), matches: withCounts });
}

// GET /admin/matches/:id/messages — the conversation (for abuse investigation).
async function getConversation(req, res) {
  const match = await Match.findById(req.params.id)
    .populate('userA', 'name')
    .populate('userB', 'name');
  if (!match) return res.status(404).json({ message: 'Match not found' });

  const messages = await Message.find({ matchId: match._id }).sort({ createdAt: 1 });

  return res.json({
    match: {
      id: match.id,
      userA: match.userA ? { id: match.userA.id, name: match.userA.name } : null,
      userB: match.userB ? { id: match.userB.id, name: match.userB.name } : null
    },
    messages: messages.map((m) => ({
      id: m.id,
      senderId: String(m.senderId),
      text: m.text,
      createdAt: m.createdAt
    }))
  });
}

module.exports = {
  login,
  getStats,
  getAnalytics,
  listUsers,
  getUser,
  userAction,
  listReports,
  updateReport,
  listMatches,
  getConversation
};
