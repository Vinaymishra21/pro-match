const { User } = require('../models');
const { sanitizeUser } = require('../utils/auth');
const { isProActive } = require('../utils/entitlements');
const { grantPro, grantCredits } = require('../utils/grants');
const payments = require('../utils/payments');
const {
  PRO_PLANS,
  CREDIT_PACKS,
  CREDIT_VALUE_INR
} = require('../config/monetization');

const BILLING_DEV_MODE = process.env.BILLING_DEV_MODE !== 'false' && !payments.LIVE;

function findPack(packId) {
  return CREDIT_PACKS.find((p) => p.id === packId) || null;
}

function findPlan(planId) {
  // Default to monthly when no plan specified (back-compat with old clients).
  if (!planId) return PRO_PLANS.find((p) => p.id === 'monthly') || PRO_PLANS[0];
  return PRO_PLANS.find((p) => p.id === planId) || null;
}

// Resolves what an order is for and how much it costs.
function resolvePurchase(type, packId, planId) {
  if (type === 'pro') {
    const plan = findPlan(planId);
    if (!plan) return null;
    return {
      amountInr: plan.priceInr,
      label: `Pro ${plan.label} (${plan.periodDays} days)`,
      notes: { type: 'pro', planId: plan.id }
    };
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
async function applyPurchase(user, type, packId, planId) {
  if (type === 'pro') {
    const plan = findPlan(planId);
    await grantPro(user, plan.periodDays);
    return { granted: 'pro', planId: plan.id };
  }
  const pack = findPack(packId);
  await grantCredits(user, pack.credits);
  return { granted: 'credits', credits: pack.credits };
}

// GET /billing/catalog — prices the client renders on the paywall.
function getCatalog(req, res) {
  return res.json({
    proPlans: PRO_PLANS,
    creditPacks: CREDIT_PACKS,
    creditValueInr: CREDIT_VALUE_INR,
    devMode: BILLING_DEV_MODE,
    keyId: payments.KEY_ID || null
  });
}

// POST /billing/create-order { type:'pro'|'credits', packId?, planId? }
async function createOrder(req, res) {
  const { type, packId, planId } = req.body;
  const purchase = resolvePurchase(type, packId, planId);
  if (!purchase) {
    return res.status(400).json({ message: 'Invalid purchase type, plan or pack' });
  }

  const receipt = `${req.auth.id}_${type}_${packId || planId || 'pro'}`;
  const order = await payments.createOrder(purchase.amountInr, receipt, {
    ...purchase.notes,
    userId: String(req.auth.id)
  });

  return res.json({
    order,
    keyId: payments.KEY_ID || null,
    devMode: BILLING_DEV_MODE,
    purchase: { type, packId: packId || null, planId: planId || null, amountInr: purchase.amountInr, label: purchase.label }
  });
}

// POST /billing/verify { type, packId?, orderId, paymentId, signature }
// Client calls this after Razorpay checkout. In dev/stub mode signature checks
// pass and the entitlement is granted immediately.
async function verifyPayment(req, res) {
  const { type, packId, planId, orderId, paymentId, signature } = req.body;

  const purchase = resolvePurchase(type, packId, planId);
  if (!purchase) {
    return res.status(400).json({ message: 'Invalid purchase type, plan or pack' });
  }

  const ok = payments.verifyPaymentSignature({ orderId, paymentId, signature });
  if (!ok) {
    return res.status(400).json({ message: 'Payment verification failed', code: 'BAD_SIGNATURE' });
  }

  const user = await User.findById(req.auth.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const result = await applyPurchase(user, type, packId, planId);
  return res.json({ ok: true, ...result, user: sanitizeUser(user), isPro: isProActive(user) });
}

// POST /billing/dev/grant { type:'pro'|'credits', packId? }
// Test-only shortcut to grant entitlements without any payment. Disabled when
// real Razorpay keys are configured.
async function devGrant(req, res) {
  if (!BILLING_DEV_MODE) {
    return res.status(403).json({ message: 'Dev grant disabled in live billing mode' });
  }

  const { type, packId, planId } = req.body;
  if (!resolvePurchase(type, packId, planId)) {
    return res.status(400).json({ message: 'Invalid purchase type, plan or pack' });
  }

  const user = await User.findById(req.auth.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const result = await applyPurchase(user, type, packId, planId);
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
      await applyPurchase(user, notes.type, notes.packId, notes.planId);
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
