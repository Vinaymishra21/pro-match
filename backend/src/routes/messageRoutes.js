const express = require('express');
const { authGuard } = require('../middleware/authGuard');
const { getMessages, sendMessage } = require('../controllers/messageController');

const router = express.Router();

router.get('/:matchId', authGuard, getMessages);
router.post('/:matchId', authGuard, sendMessage);

module.exports = router;
