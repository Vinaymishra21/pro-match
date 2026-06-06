const express = require('express');
const { authGuard } = require('../middleware/authGuard');
const { getDiscover, getAccess } = require('../controllers/discoverController');

const router = express.Router();

// Specific route before the catch-all so /access isn't swallowed by '/'.
router.get('/access', authGuard, getAccess);
router.get('/', authGuard, getDiscover);

module.exports = router;
