const express = require('express');
const { register, login, requestOtp, verifyOtp, googleAuth } = require('../controllers/authController');
const { authLimiter, otpLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/otp/request', otpLimiter, requestOtp);
router.post('/otp/verify', authLimiter, verifyOtp);
router.post('/google', authLimiter, googleAuth);

module.exports = router;
