const User = require('../models/User');
const APIFeatures = require('../utils/apiFeatures');

exports.getUsers = async (req, res) => {
  const features = new APIFeatures(User.find(), req.query).search(['name', 'email']).filter().sort();
  const total = await features.count();
  features.paginate();
  const users = await features.query;
  res.status(200).json({ success: true, count: users.length, total, pages: Math.ceil(total / features.limit), data: users });
};

exports.getUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.status(200).json({ success: true, data: user });
};

exports.updateUser = async (req, res) => {
  const allowedFields = { name: req.body.name, email: req.body.email, role: req.body.role, phone: req.body.phone, isActive: req.body.isActive };
  const user = await User.findByIdAndUpdate(req.params.id, allowedFields, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.status(200).json({ success: true, data: user });
};

exports.deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
  }
  await user.deleteOne();
  res.status(200).json({ success: true, message: 'User deleted' });
};
