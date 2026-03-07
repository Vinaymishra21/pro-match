const express = require('express');
const { authGuard } = require('../middleware/authGuard');
const { getMe, updateProfession, updateProfile } = require('../controllers/userController');

const router = express.Router();

router.get('/me', authGuard, getMe);
router.patch('/profession', authGuard, updateProfession);
router.patch('/me', authGuard, updateProfile);

module.exports = router;
