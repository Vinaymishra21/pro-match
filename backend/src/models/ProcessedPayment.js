const mongoose = require('mongoose');

const { Schema } = mongoose;

// Idempotency ledger for granted purchases. Razorpay delivers the same payment
// via BOTH the client `/verify` call AND the server `/webhook` (which also
// retries on failure), so a naive "grant on each" double-credits the user. We
// insert one row per payment keyed by a unique `key`; the unique index makes the
// second attempt fail with E11000, which the controller treats as "already
// granted, skip".
const processedPaymentSchema = new Schema(
  {
    key: { type: String, required: true, unique: true }, // paymentId (or orderId fallback)
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, default: '' }, // 'pro' | 'credits'
    amountInr: { type: Number, default: 0 },
    source: { type: String, enum: ['verify', 'webhook'], required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProcessedPayment', processedPaymentSchema);
