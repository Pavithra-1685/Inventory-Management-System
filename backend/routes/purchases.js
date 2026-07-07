const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getPurchases, getPurchase, createPurchase, updatePurchase, receivePurchase, deletePurchase } = require('../controllers/purchaseController');
router.use(protect);
router.route('/').get(getPurchases).post(authorize('admin', 'manager'), createPurchase);
router.route('/:id').get(getPurchase).put(authorize('admin', 'manager'), updatePurchase).delete(authorize('admin'), deletePurchase);
router.put('/:id/receive', authorize('admin', 'manager'), receivePurchase);
module.exports = router;
