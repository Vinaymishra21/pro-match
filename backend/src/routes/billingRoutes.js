const express = require('express');
const { authGuard } = require('../middleware/authGuard');
const {
  getCatalog,
  createOrder,
  verifyPayment,
  devGrant,
  webhook
} = require('../controllers/billingController');

const router = express.Router();

router.get('/catalog', authGuard, getCatalog);
router.post('/create-order', authGuard, createOrder);
router.post('/verify', authGuard, verifyPayment);
router.post('/dev/grant', authGuard, devGrant);

// Webhook needs the raw body for signature verification (no auth — Razorpay calls it).
router.post('/webhook', express.raw({ type: 'application/json' }), webhook);

module.exports = router;
