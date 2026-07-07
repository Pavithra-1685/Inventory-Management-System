const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getUsers, getUser, updateUser, deleteUser } = require('../controllers/userController');
router.use(protect, authorize('admin'));
router.route('/').get(getUsers);
router.route('/:id').get(getUser).put(updateUser).delete(deleteUser);
module.exports = router;
