import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { PageLoader } from '../../components/ui/Loading';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PERIODS = [
  { label: 'This Month', value: 'month' },
  { label: 'This Week', value: 'week' },
  { label: 'Today', value: 'today' },
  { label: 'This Year', value: 'year' },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('sales');

  const { data: salesData, isLoading: loadingSales } = useQuery({
    queryKey: ['report-sales', period],
    queryFn: async () => (await api.get('/reports/sales', { params: { period } })).data.data,
    enabled: activeTab === 'sales',
  });

  const { data: stockData, isLoading: loadingStock } = useQuery({
    queryKey: ['report-stock'],
    queryFn: async () => (await api.get('/reports/stock')).data.data,
    enabled: activeTab === 'stock',
  });

  const { data: plData, isLoading: loadingPL } = useQuery({
    queryKey: ['report-pl', period],
    queryFn: async () => (await api.get('/reports/profit-loss', { params: { period } })).data.data,
    enabled: activeTab === 'pl',
  });

  const { data: catData, isLoading: loadingCat } = useQuery({
    queryKey: ['report-categories'],
    queryFn: async () => (await api.get('/reports/categories')).data.data,
    enabled: activeTab === 'categories',
  });

  const tabs = [
    { id: 'sales', label: 'Sales Report' },
    { id: 'stock', label: 'Stock Report' },
    { id: 'pl', label: 'P&L Report' },
    { id: 'categories', label: 'Category Report' },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Data-driven business insights and financial analysis.</p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)} className={`btn btn-sm ${period === p.value ? 'bg-primary text-white' : 'btn-outline'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b-3 border-primary">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-black uppercase tracking-wide border-b-3 -mb-[3px] transition-colors ${activeTab === tab.id ? 'border-primary bg-primary text-white' : 'border-transparent text-secondary hover:text-primary'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sales Report */}
      {activeTab === 'sales' && (
        loadingSales ? <PageLoader /> : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="card"><p className="label">Total Orders</p><p className="text-3xl font-black">{salesData?.summary?.count || 0}</p></div>
              <div className="card"><p className="label">Revenue</p><p className="text-3xl font-black">₹{(salesData?.summary?.totalRevenue || 0).toLocaleString()}</p></div>
              <div className="card"><p className="label">Tax Collected</p><p className="text-3xl font-black">₹{(salesData?.summary?.totalTax || 0).toLocaleString()}</p></div>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Invoice</th><th>Customer</th><th>Items</th><th>Total</th><th>Date</th></tr></thead>
                <tbody>
                  {salesData?.sales?.map(s => (
                    <tr key={s._id}>
                      <td className="font-mono font-bold text-sm">{s.invoiceNumber}</td>
                      <td>{s.customer?.name || 'Walk-in'}</td>
                      <td>{s.items?.length || 0}</td>
                      <td className="font-bold">₹{s.totalAmount?.toLocaleString()}</td>
                      <td className="text-secondary text-sm">{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Stock Report */}
      {activeTab === 'stock' && (
        loadingStock ? <PageLoader /> : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <div className="card"><p className="label">Total Products</p><p className="text-3xl font-black">{stockData?.summary?.totalProducts || 0}</p></div>
              <div className="card"><p className="label">Stock Value</p><p className="text-3xl font-black">₹{(stockData?.summary?.totalStockValue || 0).toLocaleString()}</p></div>
              <div className="card"><p className="label">Low Stock Items</p><p className="text-3xl font-black text-warning">{stockData?.summary?.lowStockCount || 0}</p></div>
              <div className="card"><p className="label">Out of Stock</p><p className="text-3xl font-black text-danger">{stockData?.summary?.outOfStockCount || 0}</p></div>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Qty</th><th>Cost Price</th><th>Stock Value</th><th>Status</th></tr></thead>
                <tbody>
                  {stockData?.products?.map(p => (
                    <tr key={p._id} className={p.quantity <= p.minimumStock ? 'bg-red-50/50' : ''}>
                      <td className="font-bold">{p.name}</td>
                      <td className="font-mono text-xs">{p.sku}</td>
                      <td>{p.category?.name || '—'}</td>
                      <td className={`font-black ${p.quantity <= p.minimumStock ? 'text-danger' : ''}`}>{p.quantity}</td>
                      <td>₹{p.costPrice}</td>
                      <td className="font-bold">₹{(p.quantity * p.costPrice).toLocaleString()}</td>
                      <td>{p.quantity === 0 ? <span className="badge badge-danger">Out</span> : p.quantity <= p.minimumStock ? <span className="badge badge-warning">Low</span> : <span className="badge badge-success">OK</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* P&L Report */}
      {activeTab === 'pl' && (
        loadingPL ? <PageLoader /> : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card"><p className="label">Revenue</p><p className="text-3xl font-black text-success">₹{(plData?.revenue || 0).toLocaleString()}</p></div>
              <div className="card"><p className="label">Expenses</p><p className="text-3xl font-black text-danger">₹{(plData?.expenses || 0).toLocaleString()}</p></div>
              <div className="card"><p className="label">Gross Profit</p><p className={`text-3xl font-black ${(plData?.grossProfit || 0) >= 0 ? 'text-success' : 'text-danger'}`}>₹{(plData?.grossProfit || 0).toLocaleString()}</p></div>
              <div className="card"><p className="label">Profit Margin</p><p className="text-3xl font-black">{plData?.profitMargin || 0}%</p></div>
            </div>
            <div className="card">
              <h2 className="text-lg font-black mb-4">Revenue vs Expenses</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: 'Summary', Revenue: plData?.revenue, Expenses: plData?.expenses, Profit: plData?.grossProfit }]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip contentStyle={{ border: '3px solid #111827', borderRadius: 0 }} />
                    <Bar dataKey="Revenue" fill="#166534" />
                    <Bar dataKey="Expenses" fill="#991B1B" />
                    <Bar dataKey="Profit" fill="#111827" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )
      )}

      {/* Category Report */}
      {activeTab === 'categories' && (
        loadingCat ? <PageLoader /> : (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Category</th><th>Products</th><th>Total Stock</th><th>Stock Value</th><th>Potential Revenue</th></tr></thead>
              <tbody>
                {catData?.map(c => (
                  <tr key={c._id}>
                    <td className="font-bold">{c.categoryName || 'Uncategorized'}</td>
                    <td>{c.productCount}</td>
                    <td>{c.totalStock}</td>
                    <td className="font-bold">₹{c.stockValue?.toLocaleString()}</td>
                    <td className="font-bold text-success">₹{c.potentialRevenue?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
