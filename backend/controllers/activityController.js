const ActivityLog = require('../models/ActivityLog');
const APIFeatures = require('../utils/apiFeatures');

exports.getActivityLogs = async (req, res) => {
  const features = new APIFeatures(
    ActivityLog.find().populate('user', 'name email role avatar'),
    req.query
  ).filter().sort();
  const total = await features.count();
  features.paginate();
  const logs = await features.query;
  res.status(200).json({ success: true, count: logs.length, total, pages: Math.ceil(total / features.limit), data: logs });
};
