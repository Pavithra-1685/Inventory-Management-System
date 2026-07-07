const mongoose = require('mongoose');

const purchaseDetailSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: { type: Number, required: true, min: 1 },
  unitCost: { type: Number, required: true, min: 0 },
  totalCost: { type: Number, required: true }
});

const purchaseSchema = new mongoose.Schema({
  purchaseNumber: {
    type: String,
    unique: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required']
  },
  items: [purchaseDetailSchema],
  status: {
    type: String,
    enum: ['pending', 'ordered', 'partial', 'received', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  shippingCost: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  amountPaid: { type: Number, default: 0 },
  notes: String,
  expectedDelivery: Date,
  receivedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Auto-generate purchase number
purchaseSchema.pre('save', async function (next) {
  if (!this.purchaseNumber) {
    const count = await mongoose.model('Purchase').countDocuments();
    this.purchaseNumber = `PO-${String(count + 1).padStart(6, '0')}`;
  }
  // Compute totals
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalCost, 0);
  this.totalAmount = this.subtotal + this.tax + this.shippingCost - this.discount;
  next();
});

purchaseSchema.index({ purchaseNumber: 1 });
purchaseSchema.index({ supplier: 1 });
purchaseSchema.index({ status: 1 });
purchaseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
