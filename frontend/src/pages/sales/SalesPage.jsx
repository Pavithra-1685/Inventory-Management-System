import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { TableSkeleton, EmptyState } from '../../components/ui/Loading';
import { Pagination, StatusBadge } from '../../components/ui/DataTable';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { useAuthStore } from '../../store';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Eye, Trash2, RefreshCw, AlertTriangle, TrendingUp, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function SalesPage() {
  const queryClient = useQueryClient();
  const { isManager } = useAuthStore();
  const [page, setPage] = useState(1);
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [deletingSale, setDeletingSale] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['sales', page],
    queryFn: async () => (await api.get('/sales', { params: { page, limit: 10 } })).data,
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => (await api.get('/customers?limit=200')).data.data,
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => (await api.get('/products?limit=200')).data.data,
  });

  const formMutation = useMutation({
    mutationFn: (d) => api.post('/sales', d),
    onSuccess: () => {
      queryClient.invalidateQueries(['sales']);
      queryClient.invalidateQueries(['products']);
      toast.success('Sale created & stock deducted!');
      setIsOpenForm(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create sale'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/sales/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['sales']);
      toast.success('Sale deleted');
      setDeletingSale(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const { register, handleSubmit, control, watch, reset } = useForm({
    defaultValues: { customer: '', items: [{ product: '', quantity: 1, unitPrice: 0, discount: 0 }], paymentMethod: 'cash', taxRate: 18, notes: '' }
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');
  const taxRate = watch('taxRate') || 0;

  const subtotal = watchedItems?.reduce((sum, item) => {
    const lineTotal = (Number(item.quantity) * Number(item.unitPrice)) - Number(item.discount || 0);
    return sum + lineTotal;
  }, 0) || 0;

  const total = subtotal + (subtotal * Number(taxRate) / 100);

  const openCreate = () => {
    reset({ customer: '', items: [{ product: '', quantity: 1, unitPrice: 0, discount: 0 }], paymentMethod: 'cash', taxRate: 18, notes: '' });
    setIsOpenForm(true);
  };

  const onSubmit = (d) => {
    const items = d.items.map(item => ({
      ...item,
      totalPrice: (Number(item.quantity) * Number(item.unitPrice)) - Number(item.discount || 0),
    }));
    formMutation.mutate({ ...d, items, amountPaid: d.paymentMethod === 'cash' ? total : 0 });
  };

  const handleDownloadInvoice = (id) => {
    const token = localStorage.getItem('token');
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/sales/${id}/invoice`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Orders</h1>
          <p className="page-subtitle">Create sales, generate invoices and track revenue.</p>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm"><Plus size={14} /> New Sale</button>
      </div>

      {isLoading ? <TableSkeleton cols={7} rows={7} /> : error ? (
        <div className="alert alert-danger"><AlertTriangle /> Failed to load sales.</div>
      ) : data?.data?.length === 0 ? (
        <EmptyState icon={TrendingUp} title="No Sales Yet" description="Create your first sale to see revenue reports." action={<button onClick={openCreate} className="btn-primary btn-sm">Create Sale</button>} />
      ) : (
        <div className="space-y-4">
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Invoice</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {data.data.map(s => (
                  <tr key={s._id}>
                    <td><Link to={`/sales/${s._id}`} className="font-mono font-bold hover:underline text-sm">{s.invoiceNumber}</Link></td>
                    <td>{s.customer?.name || 'Walk-in'}</td>
                    <td>{s.items?.length || 0}</td>
                    <td className="font-bold">₹{s.totalAmount?.toLocaleString()}</td>
                    <td><StatusBadge status={s.paymentStatus} /></td>
                    <td><StatusBadge status={s.status} /></td>
                    <td className="text-right">
                      <div className="inline-flex gap-1.5">
                        <Link to={`/sales/${s._id}`} className="btn-outline btn-sm p-1.5"><Eye size={12} /></Link>
                        <button onClick={() => handleDownloadInvoice(s._id)} className="btn-outline btn-sm p-1.5" title="Download Invoice"><FileText size={12} /></button>
                        {isManager() && s.status !== 'completed' && (
                          <button onClick={() => setDeletingSale(s)} className="btn-danger btn-sm p-1.5"><Trash2 size={12} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={data.pages} total={data.total} limit={10} onPageChange={setPage} />
        </div>
      )}

      {/* Create Sale Modal */}
      <Modal isOpen={isOpenForm} onClose={() => setIsOpenForm(false)} title="Create Sale Order" maxWidth="max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Customer (Optional)</label>
                <select {...register('customer')} className="select">
                  <option value="">Walk-in Customer</option>
                  {customersData?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Payment Method</label>
                <select {...register('paymentMethod')} className="select">
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit">Credit</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Sale Items *</label>
                <button type="button" onClick={() => append({ product: '', quantity: 1, unitPrice: 0, discount: 0 })} className="btn-outline btn-sm">
                  <Plus size={12} /> Add Line
                </button>
              </div>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-center border-2 border-accent p-3 bg-bg">
                    <div className="col-span-4">
                      <select {...register(`items.${index}.product`, { required: true })} className="select text-xs">
                        <option value="">Select product...</option>
                        {productsData?.map(p => <option key={p._id} value={p._id}>{p.name} (Qty:{p.quantity})</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input type="number" min="1" {...register(`items.${index}.quantity`)} className="input text-xs" placeholder="Qty" />
                    </div>
                    <div className="col-span-2">
                      <input type="number" step="0.01" min="0" {...register(`items.${index}.unitPrice`)} className="input text-xs" placeholder="Price ₹" />
                    </div>
                    <div className="col-span-2">
                      <input type="number" step="0.01" min="0" {...register(`items.${index}.discount`)} className="input text-xs" placeholder="Disc ₹" />
                    </div>
                    <div className="col-span-2 text-right text-xs font-bold">
                      ₹{(((watchedItems?.[index]?.quantity || 0) * (watchedItems?.[index]?.unitPrice || 0)) - (watchedItems?.[index]?.discount || 0)).toFixed(0)}
                      {fields.length > 1 && (
                        <button type="button" onClick={() => remove(index)} className="ml-1 text-danger"><Trash2 size={10} /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-2 border-t-2 border-primary pt-2 space-x-6">
                <div className="flex items-center gap-2 text-xs">
                  <label className="label mb-0">Tax Rate %</label>
                  <input type="number" {...register('taxRate')} className="input w-16 text-xs" />
                </div>
                <div className="text-right">
                  <p className="text-xs text-secondary">Subtotal: ₹{subtotal.toFixed(2)}</p>
                  <p className="text-sm font-black">Total: ₹{total.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Notes</label>
              <textarea {...register('notes')} className="textarea" rows={2} placeholder="Special instructions, delivery details..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setIsOpenForm(false)} className="btn-outline btn-sm">Cancel</button>
            <button type="submit" disabled={formMutation.isPending} className="btn-primary btn-sm">
              {formMutation.isPending && <RefreshCw size={14} className="animate-spin" />}
              Create Sale & Deduct Stock
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingSale}
        title="Delete Sale"
        message={`Delete sale ${deletingSale?.invoiceNumber}?`}
        onClose={() => setDeletingSale(null)}
        onConfirm={() => deleteMutation.mutate(deletingSale._id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
