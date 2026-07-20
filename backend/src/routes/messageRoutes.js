const express = require('express');
const { authGuard } = require('../middleware/authGuard');
const { getMessages, sendMessage, markRead } = require('../controllers/messageController');

const router = express.Router();

router.get('/:matchId', authGuard, getMessages);
router.post('/:matchId', authGuard, sendMessage);
router.post('/:matchId/read', authGuard, markRead);

module.exports = router;
