const mongoose = require('mongoose');
const Counter = require('./Counter');

const saleDetailSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true }
});

const saleSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  items: [saleDetailSchema],
  status: {
    type: String,
    enum: ['draft', 'pending', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank_transfer', 'credit'],
    default: 'cash'
  },
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  taxRate: { type: Number, default: 18 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  amountPaid: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  notes: String,
  dueDate: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Auto-generate invoice number
saleSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const seq = await Counter.next(`sale-${year}${month}`, this.$session());
    this.invoiceNumber = `INV-${year}${month}-${String(seq).padStart(5, '0')}`;
  }
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.tax = (this.subtotal * (this.taxRate / 100));
  this.totalAmount = this.subtotal + this.tax - this.discount;
  this.dueAmount = this.totalAmount - this.amountPaid;
  next();
});

saleSchema.index({ invoiceNumber: 1 });
saleSchema.index({ customer: 1 });
saleSchema.index({ status: 1 });
saleSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Sale', saleSchema);
