const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { upload, uploadCSV } = require('../middleware/upload');
const {
  getProducts, getProduct, createProduct, updateProduct,
  deleteProduct, generateBarcode, exportProducts, getLowStockProducts
} = require('../controllers/productController');

router.use(protect);

router.get('/low-stock', getLowStockProducts);
router.get('/export', exportProducts);
router.get('/:id/barcode', generateBarcode);

router.route('/')
  .get(getProducts)
  .post(authorize('admin', 'manager'), upload.array('images', 5), createProduct);

router.route('/:id')
  .get(getProduct)
  .put(authorize('admin', 'manager'), upload.array('images', 5), updateProduct)
  .delete(authorize('admin'), deleteProduct);

module.exports = router;
