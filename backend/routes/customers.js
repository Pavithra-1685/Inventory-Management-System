const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } = require('../controllers/customerController');
router.use(protect);
router.route('/').get(getCustomers).post(authorize('admin', 'manager', 'staff'), createCustomer);
router.route('/:id').get(getCustomer).put(authorize('admin', 'manager', 'staff'), updateCustomer).delete(authorize('admin'), deleteCustomer);
module.exports = router;
