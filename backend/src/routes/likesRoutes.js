const express = require('express');
const { authGuard } = require('../middleware/authGuard');
const { getIncomingLikes, revealLiker } = require('../controllers/likesController');

const router = express.Router();

router.get('/incoming', authGuard, getIncomingLikes);
router.post('/reveal', authGuard, revealLiker);

module.exports = router;
