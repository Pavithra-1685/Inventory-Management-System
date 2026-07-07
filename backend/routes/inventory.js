const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getTransactions, adjustStock, getValuation } = require('../controllers/inventoryController');
router.use(protect);
router.get('/', getTransactions);
router.get('/valuation', getValuation);
router.post('/adjust', authorize('admin', 'manager'), adjustStock);
module.exports = router;
