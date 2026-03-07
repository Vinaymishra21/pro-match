const express = require('express');
const { authGuard } = require('../middleware/authGuard');
const { getDiscover } = require('../controllers/discoverController');

const router = express.Router();

router.get('/', authGuard, getDiscover);

module.exports = router;
