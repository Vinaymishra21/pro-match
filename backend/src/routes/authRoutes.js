const express = require('express');
const { register, login, requestOtp, verifyOtp } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/otp/request', requestOtp);
router.post('/otp/verify', verifyOtp);

module.exports = router;
