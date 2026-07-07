const ActivityLog = require('../models/ActivityLog');
const APIFeatures = require('../utils/apiFeatures');

exports.getActivityLogs = async (req, res) => {
  const features = new APIFeatures(
    ActivityLog.find().populate('user', 'name email role avatar'),
    req.query
  ).filter().sort().paginate();
  const [logs, total] = await Promise.all([features.query, ActivityLog.countDocuments()]);
  res.status(200).json({ success: true, count: logs.length, total, data: logs });
};
