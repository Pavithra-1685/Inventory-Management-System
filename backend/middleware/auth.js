const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }
    if (!req.user.isActive) {
      return res.status(401).json({ success: false, message: 'Account has been deactivated' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

// Role-based access control
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

// Log activity helper
exports.logActivity = (action, module, description) => async (req, res, next) => {
  res.on('finish', async () => {
    if (res.statusCode < 400 && req.user) {
      try {
        await ActivityLog.create({
          user: req.user._id,
          action,
          module,
          description: typeof description === 'function' ? description(req) : description,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          entityId: req.params.id || res.locals.entityId,
          entityType: module
        });
      } catch (e) {
        // Silently fail logging — don't break the request
      }
    }
  });
  next();
};
