const Category = require('../models/Category');
const APIFeatures = require('../utils/apiFeatures');

exports.getCategories = async (req, res) => {
  const features = new APIFeatures(Category.find().populate('productCount'), req.query)
    .search(['name']).filter().sort();
  const total = await features.count();
  features.paginate();
  const categories = await features.query;
  res.status(200).json({ success: true, count: categories.length, total, pages: Math.ceil(total / features.limit), data: categories });
};

exports.getCategory = async (req, res) => {
  const category = await Category.findById(req.params.id).populate('productCount');
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  res.status(200).json({ success: true, data: category });
};

exports.createCategory = async (req, res) => {
  req.body.createdBy = req.user._id;
  if (req.file) req.body.image = `/uploads/products/${req.file.filename}`;
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, data: category });
};

exports.updateCategory = async (req, res) => {
  if (req.file) req.body.image = `/uploads/products/${req.file.filename}`;
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  res.status(200).json({ success: true, data: category });
};

exports.deleteCategory = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  await category.deleteOne();
  res.status(200).json({ success: true, message: 'Category deleted' });
};
