import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import { PageLoader } from '../../components/ui/Loading';
import { ArrowLeft } from 'lucide-react';
import { StatusBadge } from '../../components/ui/DataTable';

export default function PurchaseDetailPage() {
  const { id } = useParams();
  const { data: purchase, isLoading } = useQuery({
    queryKey: ['purchase', id],
    queryFn: async () => (await api.get(`/purchases/${id}`)).data.data,
  });
  if (isLoading) return <PageLoader />;
  return (
    <div className="space-y-6">
      <Link to="/purchases" className="btn btn-outline btn-sm inline-flex"><ArrowLeft size={14} /> Back</Link>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card space-y-3">
          <div className="flex items-center justify-between border-b-2 border-accent pb-3">
            <h1 className="text-xl font-black">{purchase?.purchaseNumber}</h1>
            <StatusBadge status={purchase?.status} />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="label mb-0">Supplier:</span><span className="font-bold">{purchase?.supplier?.companyName}</span></div>
            <div className="flex justify-between"><span className="label mb-0">Payment:</span><StatusBadge status={purchase?.paymentStatus} /></div>
            <div className="flex justify-between"><span className="label mb-0">Total:</span><span className="font-black">₹{purchase?.totalAmount?.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="label mb-0">Created:</span><span>{new Date(purchase?.createdAt).toLocaleDateString('en-IN')}</span></div>
          </div>
          {purchase?.notes && <div className="border-t-2 border-accent pt-3"><p className="label">Notes</p><p className="text-sm">{purchase.notes}</p></div>}
        </div>
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-black uppercase mb-4">Order Items</h2>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Cost</th><th>Total</th></tr></thead>
              <tbody>
                {purchase?.items?.map((item, i) => (
                  <tr key={i}>
                    <td className="font-bold">{item.product?.name}</td>
                    <td className="font-mono text-xs">{item.product?.sku}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.unitCost}</td>
                    <td className="font-bold">₹{item.totalCost?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4 pt-4 border-t-2 border-primary">
            <div className="text-right space-y-1">
              <div className="text-sm text-secondary">Subtotal: ₹{purchase?.subtotal?.toLocaleString()}</div>
              <div className="text-sm text-secondary">Tax: ₹{purchase?.tax?.toLocaleString()}</div>
              <div className="text-xl font-black">Total: ₹{purchase?.totalAmount?.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
