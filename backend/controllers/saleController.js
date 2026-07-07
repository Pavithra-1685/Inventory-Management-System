const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const InventoryTransaction = require('../models/InventoryTransaction');
const ActivityLog = require('../models/ActivityLog');
const APIFeatures = require('../utils/apiFeatures');
const PDFDocument = require('pdfkit');

exports.getSales = async (req, res) => {
  const features = new APIFeatures(
    Sale.find().populate('customer', 'name phone').populate('createdBy', 'name'),
    req.query
  ).filter().sort();
  const total = await features.count();
  features.paginate();
  const sales = await features.query;
  res.status(200).json({
    success: true,
    count: sales.length,
    total,
    pages: Math.ceil(total / features.limit),
    data: sales
  });
};

exports.getSale = async (req, res) => {
  const sale = await Sale.findById(req.params.id)
    .populate('customer', 'name email phone address')
    .populate('items.product', 'name sku sellingPrice')
    .populate('createdBy', 'name email');
  if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
  res.status(200).json({ success: true, data: sale });
};

exports.createSale = async (req, res) => {
  const session = await mongoose.startSession();
  let createdSale;

  try {
    await session.withTransaction(async () => {
      for (const item of req.body.items || []) {
        const product = await Product.findById(item.product).session(session);
        if (!product) {
          const error = new Error(`Product not found: ${item.product}`);
          error.statusCode = 404;
          throw error;
        }
        if (product.quantity < item.quantity) {
          const error = new Error(`Insufficient stock for: ${product.name}. Available: ${product.quantity}`);
          error.statusCode = 400;
          throw error;
        }
      }

      req.body.createdBy = req.user._id;
      const [sale] = await Sale.create([req.body], { session });
      createdSale = sale;

      for (const item of sale.items) {
        const product = await Product.findOneAndUpdate(
          { _id: item.product, quantity: { $gte: item.quantity } },
          { $inc: { quantity: -item.quantity } },
          { new: false, session }
        );

        if (!product) {
          const error = new Error('Stock changed while creating sale. Please retry.');
          error.statusCode = 409;
          throw error;
        }

        const newQuantity = product.quantity - item.quantity;
        await InventoryTransaction.create([{
          product: product._id,
          type: 'stock_out',
          quantity: item.quantity,
          previousQuantity: product.quantity,
          newQuantity,
          unitCost: product.costPrice,
          totalCost: item.quantity * product.costPrice,
          reference: sale.invoiceNumber,
          referenceType: 'sale',
          referenceId: sale._id,
          reason: `Sold via invoice: ${sale.invoiceNumber}`,
          createdBy: req.user._id
        }], { session });
      }

      if (sale.customer) {
        await Customer.findByIdAndUpdate(
          sale.customer,
          { $inc: { totalPurchases: 1, totalAmount: sale.totalAmount } },
          { session }
        );
      }

      await ActivityLog.create([{
        user: req.user._id,
        action: 'create',
        module: 'sale',
        description: `Created sale invoice: ${sale.invoiceNumber}`,
        entityId: sale._id,
        entityType: 'Sale',
        ipAddress: req.ip
      }], { session });
    });

    res.status(201).json({ success: true, data: createdSale });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create sale'
    });
  } finally {
    await session.endSession();
  }
};

exports.updateSale = async (req, res) => {
  ['items', 'customer', 'invoiceNumber'].forEach((field) => delete req.body[field]);
  const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
  res.status(200).json({ success: true, data: sale });
};

exports.deleteSale = async (req, res) => {
  const sale = await Sale.findById(req.params.id);
  if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
  if (sale.status === 'completed') {
    return res.status(400).json({ success: false, message: 'Cannot delete a completed sale' });
  }
  await sale.deleteOne();
  res.status(200).json({ success: true, message: 'Sale deleted' });
};

exports.generateInvoice = async (req, res) => {
  const sale = await Sale.findById(req.params.id)
    .populate('customer', 'name email phone address')
    .populate('items.product', 'name sku');

  if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${sale.invoiceNumber}.pdf`);
  doc.pipe(res);

  doc.rect(50, 50, 495, 80).fillAndStroke('#111827', '#111827');
  doc.fillColor('#ffffff').fontSize(28).font('Helvetica-Bold').text('INVENTORYPRO', 70, 65);
  doc.fontSize(10).font('Helvetica').text('Inventory Management System', 70, 98);
  doc.fillColor('#ffffff').fontSize(12).text('INVOICE', 430, 65).text(sale.invoiceNumber, 430, 82);

  doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold');
  doc.text('BILL TO:', 50, 155);
  doc.font('Helvetica').fillColor('#374151');
  if (sale.customer) {
    doc.text(sale.customer.name, 50, 170);
    doc.text(sale.customer.email || '', 50, 183);
    doc.text(sale.customer.phone || '', 50, 196);
  } else {
    doc.text('Walk-in Customer', 50, 170);
  }

  doc.fillColor('#111827').font('Helvetica-Bold');
  doc.text('INVOICE DATE:', 350, 155);
  doc.text('DUE DATE:', 350, 170);
  doc.text('STATUS:', 350, 185);
  doc.font('Helvetica').fillColor('#374151');
  doc.text(new Date(sale.createdAt).toLocaleDateString('en-IN'), 450, 155);
  doc.text(sale.dueDate ? new Date(sale.dueDate).toLocaleDateString('en-IN') : 'N/A', 450, 170);
  doc.text(sale.paymentStatus.toUpperCase(), 450, 185);

  const tableTop = 235;
  doc.rect(50, tableTop, 495, 22).fillAndStroke('#111827', '#111827');
  doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
  doc.text('#', 55, tableTop + 7);
  doc.text('PRODUCT', 75, tableTop + 7);
  doc.text('QTY', 300, tableTop + 7);
  doc.text('UNIT PRICE', 355, tableTop + 7);
  doc.text('DISCOUNT', 415, tableTop + 7);
  doc.text('TOTAL', 480, tableTop + 7);

  let y = tableTop + 30;
  sale.items.forEach((item, i) => {
    if (i % 2 === 0) doc.rect(50, y - 5, 495, 18).fillAndStroke('#F5F5F5', '#F5F5F5');
    doc.fillColor('#111827').fontSize(9).font('Helvetica');
    doc.text(i + 1, 55, y);
    doc.text(item.product?.name || 'Product', 75, y, { width: 215 });
    doc.text(item.quantity, 300, y);
    doc.text(`Rs. ${item.unitPrice.toFixed(2)}`, 355, y);
    doc.text(`Rs. ${(item.discount || 0).toFixed(2)}`, 415, y);
    doc.text(`Rs. ${item.totalPrice.toFixed(2)}`, 480, y);
    y += 20;
  });

  y += 10;
  doc.rect(350, y, 195, 1).fillAndStroke('#111827', '#111827');
  y += 10;
  doc.fillColor('#374151').font('Helvetica').fontSize(9);
  doc.text('Subtotal:', 350, y); doc.text(`Rs. ${sale.subtotal.toFixed(2)}`, 480, y);
  y += 15;
  doc.text(`Tax (${sale.taxRate}%):`, 350, y); doc.text(`Rs. ${sale.tax.toFixed(2)}`, 480, y);
  y += 15;
  doc.text('Discount:', 350, y); doc.text(`Rs. ${sale.discount.toFixed(2)}`, 480, y);
  y += 5;
  doc.rect(350, y, 195, 2).fillAndStroke('#111827', '#111827');
  y += 8;
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827');
  doc.text('TOTAL:', 350, y); doc.text(`Rs. ${sale.totalAmount.toFixed(2)}`, 480, y);
  y += 18;
  doc.fontSize(9).font('Helvetica').fillColor('#374151');
  doc.text(`Amount Paid: Rs. ${sale.amountPaid.toFixed(2)}`, 350, y);
  y += 14;
  doc.font('Helvetica-Bold').fillColor(sale.dueAmount > 0 ? '#991B1B' : '#166534');
  doc.text(`Balance Due: Rs. ${sale.dueAmount.toFixed(2)}`, 350, y);

  doc.rect(50, 760, 495, 1).fillAndStroke('#111827', '#111827');
  doc.fillColor('#374151').fontSize(8).font('Helvetica');
  doc.text('Thank you for your business!', 50, 768, { align: 'center', width: 495 });
  doc.text('InventoryPro | inventory@company.com', 50, 780, { align: 'center', width: 495 });

  doc.end();
};
