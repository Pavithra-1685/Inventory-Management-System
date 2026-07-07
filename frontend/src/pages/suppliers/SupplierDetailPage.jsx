import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import { PageLoader } from '../../components/ui/Loading';
import { ArrowLeft, Mail, Phone, MapPin, Star, ShoppingCart } from 'lucide-react';
import { StatusBadge } from '../../components/ui/DataTable';

export default function SupplierDetailPage() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => (await api.get(`/suppliers/${id}`)).data.data,
  });

  if (isLoading) return <PageLoader />;
  const { recentPurchases = [], ...supplier } = data || {};

  return (
    <div className="space-y-6">
      <Link to="/suppliers" className="btn btn-outline btn-sm inline-flex"><ArrowLeft size={14} /> Back</Link>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card space-y-4">
          <div className="border-b-2 border-accent pb-4">
            <h1 className="text-2xl font-black">{supplier.companyName}</h1>
            <p className="text-secondary text-sm">{supplier.contactPerson}</p>
          </div>
          <div className="space-y-2 text-sm font-medium">
            <div className="flex items-center gap-2"><Mail size={14} /><span>{supplier.email}</span></div>
            <div className="flex items-center gap-2"><Phone size={14} /><span>{supplier.phone}</span></div>
            {supplier.address?.city && (
              <div className="flex items-center gap-2"><MapPin size={14} /><span>{supplier.address.city}, {supplier.address.state}</span></div>
            )}
          </div>
          <div className="flex items-center gap-2 pt-2 border-t-2 border-accent">
            <Star size={16} className="text-amber-500 fill-amber-500" />
            <span className="font-bold">{supplier.rating}/5 Rating</span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t-2 border-accent">
            <div><p className="label">Total Orders</p><p className="font-black text-xl">{supplier.totalPurchases || 0}</p></div>
            <div><p className="label">Total Spent</p><p className="font-black text-xl">₹{(supplier.totalAmount || 0).toLocaleString()}</p></div>
          </div>
        </div>
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-black uppercase mb-4">Recent Purchase Orders</h2>
          {recentPurchases.length === 0 ? (
            <p className="text-secondary text-sm font-medium py-8 text-center">No purchase history found for this supplier.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>PO Number</th><th>Items</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {recentPurchases.map(p => (
                    <tr key={p._id}>
                      <td><Link to={`/purchases/${p._id}`} className="font-mono font-bold hover:underline">{p.purchaseNumber}</Link></td>
                      <td>{p.items?.length || 0} item(s)</td>
                      <td className="font-bold">₹{p.totalAmount?.toLocaleString()}</td>
                      <td><StatusBadge status={p.status} /></td>
                      <td className="text-sm text-secondary">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
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
