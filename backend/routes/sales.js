const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getSales, getSale, createSale, updateSale, deleteSale, generateInvoice } = require('../controllers/saleController');
router.use(protect);
router.route('/').get(getSales).post(authorize('admin', 'manager', 'staff'), createSale);
router.route('/:id').get(getSale).put(authorize('admin', 'manager'), updateSale).delete(authorize('admin'), deleteSale);
router.get('/:id/invoice', generateInvoice);
module.exports = router;
