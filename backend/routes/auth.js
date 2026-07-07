const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  register, login, logout, getMe,
  updateProfile, updatePassword, forgotPassword, resetPassword
} = require('../controllers/authController');

router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// Protected routes
router.use(protect);
router.post('/register', authorize('admin'), register);
router.get('/me', getMe);
router.post('/logout', logout);
router.put('/updateprofile', upload.single('avatar'), updateProfile);
router.put('/updatepassword', updatePassword);

module.exports = router;
