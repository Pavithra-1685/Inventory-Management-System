# InventoryPro — MERN Stack Inventory Management System

A full-featured, production-ready **Inventory Management System** built with the **MERN Stack** and a **Modern Brutalist** UI design.

## 🚀 Tech Stack
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT Auth
- **Frontend**: React 18 + Vite, Tailwind CSS v3, Zustand, React Query, Recharts
- **Design**: Modern Brutalism — thick borders, hard shadows, bold typography

## ✨ Features
- 🔐 JWT Authentication + Role-Based Access (Admin / Manager / Staff)
- 📦 Product Catalog with SKU & Barcode Generation
- 🏭 Inventory Tracking with full transaction audit log
- 🛒 Purchase Order Management with goods receipt
- 💰 Sales Management with PDF Invoice Generation
- 📊 Dashboard with live analytics & low-stock alerts
- 📈 Reports: Sales, Stock, P&L, Category-wise
- 🏢 Supplier & Customer Management
- 👥 User Management (Admin only)
- 📝 Activity Log (full audit trail)

## 📁 Project Structure
```
Inventory-Management-System/
├── backend/          # Express REST API
│   ├── config/       # DB connection
│   ├── controllers/  # Business logic
│   ├── middleware/   # Auth, error handler, upload
│   ├── models/       # Mongoose schemas
│   ├── routes/       # Express routers
│   └── utils/        # Logger, email, seeder, APIFeatures
└── frontend/         # React + Vite SPA
    └── src/
        ├── components/   # Layout, UI components
        ├── lib/          # Axios API client
        ├── pages/        # All page components
        └── store/        # Zustand global state
```

## 🏃 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend
```bash
cd backend
cp .env.example .env      # fill in MONGO_URI, JWT_SECRET
npm install
npm run seed              # seed demo data
npm run dev               # runs on port 5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev               # runs on port 5173
```

## 🔑 Demo Credentials (after seeding)
| Role    | Email                     | Password    |
|---------|---------------------------|-------------|
| Admin   | admin@inventory.com       | Admin@123   |
| Manager | manager@inventory.com     | Manager@123 |
| Staff   | staff@inventory.com       | Staff@123   |
