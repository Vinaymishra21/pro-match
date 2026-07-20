const express = require('express');
const { authGuard } = require('../middleware/authGuard');
const { upsertSwipe, getMatches, getUnreadTotal, undoSwipe } = require('../controllers/swipeController');

const router = express.Router();

router.post('/', authGuard, upsertSwipe);
router.post('/undo', authGuard, undoSwipe);
router.get('/matches', authGuard, getMatches);
router.get('/matches/unread', authGuard, getUnreadTotal);

module.exports = router;
