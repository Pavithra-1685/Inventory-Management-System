const Product = require('../models/Product');
const InventoryTransaction = require('../models/InventoryTransaction');
const ActivityLog = require('../models/ActivityLog');
const APIFeatures = require('../utils/apiFeatures');
const { v4: uuidv4 } = require('uuid');
const bwipjs = require('bwip-js');
const csv = require('fast-csv');
const fs = require('fs');

// @desc  Get all products
// @route GET /api/products
// @access Private
exports.getProducts = async (req, res) => {
  const features = new APIFeatures(
    Product.find().populate('category', 'name').populate('supplier', 'companyName'),
    req.query
  ).search(['name', 'sku', 'barcode']).filter().sort().limitFields().paginate();

  const [products, total] = await Promise.all([
    features.query,
    Product.countDocuments()
  ]);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    page: features.page,
    pages: Math.ceil(total / features.limit),
    data: products
  });
};

// @desc  Get single product
// @route GET /api/products/:id
// @access Private
exports.getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug')
    .populate('supplier', 'companyName contactPerson email phone')
    .populate('createdBy', 'name email');
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.status(200).json({ success: true, data: product });
};

// @desc  Create product
// @route POST /api/products
// @access Private (Admin, Manager)
exports.createProduct = async (req, res) => {
  req.body.createdBy = req.user._id;
  if (req.files && req.files.length > 0) {
    req.body.images = req.files.map(f => `/uploads/products/${f.filename}`);
  }
  const product = await Product.create(req.body);
  // Log initial stock if quantity provided
  if (product.quantity > 0) {
    await InventoryTransaction.create({
      product: product._id,
      type: 'stock_in',
      quantity: product.quantity,
      previousQuantity: 0,
      newQuantity: product.quantity,
      unitCost: product.costPrice,
      totalCost: product.quantity * product.costPrice,
      reason: 'Initial stock',
      referenceType: 'manual',
      createdBy: req.user._id
    });
  }
  await ActivityLog.create({
    user: req.user._id, action: 'create', module: 'product',
    description: `Created product: ${product.name} (SKU: ${product.sku})`,
    entityId: product._id, entityType: 'Product', ipAddress: req.ip
  });
  res.status(201).json({ success: true, data: product });
};

// @desc  Update product
// @route PUT /api/products/:id
// @access Private (Admin, Manager)
exports.updateProduct = async (req, res) => {
  let product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  if (req.files && req.files.length > 0) {
    req.body.images = req.files.map(f => `/uploads/products/${f.filename}`);
  }
  product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  await ActivityLog.create({
    user: req.user._id, action: 'update', module: 'product',
    description: `Updated product: ${product.name}`,
    entityId: product._id, entityType: 'Product', ipAddress: req.ip
  });
  res.status(200).json({ success: true, data: product });
};

// @desc  Delete product
// @route DELETE /api/products/:id
// @access Private (Admin)
exports.deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  await product.deleteOne();
  await ActivityLog.create({
    user: req.user._id, action: 'delete', module: 'product',
    description: `Deleted product: ${product.name}`,
    entityId: product._id, entityType: 'Product', ipAddress: req.ip
  });
  res.status(200).json({ success: true, message: 'Product deleted' });
};

// @desc  Generate barcode image
// @route GET /api/products/:id/barcode
// @access Private
exports.generateBarcode = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  const barcodeValue = product.barcode || product.sku;
  bwipjs.toBuffer({
    bcid: 'code128',
    text: barcodeValue,
    scale: 3,
    height: 10,
    includetext: true,
    textxalign: 'center',
  }, (err, png) => {
    if (err) return res.status(500).json({ success: false, message: 'Barcode generation failed' });
    res.set('Content-Type', 'image/png');
    res.send(png);
  });
};

// @desc  Export products CSV
// @route GET /api/products/export
// @access Private
exports.exportProducts = async (req, res) => {
  const products = await Product.find({ isActive: true })
    .populate('category', 'name')
    .populate('supplier', 'companyName')
    .lean();

  res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
  res.setHeader('Content-Type', 'text/csv');

  const csvStream = csv.format({ headers: true });
  csvStream.pipe(res);
  products.forEach(p => {
    csvStream.write({
      Name: p.name, SKU: p.sku, Barcode: p.barcode || '',
      Category: p.category?.name || '', Description: p.description || '',
      'Cost Price': p.costPrice, 'Selling Price': p.sellingPrice,
      Quantity: p.quantity, 'Min Stock': p.minimumStock,
      Supplier: p.supplier?.companyName || '', Unit: p.unit
    });
  });
  csvStream.end();
};

// @desc  Get low stock products
// @route GET /api/products/low-stock
// @access Private
exports.getLowStockProducts = async (req, res) => {
  const products = await Product.find({ isActive: true })
    .populate('category', 'name')
    .lean();
  const lowStock = products.filter(p => p.quantity <= p.minimumStock);
  res.status(200).json({ success: true, count: lowStock.length, data: lowStock });
};
