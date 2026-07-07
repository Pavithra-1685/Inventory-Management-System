import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { TableSkeleton, EmptyState } from '../../components/ui/Loading';
import { SearchBar, Pagination, StatusBadge } from '../../components/ui/DataTable';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { useAuthStore } from '../../store';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Eye, CheckCircle, Trash2, RefreshCw, AlertTriangle, PackageCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function PurchasesPage() {
  const queryClient = useQueryClient();
  const { isManager, isAdmin } = useAuthStore();
  const [page, setPage] = useState(1);
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [receivingPO, setReceivingPO] = useState(null);
  const [deletingPO, setDeletingPO] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['purchases', page],
    queryFn: async () => (await api.get('/purchases', { params: { page, limit: 10 } })).data,
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: async () => (await api.get('/suppliers?limit=100')).data.data,
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => (await api.get('/products?limit=200')).data.data,
  });

  const formMutation = useMutation({
    mutationFn: (d) => api.post('/purchases', d),
    onSuccess: () => {
      queryClient.invalidateQueries(['purchases']);
      toast.success('Purchase order created');
      setIsOpenForm(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create PO'),
  });

  const receiveMutation = useMutation({
    mutationFn: (id) => api.put(`/purchases/${id}/receive`),
    onSuccess: () => {
      queryClient.invalidateQueries(['purchases']);
      queryClient.invalidateQueries(['products']);
      toast.success('Goods received — stock updated!');
      setReceivingPO(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to receive'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/purchases/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['purchases']);
      toast.success('Purchase order deleted');
      setDeletingPO(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm({
    defaultValues: { supplier: '', items: [{ product: '', quantity: 1, unitCost: 0 }], notes: '' }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');

  const totalAmount = watchedItems?.reduce((sum, item) => {
    return sum + (Number(item.quantity) * Number(item.unitCost));
  }, 0) || 0;

  const openCreate = () => {
    reset({ supplier: '', items: [{ product: '', quantity: 1, unitCost: 0 }], notes: '' });
    setIsOpenForm(true);
  };

  const onSubmit = (d) => {
    const payload = {
      ...d,
      items: d.items.map(item => ({
        ...item,
        totalCost: Number(item.quantity) * Number(item.unitCost),
      }))
    };
    formMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">Create POs, receive goods and auto-update inventory stock.</p>
        </div>
        {isManager() && <button onClick={openCreate} className="btn-primary btn-sm"><Plus size={14} /> New Purchase Order</button>}
      </div>

      {isLoading ? <TableSkeleton cols={6} rows={7} /> : error ? (
        <div className="alert alert-danger"><AlertTriangle /> Failed to load purchase orders.</div>
      ) : data?.data?.length === 0 ? (
        <EmptyState icon={PackageCheck} title="No Purchase Orders" description="Create your first PO to start receiving stock." action={isManager() ? <button onClick={openCreate} className="btn-primary btn-sm">New Purchase Order</button> : null} />
      ) : (
        <div className="space-y-4">
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>PO Number</th><th>Supplier</th><th>Items</th><th>Amount</th><th>Status</th><th>Payment</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {data.data.map(p => (
                  <tr key={p._id}>
                    <td><Link to={`/purchases/${p._id}`} className="font-mono font-bold hover:underline text-sm">{p.purchaseNumber}</Link></td>
                    <td>{p.supplier?.companyName || '—'}</td>
                    <td>{p.items?.length || 0}</td>
                    <td className="font-bold">₹{p.totalAmount?.toLocaleString()}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td><StatusBadge status={p.paymentStatus} /></td>
                    <td className="text-right">
                      <div className="inline-flex gap-1.5">
                        <Link to={`/purchases/${p._id}`} className="btn-outline btn-sm p-1.5"><Eye size={12} /></Link>
                        {isManager() && p.status !== 'received' && p.status !== 'cancelled' && (
                          <button onClick={() => setReceivingPO(p)} className="btn-success btn-sm p-1.5" title="Receive Goods"><CheckCircle size={12} /></button>
                        )}
                        {isAdmin() && p.status !== 'received' && (
                          <button onClick={() => setDeletingPO(p)} className="btn-danger btn-sm p-1.5"><Trash2 size={12} /></button>
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

      {/* Create PO Modal */}
      <Modal isOpen={isOpenForm} onClose={() => setIsOpenForm(false)} title="Create Purchase Order" maxWidth="max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="form-group">
              <label className="label">Supplier *</label>
              <select {...register('supplier', { required: 'Supplier is required' })} className="select">
                <option value="">Choose supplier...</option>
                {suppliersData?.map(s => <option key={s._id} value={s._id}>{s.companyName}</option>)}
              </select>
              {errors.supplier && <p className="form-error">{errors.supplier.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Order Items *</label>
                <button type="button" onClick={() => append({ product: '', quantity: 1, unitCost: 0 })} className="btn-outline btn-sm">
                  <Plus size={12} /> Add Item
                </button>
              </div>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-center border-2 border-accent p-3 bg-bg">
                    <div className="col-span-5">
                      <select {...register(`items.${index}.product`, { required: true })} className="select text-xs">
                        <option value="">Select product...</option>
                        {productsData?.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input type="number" min="1" {...register(`items.${index}.quantity`, { required: true, min: 1 })} className="input text-xs" placeholder="Qty" />
                    </div>
                    <div className="col-span-3">
                      <input type="number" step="0.01" min="0" {...register(`items.${index}.unitCost`, { required: true, min: 0 })} className="input text-xs" placeholder="Unit Cost ₹" />
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-xs font-bold">₹{((watchedItems?.[index]?.quantity || 0) * (watchedItems?.[index]?.unitCost || 0)).toFixed(0)}</span>
                      {fields.length > 1 && (
                        <button type="button" onClick={() => remove(index)} className="ml-2 text-danger hover:text-red-900"><Trash2 size={12} /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-2 border-t-2 border-primary pt-2">
                <p className="text-sm font-black">Total: ₹{totalAmount.toFixed(2)}</p>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Notes</label>
              <textarea {...register('notes')} className="textarea" rows={2} placeholder="Special instructions, delivery terms..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setIsOpenForm(false)} className="btn-outline btn-sm">Cancel</button>
            <button type="submit" disabled={formMutation.isPending} className="btn-primary btn-sm">
              {formMutation.isPending && <RefreshCw size={14} className="animate-spin" />}
              Create Purchase Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Receive Goods Dialog */}
      <ConfirmDialog
        isOpen={!!receivingPO}
        title="Confirm Goods Receipt"
        message={`Receive all goods from ${receivingPO?.purchaseNumber}? This will permanently update inventory stock levels.`}
        confirmLabel="Receive Goods"
        onClose={() => setReceivingPO(null)}
        onConfirm={() => receiveMutation.mutate(receivingPO._id)}
        isLoading={receiveMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!deletingPO}
        title="Delete Purchase Order"
        message={`Delete PO ${deletingPO?.purchaseNumber}? This cannot be undone.`}
        onClose={() => setDeletingPO(null)}
        onConfirm={() => deleteMutation.mutate(deletingPO._id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
