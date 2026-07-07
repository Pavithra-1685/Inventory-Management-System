const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getActivityLogs } = require('../controllers/activityController');
router.use(protect, authorize('admin', 'manager'));
router.get('/', getActivityLogs);
module.exports = router;
