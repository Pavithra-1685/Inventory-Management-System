const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');

const getDateRange = (period, startDate, endDate) => {
  const now = new Date();
  let start, end;
  if (startDate && endDate) {
    start = new Date(startDate); end = new Date(endDate); end.setHours(23, 59, 59, 999);
  } else if (period === 'today') {
    start = new Date(now.setHours(0,0,0,0)); end = new Date(); end.setHours(23,59,59,999);
  } else if (period === 'week') {
    start = new Date(now); start.setDate(now.getDate() - 7);
    end = new Date(); end.setHours(23,59,59,999);
  } else if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else if (period === 'year') {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }
  return { start, end };
};

// @desc Sales report
exports.getSalesReport = async (req, res) => {
  const { start, end } = getDateRange(req.query.period, req.query.startDate, req.query.endDate);
  const sales = await Sale.find({ createdAt: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } })
    .populate('customer', 'name').populate('items.product', 'name sku').lean();
  const totalRevenue = sales.reduce((s, x) => s + x.totalAmount, 0);
  const totalTax = sales.reduce((s, x) => s + x.tax, 0);
  const totalDiscount = sales.reduce((s, x) => s + x.discount, 0);
  res.status(200).json({ success: true, data: { sales, summary: { count: sales.length, totalRevenue, totalTax, totalDiscount }, period: { start, end } } });
};

// @desc Purchase report
exports.getPurchaseReport = async (req, res) => {
  const { start, end } = getDateRange(req.query.period, req.query.startDate, req.query.endDate);
  const purchases = await Purchase.find({ createdAt: { $gte: start, $lte: end } })
    .populate('supplier', 'companyName').lean();
  const totalSpent = purchases.reduce((s, x) => s + x.totalAmount, 0);
  res.status(200).json({ success: true, data: { purchases, summary: { count: purchases.length, totalSpent }, period: { start, end } } });
};

// @desc Stock / Inventory report
exports.getStockReport = async (req, res) => {
  const products = await Product.find({ isActive: true })
    .populate('category', 'name').populate('supplier', 'companyName').lean();
  const summary = {
    totalProducts: products.length,
    totalStockValue: products.reduce((s, p) => s + p.quantity * p.costPrice, 0),
    lowStockCount: products.filter(p => p.quantity <= p.minimumStock).length,
    outOfStockCount: products.filter(p => p.quantity === 0).length
  };
  res.status(200).json({ success: true, data: { products, summary } });
};

// @desc Profit & Loss report
exports.getProfitLossReport = async (req, res) => {
  const { start, end } = getDateRange(req.query.period, req.query.startDate, req.query.endDate);
  const [sales, purchases] = await Promise.all([
    Sale.find({ createdAt: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } }).lean(),
    Purchase.find({ createdAt: { $gte: start, $lte: end }, status: 'received' }).lean()
  ]);
  const revenue = sales.reduce((s, x) => s + x.totalAmount, 0);
  const expenses = purchases.reduce((s, x) => s + x.totalAmount, 0);
  const grossProfit = revenue - expenses;
  const profitMargin = revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(2) : 0;
  res.status(200).json({ success: true, data: { revenue, expenses, grossProfit, profitMargin, salesCount: sales.length, purchasesCount: purchases.length, period: { start, end } } });
};

// @desc Category-wise report
exports.getCategoryReport = async (req, res) => {
  const report = await Product.aggregate([
    { $match: { isActive: true } },
    { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'cat' } },
    { $unwind: { path: '$cat', preserveNullAndEmpty: true } },
    { $group: {
        _id: '$cat._id',
        categoryName: { $first: '$cat.name' },
        productCount: { $sum: 1 },
        totalStock: { $sum: '$quantity' },
        stockValue: { $sum: { $multiply: ['$quantity', '$costPrice'] } },
        potentialRevenue: { $sum: { $multiply: ['$quantity', '$sellingPrice'] } }
      }
    },
    { $sort: { stockValue: -1 } }
  ]);
  res.status(200).json({ success: true, data: report });
};

// @desc Supplier-wise report
exports.getSupplierReport = async (req, res) => {
  const report = await Purchase.aggregate([
    { $match: { status: 'received' } },
    { $lookup: { from: 'suppliers', localField: 'supplier', foreignField: '_id', as: 'sup' } },
    { $unwind: '$sup' },
    { $group: {
        _id: '$sup._id',
        supplierName: { $first: '$sup.companyName' },
        totalOrders: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
  res.status(200).json({ success: true, data: report });
};
