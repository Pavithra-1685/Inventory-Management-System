const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');
const Product = require('../models/Product');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected for seeding...');
};

const seedData = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    User.deleteMany(), Category.deleteMany(), Supplier.deleteMany(),
    Customer.deleteMany(), Product.deleteMany()
  ]);
  console.log('Cleared existing data');

  // Seed Admin User
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@inventory.com',
    password: 'Admin@123',
    role: 'admin',
    phone: '9876543210'
  });
  const manager = await User.create({
    name: 'John Manager',
    email: 'manager@inventory.com',
    password: 'Manager@123',
    role: 'manager',
    phone: '9876543211'
  });
  const staff = await User.create({
    name: 'Jane Staff',
    email: 'staff@inventory.com',
    password: 'Staff@123',
    role: 'staff',
    phone: '9876543212'
  });
  console.log('Users seeded');

  // Seed Categories
  const categories = await Category.insertMany([
    { name: 'Electronics', description: 'Electronic devices and accessories', createdBy: admin._id },
    { name: 'Clothing', description: 'Apparel and fashion items', createdBy: admin._id },
    { name: 'Food & Beverages', description: 'Food products and drinks', createdBy: admin._id },
    { name: 'Office Supplies', description: 'Stationery and office items', createdBy: admin._id },
    { name: 'Tools & Hardware', description: 'Hand tools and hardware', createdBy: admin._id },
  ]);
  console.log('Categories seeded');

  // Seed Suppliers
  const suppliers = await Supplier.insertMany([
    {
      companyName: 'TechSource India Pvt Ltd',
      contactPerson: 'Rahul Sharma',
      email: 'rahul@techsource.in',
      phone: '9123456789',
      address: { street: '12 Tech Park', city: 'Bangalore', state: 'Karnataka', country: 'India', zipCode: '560001' },
      rating: 5, createdBy: admin._id
    },
    {
      companyName: 'Fashion Hub Wholesale',
      contactPerson: 'Priya Patel',
      email: 'priya@fashionhub.com',
      phone: '9234567890',
      address: { street: '45 Textile Market', city: 'Surat', state: 'Gujarat', country: 'India', zipCode: '395001' },
      rating: 4, createdBy: admin._id
    },
    {
      companyName: 'FreshMart Distributors',
      contactPerson: 'Suresh Kumar',
      email: 'suresh@freshmart.com',
      phone: '9345678901',
      address: { street: '78 Market Road', city: 'Chennai', state: 'Tamil Nadu', country: 'India', zipCode: '600001' },
      rating: 4, createdBy: admin._id
    },
  ]);
  console.log('Suppliers seeded');

  // Seed Customers
  await Customer.insertMany([
    { name: 'Ananya Krishnan', email: 'ananya@gmail.com', phone: '9876501234', type: 'retail', createdBy: admin._id },
    { name: 'Global Traders Ltd', email: 'info@globaltraders.com', phone: '9876502345', type: 'wholesale', createdBy: admin._id },
    { name: 'Meera Nair', email: 'meera@yahoo.com', phone: '9876503456', type: 'retail', createdBy: admin._id },
    { name: 'StarMart Retail Chain', email: 'purchase@starmart.com', phone: '9876504567', type: 'wholesale', createdBy: admin._id },
  ]);
  console.log('Customers seeded');

  // Seed Products
  await Product.insertMany([
    { name: 'Wireless Bluetooth Headphones', sku: 'ELE-WBH-001', category: categories[0]._id, description: 'High-quality wireless headphones with noise cancellation', costPrice: 1200, sellingPrice: 2499, quantity: 45, minimumStock: 10, supplier: suppliers[0]._id, unit: 'pcs', createdBy: admin._id },
    { name: 'USB-C Fast Charger 65W', sku: 'ELE-UCH-002', category: categories[0]._id, description: '65W GaN USB-C fast charger', costPrice: 350, sellingPrice: 799, quantity: 120, minimumStock: 20, supplier: suppliers[0]._id, unit: 'pcs', createdBy: admin._id },
    { name: 'Smart LED Desk Lamp', sku: 'ELE-SDL-003', category: categories[0]._id, description: 'Touch-controlled LED desk lamp with USB port', costPrice: 450, sellingPrice: 999, quantity: 8, minimumStock: 15, supplier: suppliers[0]._id, unit: 'pcs', createdBy: admin._id },
    { name: 'Men\'s Premium Cotton T-Shirt', sku: 'CLO-MCT-001', category: categories[1]._id, description: '100% cotton round neck t-shirt', costPrice: 180, sellingPrice: 499, quantity: 200, minimumStock: 30, supplier: suppliers[1]._id, unit: 'pcs', createdBy: admin._id },
    { name: 'Women\'s Formal Blazer', sku: 'CLO-WFB-002', category: categories[1]._id, description: 'Professional women\'s blazer in multiple colors', costPrice: 850, sellingPrice: 2299, quantity: 35, minimumStock: 10, supplier: suppliers[1]._id, unit: 'pcs', createdBy: admin._id },
    { name: 'Premium Green Tea (100g)', sku: 'FOD-PGT-001', category: categories[2]._id, description: 'Organic Darjeeling green tea', costPrice: 120, sellingPrice: 299, quantity: 5, minimumStock: 25, supplier: suppliers[2]._id, unit: 'pack', createdBy: admin._id },
    { name: 'Instant Coffee Sachets (50 pcs)', sku: 'FOD-ICS-002', category: categories[2]._id, description: 'Premium instant coffee single-serve packets', costPrice: 280, sellingPrice: 599, quantity: 80, minimumStock: 20, supplier: suppliers[2]._id, unit: 'pack', createdBy: admin._id },
    { name: 'A4 Printer Paper Ream (500 sheets)', sku: 'OFF-APP-001', category: categories[3]._id, description: '75 GSM A4 copy paper, 500 sheets per ream', costPrice: 175, sellingPrice: 349, quantity: 150, minimumStock: 30, supplier: suppliers[2]._id, unit: 'pack', createdBy: admin._id },
    { name: 'Steel Claw Hammer 500g', sku: 'TOL-SCH-001', category: categories[4]._id, description: 'Professional steel claw hammer with rubberized grip', costPrice: 220, sellingPrice: 549, quantity: 3, minimumStock: 10, supplier: suppliers[0]._id, unit: 'pcs', createdBy: admin._id },
    { name: 'Adjustable Torque Wrench Set', sku: 'TOL-ATW-002', category: categories[4]._id, description: 'Professional torque wrench set 10-150 Nm', costPrice: 1800, sellingPrice: 3999, quantity: 18, minimumStock: 5, supplier: suppliers[0]._id, unit: 'pcs', createdBy: admin._id },
  ]);
  console.log('Products seeded');

  console.log('\n✅ DATABASE SEEDED SUCCESSFULLY!\n');
  console.log('Login Credentials:');
  console.log('  Admin:   admin@inventory.com   / Admin@123');
  console.log('  Manager: manager@inventory.com / Manager@123');
  console.log('  Staff:   staff@inventory.com   / Staff@123\n');

  process.exit(0);
};

seedData().catch(err => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
