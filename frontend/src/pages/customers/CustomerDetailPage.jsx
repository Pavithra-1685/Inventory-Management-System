import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import { PageLoader } from '../../components/ui/Loading';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import { StatusBadge } from '../../components/ui/DataTable';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => (await api.get(`/customers/${id}`)).data.data,
  });
  if (isLoading) return <PageLoader />;
  const { recentSales = [], ...customer } = data || {};
  return (
    <div className="space-y-6">
      <Link to="/customers" className="btn btn-outline btn-sm inline-flex"><ArrowLeft size={14} /> Back</Link>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card space-y-4">
          <h1 className="text-2xl font-black border-b-2 border-accent pb-4">{customer.name}</h1>
          <div className="space-y-2 text-sm font-medium">
            {customer.email && <div className="flex items-center gap-2"><Mail size={14} />{customer.email}</div>}
            <div className="flex items-center gap-2"><Phone size={14} />{customer.phone}</div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t-2 border-accent">
            <span className="badge badge-default capitalize">{customer.type}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t-2 border-accent">
            <div><p className="label">Total Orders</p><p className="font-black text-xl">{customer.totalPurchases || 0}</p></div>
            <div><p className="label">Total Spent</p><p className="font-black text-xl">₹{(customer.totalAmount || 0).toLocaleString()}</p></div>
          </div>
        </div>
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-black uppercase mb-4">Recent Sales</h2>
          {recentSales.length === 0 ? (
            <p className="text-secondary text-sm py-8 text-center font-medium">No purchase history found.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Invoice</th><th>Amount</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {recentSales.map(s => (
                    <tr key={s._id}>
                      <td><Link to={`/sales/${s._id}`} className="font-mono font-bold hover:underline">{s.invoiceNumber}</Link></td>
                      <td className="font-bold">₹{s.totalAmount?.toLocaleString()}</td>
                      <td><StatusBadge status={s.paymentStatus} /></td>
                      <td><StatusBadge status={s.status} /></td>
                      <td className="text-sm text-secondary">{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
