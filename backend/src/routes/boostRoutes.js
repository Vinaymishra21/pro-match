const express = require('express');
const { authGuard } = require('../middleware/authGuard');
const { billingLimiter } = require('../middleware/rateLimit');
const { activateBoost, getBoostStatus } = require('../controllers/boostController');

const router = express.Router();

router.get('/status', authGuard, getBoostStatus);
router.post('/activate', authGuard, billingLimiter, activateBoost);

module.exports = router;
