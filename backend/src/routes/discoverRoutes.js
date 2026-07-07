const express = require('express');
const { authGuard } = require('../middleware/authGuard');
const { getDiscover, getAccess, getProfessions } = require('../controllers/discoverController');

const router = express.Router();

// Specific routes before the catch-all so they aren't swallowed by '/'.
router.get('/access', authGuard, getAccess);
router.get('/professions', authGuard, getProfessions);
router.get('/', authGuard, getDiscover);

module.exports = router;
