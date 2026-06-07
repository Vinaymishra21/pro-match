const express = require('express');
const { authGuard } = require('../middleware/authGuard');
const { upsertSwipe, getMatches, undoSwipe } = require('../controllers/swipeController');

const router = express.Router();

router.post('/', authGuard, upsertSwipe);
router.post('/undo', authGuard, undoSwipe);
router.get('/matches', authGuard, getMatches);

module.exports = router;
