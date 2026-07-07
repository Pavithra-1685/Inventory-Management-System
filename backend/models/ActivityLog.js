const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login', 'logout', 'register',
      'create', 'update', 'delete', 'view',
      'export', 'import', 'print',
      'password_reset', 'profile_update'
    ]
  },
  module: {
    type: String,
    required: true,
    enum: ['auth', 'user', 'product', 'category', 'supplier', 'customer', 'purchase', 'sale', 'inventory', 'report']
  },
  description: {
    type: String,
    required: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },
  entityType: {
    type: String
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

activityLogSchema.index({ user: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ module: 1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
