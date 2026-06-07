const express = require('express');
const { adminGuard } = require('../middleware/adminGuard');
const admin = require('../controllers/adminController');

const router = express.Router();

// Public (login). Everything else requires a valid admin token.
router.post('/login', admin.login);

router.get('/stats', adminGuard, admin.getStats);
router.get('/analytics', adminGuard, admin.getAnalytics);
router.get('/users', adminGuard, admin.listUsers);
router.get('/users/:id', adminGuard, admin.getUser);
router.post('/users/:id/action', adminGuard, admin.userAction);
router.get('/reports', adminGuard, admin.listReports);
router.post('/reports/:id', adminGuard, admin.updateReport);
router.get('/matches', adminGuard, admin.listMatches);
router.get('/matches/:id/messages', adminGuard, admin.getConversation);

module.exports = router;
