import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { PageLoader, StatCardSkeleton } from '../components/ui/Loading';
import { StatCard, StatusBadge } from '../components/ui/DataTable';
import {
  Package, ShoppingCart, TrendingUp, AlertTriangle, DollarSign,
  ArrowUpRight, ArrowDownRight, Layers, Briefcase, Users, FileText
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard');
      return res.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card h-80 skeleton" />
          <div className="card h-80 skeleton" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <AlertTriangle />
        <div>
          <p className="font-bold">Failed to load dashboard data</p>
          <p className="text-xs">{error.message || 'Check connection to the backend.'}</p>
        </div>
      </div>
    );
  }

  const { stats, charts, lowStockProducts, recentActivities } = data;

  // Chart transformations
  const salesChartData = (charts.monthlySales || []).map(item => ({
    name: `${item._id.month}/${item._id.year}`,
    Revenue: item.revenue,
    Orders: item.count
  }));

  const purchaseChartData = (charts.monthlyPurchases || []).map(item => ({
    name: `${item._id.month}/${item._id.year}`,
    Spent: item.amount,
    Orders: item.count
  }));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome to your inventory central controls.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/inventory" className="btn btn-outline btn-sm">Stock Valuation</Link>
          <Link to="/reports" className="btn-primary btn-sm">Generate Reports</Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Products" value={stats.totalProducts} icon={Package} color="bg-primary" />
        <StatCard label="Available Stock" value={stats.totalStock} icon={Layers} color="bg-secondary" />
        <StatCard label="Low Stock Items" value={stats.lowStockItems} icon={AlertTriangle} color={stats.lowStockItems > 0 ? 'bg-warning' : 'bg-primary'} />
        <StatCard label="Today's Sales" value={stats.todaySalesTotal} suffix="₹" icon={TrendingUp} color="bg-success" />
        <StatCard label="Purchase Orders" value={stats.totalPurchases} icon={Briefcase} color="bg-primary" />
        <StatCard label="Revenue" value={stats.totalRevenue} suffix="₹" icon={DollarSign} color="bg-success" />
        <StatCard label="Expenses" value={stats.totalExpenses} suffix="₹" icon={DollarSign} color="bg-danger" />
        <StatCard label="Net Profit" value={stats.totalProfit} suffix="₹" icon={DollarSign} color={stats.totalProfit >= 0 ? 'bg-success' : 'bg-danger'} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black uppercase">Sales Analytics</h2>
            <span className="badge badge-success">Monthly Revenue</span>
          </div>
          <div className="h-72 w-full">
            {salesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#166534" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#166534" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#111827" fontSize={12} fontWeight={700} />
                  <YAxis stroke="#111827" fontSize={12} fontWeight={700} />
                  <Tooltip contentStyle={{ border: '3px solid #111827', borderRadius: 0, fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="Revenue" stroke="#166534" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-secondary font-bold text-sm">No sales data recorded yet.</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black uppercase">Purchase Analytics</h2>
            <span className="badge badge-default">Monthly Expenditures</span>
          </div>
          <div className="h-72 w-full">
            {purchaseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={purchaseChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#111827" fontSize={12} fontWeight={700} />
                  <YAxis stroke="#111827" fontSize={12} fontWeight={700} />
                  <Tooltip contentStyle={{ border: '3px solid #111827', borderRadius: 0, fontWeight: 'bold' }} />
                  <Bar dataKey="Spent" fill="#111827" stroke="#111827" strokeWidth={1} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-secondary font-bold text-sm">No purchase logs available.</div>
            )}
          </div>
        </div>
      </div>

      {/* Details Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black uppercase text-danger flex items-center gap-2">
              <AlertTriangle size={18} /> Low Stock Alerts
            </h2>
            <Link to="/products" className="text-xs font-bold underline hover:text-primary">Manage Catalog</Link>
          </div>
          {lowStockProducts && lowStockProducts.length > 0 ? (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Current Qty</th>
                    <th>Min Limit</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map(p => (
                    <tr key={p._id}>
                      <td className="font-bold">{p.name}</td>
                      <td className="font-mono text-xs">{p.sku}</td>
                      <td className="text-danger font-black">{p.quantity} {p.unit}</td>
                      <td className="text-secondary">{p.minimumStock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-secondary font-bold text-sm">✓ All stock levels are within safe parameters.</div>
          )}
        </div>

        {/* Recent Activity Logs */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black uppercase">Recent Activity</h2>
            <Link to="/activity" className="text-xs font-bold underline hover:text-primary">Audit Log</Link>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            {recentActivities && recentActivities.length > 0 ? (
              recentActivities.map(log => (
                <div key={log._id} className="flex items-start gap-3 p-3 border-2 border-primary bg-bg">
                  <div className="w-8 h-8 bg-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {log.user?.name?.charAt(0).toUpperCase() || 'S'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold truncate">{log.user?.name || 'System'}</p>
                      <span className="text-[10px] text-secondary font-bold font-mono">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-secondary mt-1">{log.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-secondary font-bold text-sm">No activity recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
