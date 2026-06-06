const { User } = require('../models');
const { sanitizeUser } = require('../utils/auth');
const { isProActive } = require('../utils/entitlements');
const { grantPro, grantCredits } = require('../utils/grants');
const payments = require('../utils/payments');
const {
  PRO_PRICE_INR,
  PRO_PERIOD_DAYS,
  CREDIT_PACKS,
  CREDIT_VALUE_INR
} = require('../config/monetization');

const BILLING_DEV_MODE = process.env.BILLING_DEV_MODE !== 'false' && !payments.LIVE;

function findPack(packId) {
  return CREDIT_PACKS.find((p) => p.id === packId) || null;
}

// Resolves what an order is for and how much it costs.
function resolvePurchase(type, packId) {
  if (type === 'pro') {
    return { amountInr: PRO_PRICE_INR, label: `Pro (${PRO_PERIOD_DAYS} days)`, notes: { type: 'pro' } };
  }
  if (type === 'credits') {
    const pack = findPack(packId);
    if (!pack) return null;
    return {
      amountInr: pack.priceInr,
      label: `${pack.credits} credits`,
      notes: { type: 'credits', packId }
    };
  }
  return null;
}

// Applies the entitlement for a verified purchase.
async function applyPurchase(user, type, packId) {
  if (type === 'pro') {
    await grantPro(user);
    return { granted: 'pro' };
  }
  const pack = findPack(packId);
  await grantCredits(user, pack.credits);
  return { granted: 'credits', credits: pack.credits };
}

// GET /billing/catalog — prices the client renders on the paywall.
function getCatalog(req, res) {
  return res.json({
    pro: { priceInr: PRO_PRICE_INR, periodDays: PRO_PERIOD_DAYS },
    creditPacks: CREDIT_PACKS,
    creditValueInr: CREDIT_VALUE_INR,
    devMode: BILLING_DEV_MODE,
    keyId: payments.KEY_ID || null
  });
}

// POST /billing/create-order { type:'pro'|'credits', packId? }
async function createOrder(req, res) {
  const { type, packId } = req.body;
  const purchase = resolvePurchase(type, packId);
  if (!purchase) {
    return res.status(400).json({ message: 'Invalid purchase type or pack' });
  }

  const receipt = `${req.auth.id}_${type}_${packId || 'pro'}`;
  const order = await payments.createOrder(purchase.amountInr, receipt, {
    ...purchase.notes,
    userId: String(req.auth.id)
  });

  return res.json({
    order,
    keyId: payments.KEY_ID || null,
    devMode: BILLING_DEV_MODE,
    purchase: { type, packId: packId || null, amountInr: purchase.amountInr, label: purchase.label }
  });
}

// POST /billing/verify { type, packId?, orderId, paymentId, signature }
// Client calls this after Razorpay checkout. In dev/stub mode signature checks
// pass and the entitlement is granted immediately.
async function verifyPayment(req, res) {
  const { type, packId, orderId, paymentId, signature } = req.body;

  const purchase = resolvePurchase(type, packId);
  if (!purchase) {
    return res.status(400).json({ message: 'Invalid purchase type or pack' });
  }

  const ok = payments.verifyPaymentSignature({ orderId, paymentId, signature });
  if (!ok) {
    return res.status(400).json({ message: 'Payment verification failed', code: 'BAD_SIGNATURE' });
  }

  const user = await User.findById(req.auth.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const result = await applyPurchase(user, type, packId);
  return res.json({ ok: true, ...result, user: sanitizeUser(user), isPro: isProActive(user) });
}

// POST /billing/dev/grant { type:'pro'|'credits', packId? }
// Test-only shortcut to grant entitlements without any payment. Disabled when
// real Razorpay keys are configured.
async function devGrant(req, res) {
  if (!BILLING_DEV_MODE) {
    return res.status(403).json({ message: 'Dev grant disabled in live billing mode' });
  }

  const { type, packId } = req.body;
  if (!resolvePurchase(type, packId)) {
    return res.status(400).json({ message: 'Invalid purchase type or pack' });
  }

  const user = await User.findById(req.auth.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const result = await applyPurchase(user, type, packId);
  return res.json({ ok: true, dev: true, ...result, user: sanitizeUser(user), isPro: isProActive(user) });
}

// POST /billing/webhook — Razorpay server-to-server confirmation (the reliable
// grant path). Mounted with a raw body parser so the signature can be verified.
async function webhook(req, res) {
  const signature = req.headers['x-razorpay-signature'];
  const raw = req.body; // Buffer (raw parser)

  if (!payments.verifyWebhookSignature(raw, signature)) {
    return res.status(400).json({ message: 'Invalid webhook signature' });
  }

  let event;
  try {
    event = JSON.parse(raw.toString('utf-8'));
  } catch {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  // Grant on successful payment capture using the notes we attached at order time.
  if (event.event === 'payment.captured') {
    const notes = event.payload?.payment?.entity?.notes || {};
    const user = notes.userId ? await User.findById(notes.userId) : null;
    if (user && notes.type) {
      await applyPurchase(user, notes.type, notes.packId);
    }
  }

  return res.json({ received: true });
}

module.exports = {
  getCatalog,
  createOrder,
  verifyPayment,
  devGrant,
  webhook
};
