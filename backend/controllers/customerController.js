const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const APIFeatures = require('../utils/apiFeatures');
const ActivityLog = require('../models/ActivityLog');

exports.getCustomers = async (req, res) => {
  const features = new APIFeatures(Customer.find(), req.query)
    .search(['name', 'email', 'phone']).filter().sort();
  const total = await features.count();
  features.paginate();
  const customers = await features.query;
  res.status(200).json({ success: true, count: customers.length, total, pages: Math.ceil(total / (features.limit || 20)), data: customers });
};

exports.getCustomer = async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
  const sales = await Sale.find({ customer: req.params.id }).sort('-createdAt').limit(10).populate('items.product', 'name sku');
  res.status(200).json({ success: true, data: { ...customer.toObject(), recentSales: sales } });
};

exports.createCustomer = async (req, res) => {
  req.body.createdBy = req.user._id;
  const customer = await Customer.create(req.body);
  await ActivityLog.create({ user: req.user._id, action: 'create', module: 'customer', description: `Created customer: ${customer.name}`, entityId: customer._id, entityType: 'Customer', ipAddress: req.ip });
  res.status(201).json({ success: true, data: customer });
};

exports.updateCustomer = async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
  res.status(200).json({ success: true, data: customer });
};

exports.deleteCustomer = async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
  await customer.deleteOne();
  res.status(200).json({ success: true, message: 'Customer deleted' });
};
