const express = require('express');
const { authGuard } = require('../middleware/authGuard');
const { upsertSwipe, getMatches } = require('../controllers/swipeController');

const router = express.Router();

router.post('/', authGuard, upsertSwipe);
router.get('/matches', authGuard, getMatches);

module.exports = router;
