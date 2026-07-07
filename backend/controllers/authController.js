const crypto = require('crypto');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { sendEmail, passwordResetTemplate } = require('../utils/sendEmail');

// Helper: send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  const isProduction = process.env.NODE_ENV === 'production';
  const options = {
    expires: new Date(Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRE) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  };
  res.status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone
      }
    });
};

// @desc  Register user
// @route POST /api/auth/register
// @access Private (Admin only)
exports.register = async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  const user = await User.create({ name, email, password, role, phone });
  await ActivityLog.create({
    user: req.user?._id,
    action: 'register',
    module: 'auth',
    description: `New user registered: ${email}`,
    ipAddress: req.ip
  });
  sendTokenResponse(user, 201, res);
};

// @desc  Login
// @route POST /api/auth/login
// @access Public
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  if (!user.isActive) {
    return res.status(401).json({ success: false, message: 'Account has been deactivated' });
  }
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });
  await ActivityLog.create({
    user: user._id,
    action: 'login',
    module: 'auth',
    description: `User logged in: ${email}`,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });
  sendTokenResponse(user, 200, res);
};

// @desc  Logout
// @route POST /api/auth/logout
// @access Private
exports.logout = async (req, res) => {
  await ActivityLog.create({
    user: req.user._id,
    action: 'logout',
    module: 'auth',
    description: `User logged out: ${req.user.email}`,
    ipAddress: req.ip
  });
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// @desc  Get current user
// @route GET /api/auth/me
// @access Private
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ success: true, data: user });
};

// @desc  Update profile
// @route PUT /api/auth/updateprofile
// @access Private
exports.updateProfile = async (req, res) => {
  const allowedFields = { name: req.body.name, phone: req.body.phone };
  if (req.file) allowedFields.avatar = `/uploads/avatars/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.user._id, allowedFields, { new: true, runValidators: true });
  await ActivityLog.create({
    user: req.user._id,
    action: 'profile_update',
    module: 'user',
    description: `Profile updated for: ${user.email}`,
    ipAddress: req.ip
  });
  res.status(200).json({ success: true, data: user });
};

// @desc  Update password
// @route PUT /api/auth/updatepassword
// @access Private
exports.updatePassword = async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  }
  user.password = req.body.newPassword;
  await user.save();
  sendTokenResponse(user, 200, res);
};

// @desc  Forgot password
// @route POST /api/auth/forgotpassword
// @access Public
exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({ success: false, message: 'No user with that email' });
  }
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  try {
    await sendEmail({
      to: user.email,
      subject: 'InventoryPro - Password Reset',
      html: passwordResetTemplate(user.name, resetUrl)
    });
    res.status(200).json({ success: true, message: 'Password reset email sent' });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return res.status(500).json({ success: false, message: 'Email could not be sent' });
  }
};

// @desc  Reset password
// @route PUT /api/auth/resetpassword/:resettoken
// @access Public
exports.resetPassword = async (req, res) => {
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });
  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
  }
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  sendTokenResponse(user, 200, res);
};
