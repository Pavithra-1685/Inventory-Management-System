const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const InventoryTransaction = require('../models/InventoryTransaction');
const ActivityLog = require('../models/ActivityLog');
const APIFeatures = require('../utils/apiFeatures');

exports.getPurchases = async (req, res) => {
  const features = new APIFeatures(
    Purchase.find().populate('supplier', 'companyName').populate('createdBy', 'name'),
    req.query
  ).filter().sort().paginate();
  const [purchases, total] = await Promise.all([features.query, Purchase.countDocuments()]);
  res.status(200).json({ success: true, count: purchases.length, total, pages: Math.ceil(total / (features.limit || 20)), data: purchases });
};

exports.getPurchase = async (req, res) => {
  const purchase = await Purchase.findById(req.params.id)
    .populate('supplier', 'companyName contactPerson email phone address')
    .populate('items.product', 'name sku costPrice')
    .populate('createdBy', 'name email');
  if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });
  res.status(200).json({ success: true, data: purchase });
};

exports.createPurchase = async (req, res) => {
  req.body.createdBy = req.user._id;
  const purchase = await Purchase.create(req.body);
  await Supplier.findByIdAndUpdate(purchase.supplier, { $inc: { totalPurchases: 1, totalAmount: purchase.totalAmount } });
  await ActivityLog.create({ user: req.user._id, action: 'create', module: 'purchase', description: `Created purchase order: ${purchase.purchaseNumber}`, entityId: purchase._id, entityType: 'Purchase', ipAddress: req.ip });
  res.status(201).json({ success: true, data: purchase });
};

exports.updatePurchase = async (req, res) => {
  const purchase = await Purchase.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });
  res.status(200).json({ success: true, data: purchase });
};

exports.receivePurchase = async (req, res) => {
  const purchase = await Purchase.findById(req.params.id).populate('items.product');
  if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });
  if (purchase.status === 'received') return res.status(400).json({ success: false, message: 'Purchase already received' });

  for (const item of purchase.items) {
    const product = await Product.findById(item.product._id || item.product);
    if (product) {
      const previousQty = product.quantity;
      product.quantity += item.quantity;
      await product.save();
      await InventoryTransaction.create({
        product: product._id, type: 'stock_in', quantity: item.quantity,
        previousQuantity: previousQty, newQuantity: product.quantity,
        unitCost: item.unitCost, totalCost: item.totalCost,
        reference: purchase.purchaseNumber, referenceType: 'purchase',
        referenceId: purchase._id, reason: `Received: PO ${purchase.purchaseNumber}`,
        createdBy: req.user._id
      });
    }
  }

  purchase.status = 'received';
  purchase.receivedAt = Date.now();
  await purchase.save();

  await ActivityLog.create({ user: req.user._id, action: 'update', module: 'purchase', description: `Goods received for PO: ${purchase.purchaseNumber}`, entityId: purchase._id, entityType: 'Purchase', ipAddress: req.ip });
  res.status(200).json({ success: true, data: purchase, message: 'Goods received and stock updated' });
};

exports.deletePurchase = async (req, res) => {
  const purchase = await Purchase.findById(req.params.id);
  if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });
  if (purchase.status === 'received') return res.status(400).json({ success: false, message: 'Cannot delete a received PO' });
  await purchase.deleteOne();
  res.status(200).json({ success: true, message: 'Purchase deleted' });
};
