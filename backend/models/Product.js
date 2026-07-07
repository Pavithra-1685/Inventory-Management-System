const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  sku: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: [0, 'Cost price cannot be negative']
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Selling price cannot be negative']
  },
  quantity: {
    type: Number,
    default: 0,
    min: [0, 'Quantity cannot be negative']
  },
  minimumStock: {
    type: Number,
    default: 10,
    min: [0, 'Minimum stock cannot be negative']
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  images: [{
    type: String
  }],
  unit: {
    type: String,
    default: 'pcs',
    enum: ['pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'pack', 'dozen', 'meter', 'sqft']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtuals
productSchema.virtual('profit').get(function () {
  return this.sellingPrice - this.costPrice;
});
productSchema.virtual('profitMargin').get(function () {
  if (this.costPrice === 0) return 0;
  return (((this.sellingPrice - this.costPrice) / this.costPrice) * 100).toFixed(2);
});
productSchema.virtual('isLowStock').get(function () {
  return this.quantity <= this.minimumStock;
});
productSchema.virtual('stockValue').get(function () {
  return this.quantity * this.costPrice;
});

// Auto-generate SKU if not provided
productSchema.pre('save', function (next) {
  if (!this.sku) {
    this.sku = 'PRD-' + uuidv4().split('-')[0].toUpperCase();
  }
  next();
});

// Indexes for search performance
productSchema.index({ name: 'text', sku: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ supplier: 1 });
productSchema.index({ quantity: 1 });
productSchema.index({ isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
