const express = require('express');
const {
  register,
  login,
  requestOtp,
  verifyOtp,
  googleAuth,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendEmailVerification
} = require('../controllers/authController');
const { authLimiter, otpLimiter } = require('../middleware/rateLimit');
const { authGuard } = require('../middleware/authGuard');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/otp/request', otpLimiter, requestOtp);
router.post('/otp/verify', authLimiter, verifyOtp);
router.post('/google', authLimiter, googleAuth);
router.post('/password/forgot', otpLimiter, forgotPassword);
router.post('/password/reset', authLimiter, resetPassword);
router.post('/email/verify', authLimiter, authGuard, verifyEmail);
router.post('/email/resend', otpLimiter, authGuard, resendEmailVerification);

module.exports = router;
