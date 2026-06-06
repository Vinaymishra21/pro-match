const express = require('express');
const { authGuard } = require('../middleware/authGuard');
const { blockUser, unblockUser, getBlocked, unmatch } = require('../controllers/safetyController');

const router = express.Router();

router.post('/block', authGuard, blockUser);
router.post('/unblock', authGuard, unblockUser);
router.get('/blocked', authGuard, getBlocked);
router.post('/unmatch', authGuard, unmatch);

module.exports = router;
