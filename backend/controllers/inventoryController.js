const Product = require('../models/Product');
const InventoryTransaction = require('../models/InventoryTransaction');
const ActivityLog = require('../models/ActivityLog');
const APIFeatures = require('../utils/apiFeatures');

// @desc  Get all inventory transactions
exports.getTransactions = async (req, res) => {
  const features = new APIFeatures(
    InventoryTransaction.find()
      .populate('product', 'name sku')
      .populate('createdBy', 'name'),
    req.query
  ).filter().sort().paginate();
  const [transactions, total] = await Promise.all([features.query, InventoryTransaction.countDocuments()]);
  res.status(200).json({ success: true, count: transactions.length, total, data: transactions });
};

// @desc  Adjust stock (manual)
exports.adjustStock = async (req, res) => {
  const { productId, type, quantity, reason } = req.body;
  if (!['stock_in', 'stock_out', 'adjustment', 'damage', 'return'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid transaction type' });
  }
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const previousQty = product.quantity;
  let newQty;

  if (type === 'stock_in' || type === 'return') {
    newQty = previousQty + Number(quantity);
  } else if (type === 'stock_out' || type === 'damage') {
    if (previousQty < quantity) {
      return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${previousQty}` });
    }
    newQty = previousQty - Number(quantity);
  } else {
    // adjustment: quantity is the new absolute value
    newQty = Number(quantity);
  }

  product.quantity = newQty;
  await product.save();

  const transaction = await InventoryTransaction.create({
    product: product._id,
    type,
    quantity: Math.abs(newQty - previousQty) || Number(quantity),
    previousQuantity: previousQty,
    newQuantity: newQty,
    unitCost: product.costPrice,
    totalCost: Math.abs(newQty - previousQty) * product.costPrice,
    reason: reason || `Manual ${type}`,
    referenceType: 'manual',
    createdBy: req.user._id
  });

  await ActivityLog.create({
    user: req.user._id, action: 'update', module: 'inventory',
    description: `Stock ${type} for ${product.name}: ${previousQty} → ${newQty}`,
    entityId: product._id, entityType: 'Product', ipAddress: req.ip
  });

  res.status(200).json({ success: true, data: transaction, product: { name: product.name, quantity: newQty } });
};

// @desc  Get stock valuation
exports.getValuation = async (req, res) => {
  const products = await Product.find({ isActive: true }).populate('category', 'name').lean();
  const valuation = products.map(p => ({
    _id: p._id,
    name: p.name,
    sku: p.sku,
    category: p.category?.name,
    quantity: p.quantity,
    costPrice: p.costPrice,
    sellingPrice: p.sellingPrice,
    stockValue: p.quantity * p.costPrice,
    potentialRevenue: p.quantity * p.sellingPrice,
    potentialProfit: p.quantity * (p.sellingPrice - p.costPrice)
  }));

  const totals = valuation.reduce((acc, p) => ({
    totalCostValue: acc.totalCostValue + p.stockValue,
    totalPotentialRevenue: acc.totalPotentialRevenue + p.potentialRevenue,
    totalPotentialProfit: acc.totalPotentialProfit + p.potentialProfit
  }), { totalCostValue: 0, totalPotentialRevenue: 0, totalPotentialProfit: 0 });

  res.status(200).json({ success: true, data: valuation, totals });
};
