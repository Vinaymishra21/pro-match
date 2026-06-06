// Payment gateway abstraction (Razorpay). Stays in DEV/stub mode until you set
// RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET and `npm i razorpay`. In stub mode no
// real money moves — orders are faked and verification always succeeds so the
// entire entitlement flow is testable without keys.
const crypto = require('crypto');

const KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

const LIVE = Boolean(KEY_ID && KEY_SECRET);

let client = null;
function getClient() {
  if (!LIVE) return null;
  if (client) return client;
  // Lazy-require so the app runs without the razorpay package installed.
  // eslint-disable-next-line global-require
  const Razorpay = require('razorpay');
  client = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
  return client;
}

// amountInr -> order. In stub mode returns a deterministic fake order.
async function createOrder(amountInr, receipt, notes = {}) {
  if (!LIVE) {
    return {
      id: `order_stub_${receipt}`,
      amount: amountInr * 100,
      currency: 'INR',
      receipt,
      notes,
      stub: true
    };
  }
  const order = await getClient().orders.create({
    amount: amountInr * 100, // paise
    currency: 'INR',
    receipt,
    notes
  });
  return { ...order, stub: false };
}

// Verifies the client-side checkout signature (order_id|payment_id).
function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (!LIVE) return true; // stub mode: accept
  const expected = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}

// Verifies a Razorpay webhook payload signature.
function verifyWebhookSignature(rawBody, signature) {
  if (!WEBHOOK_SECRET) return false;
  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
  return expected === signature;
}

module.exports = {
  LIVE,
  KEY_ID,
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature
};
