const express = require('express');
const { authGuard } = require('../middleware/authGuard');
const { billingLimiter } = require('../middleware/rateLimit');
const {
  getCatalog,
  createOrder,
  verifyPayment,
  devGrant,
  webhook
} = require('../controllers/billingController');

const router = express.Router();

// Rate-limit the money-moving POSTs. `catalog` (cheap GET) and `webhook`
// (server-to-server, can legitimately burst) are intentionally left out.
router.get('/catalog', authGuard, getCatalog);
router.post('/create-order', authGuard, billingLimiter, createOrder);
router.post('/verify', authGuard, billingLimiter, verifyPayment);
router.post('/dev/grant', authGuard, billingLimiter, devGrant);

// Webhook needs the raw body for signature verification (no auth — Razorpay calls it).
router.post('/webhook', express.raw({ type: 'application/json' }), webhook);

module.exports = router;
