const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const APIFeatures = require('../utils/apiFeatures');
const ActivityLog = require('../models/ActivityLog');

exports.getSuppliers = async (req, res) => {
  const features = new APIFeatures(Supplier.find(), req.query)
    .search(['companyName', 'email', 'contactPerson']).filter().sort();
  const total = await features.count();
  features.paginate();
  const suppliers = await features.query;
  res.status(200).json({ success: true, count: suppliers.length, total, pages: Math.ceil(total / features.limit), data: suppliers });
};

exports.getSupplier = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
  const purchases = await Purchase.find({ supplier: req.params.id })
    .sort('-createdAt').limit(10).populate('items.product', 'name sku');
  res.status(200).json({ success: true, data: { ...supplier.toObject(), recentPurchases: purchases } });
};

exports.createSupplier = async (req, res) => {
  req.body.createdBy = req.user._id;
  const supplier = await Supplier.create(req.body);
  await ActivityLog.create({
    user: req.user._id, action: 'create', module: 'supplier',
    description: `Created supplier: ${supplier.companyName}`,
    entityId: supplier._id, entityType: 'Supplier', ipAddress: req.ip
  });
  res.status(201).json({ success: true, data: supplier });
};

exports.updateSupplier = async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
  res.status(200).json({ success: true, data: supplier });
};

exports.deleteSupplier = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
  await supplier.deleteOne();
  res.status(200).json({ success: true, message: 'Supplier deleted' });
};
