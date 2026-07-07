import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import { PageLoader } from '../../components/ui/Loading';
import { ArrowLeft, FileText } from 'lucide-react';
import { StatusBadge } from '../../components/ui/DataTable';

export default function SaleDetailPage() {
  const { id } = useParams();
  const { data: sale, isLoading } = useQuery({
    queryKey: ['sale', id],
    queryFn: async () => (await api.get(`/sales/${id}`)).data.data,
  });
  if (isLoading) return <PageLoader />;
  const handleInvoice = () => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/sales/${id}/invoice?token=${localStorage.getItem('token') || ''}`, '_blank');
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/sales" className="btn btn-outline btn-sm inline-flex"><ArrowLeft size={14} /> Back</Link>
        <button onClick={handleInvoice} className="btn-primary btn-sm"><FileText size={14} /> Download PDF Invoice</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card space-y-3">
          <div className="flex items-center justify-between border-b-2 border-accent pb-3">
            <h1 className="text-xl font-black">{sale?.invoiceNumber}</h1>
            <StatusBadge status={sale?.status} />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="label mb-0">Customer:</span><span className="font-bold">{sale?.customer?.name || 'Walk-in'}</span></div>
            <div className="flex justify-between"><span className="label mb-0">Payment:</span><StatusBadge status={sale?.paymentStatus} /></div>
            <div className="flex justify-between"><span className="label mb-0">Method:</span><span className="font-medium capitalize">{sale?.paymentMethod?.replace('_', ' ')}</span></div>
            <div className="flex justify-between"><span className="label mb-0">Date:</span><span>{new Date(sale?.createdAt).toLocaleDateString('en-IN')}</span></div>
          </div>
        </div>
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-black uppercase mb-4">Sale Items</h2>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Discount</th><th>Total</th></tr></thead>
              <tbody>
                {sale?.items?.map((item, i) => (
                  <tr key={i}>
                    <td className="font-bold">{item.product?.name}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.unitPrice}</td>
                    <td>₹{item.discount || 0}</td>
                    <td className="font-bold">₹{item.totalPrice?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4 pt-4 border-t-2 border-primary space-y-1 flex-col items-end">
            <div className="text-sm text-secondary">Subtotal: ₹{sale?.subtotal?.toFixed(2)}</div>
            <div className="text-sm text-secondary">Tax ({sale?.taxRate}%): ₹{sale?.tax?.toFixed(2)}</div>
            <div className="text-sm text-secondary">Discount: ₹{sale?.discount?.toFixed(2)}</div>
            <div className="text-xl font-black">Total: ₹{sale?.totalAmount?.toFixed(2)}</div>
            <div className="text-sm text-success font-bold">Paid: ₹{sale?.amountPaid?.toFixed(2)}</div>
            {sale?.dueAmount > 0 && <div className="text-sm text-danger font-black">Due: ₹{sale?.dueAmount?.toFixed(2)}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
