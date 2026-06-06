const express = require('express');
const { authGuard } = require('../middleware/authGuard');
const {
  getMe,
  updatePushToken,
  updateProfession,
  verifyProfession,
  updateProfile
} = require('../controllers/userController');

const router = express.Router();

router.get('/me', authGuard, getMe);
router.patch('/push-token', authGuard, updatePushToken);
router.patch('/profession', authGuard, updateProfession);
router.post('/verify-profession', authGuard, verifyProfession);
router.patch('/me', authGuard, updateProfile);

module.exports = router;
