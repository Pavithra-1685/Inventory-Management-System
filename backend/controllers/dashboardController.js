const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const InventoryTransaction = require('../models/InventoryTransaction');
const ActivityLog = require('../models/ActivityLog');

// @desc  Dashboard summary
exports.getDashboardStats = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const [
    totalProducts, totalCustomers, totalSuppliers,
    products, todaySales, totalPurchases,
    allSales, allPurchases, recentActivities
  ] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Customer.countDocuments({ isActive: true }),
    Supplier.countDocuments({ isActive: true }),
    Product.find({ isActive: true }).lean(),
    Sale.find({ createdAt: { $gte: today, $lte: todayEnd }, status: { $ne: 'cancelled' } }),
    Purchase.countDocuments(),
    Sale.find({ status: { $ne: 'cancelled' } }).lean(),
    Purchase.find({ status: 'received' }).lean(),
    ActivityLog.find().sort('-createdAt').limit(10).populate('user', 'name role avatar')
  ]);

  // Stock calculations
  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
  const lowStockItems = products.filter(p => p.quantity <= p.minimumStock).length;
  const stockValue = products.reduce((sum, p) => sum + (p.quantity * p.costPrice), 0);

  // Revenue calculations
  const totalRevenue = allSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalExpenses = allPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const totalProfit = totalRevenue - totalExpenses;
  const todaySalesTotal = todaySales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  // Top selling products (from sales items)
  const productSalesMap = {};
  allSales.forEach(sale => {
    sale.items?.forEach(item => {
      const pid = item.product?.toString();
      if (pid) {
        productSalesMap[pid] = (productSalesMap[pid] || 0) + item.quantity;
      }
    });
  });

  // Monthly sales for chart (last 12 months)
  const monthlySales = await Sale.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 12 }
  ]);

  const monthlyPurchases = await Purchase.aggregate([
    { $match: { status: 'received' } },
    { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        amount: { $sum: '$totalAmount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 12 }
  ]);

  // Low stock alerts
  const lowStockProducts = products
    .filter(p => p.quantity <= p.minimumStock)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 8);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalProducts,
        totalStock,
        lowStockItems,
        todaySalesTotal,
        totalPurchases,
        totalRevenue,
        totalExpenses,
        totalProfit,
        stockValue,
        totalCustomers,
        totalSuppliers
      },
      charts: { monthlySales, monthlyPurchases },
      lowStockProducts,
      recentActivities
    }
  });
};
