import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { TableSkeleton, EmptyState } from '../../components/ui/Loading';
import { Pagination, StatusBadge } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { useAuthStore } from '../../store';
import { useForm } from 'react-hook-form';
import { Plus, RefreshCw, AlertTriangle, Warehouse } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const { isManager } = useAuthStore();
  const [page, setPage] = useState(1);
  const [isOpenAdjust, setIsOpenAdjust] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory-transactions', page],
    queryFn: async () => (await api.get('/inventory', { params: { page, limit: 15 } })).data,
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => (await api.get('/products?limit=200')).data.data,
  });

  const adjustMutation = useMutation({
    mutationFn: (d) => api.post('/inventory/adjust', d),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['inventory-transactions']);
      queryClient.invalidateQueries(['products']);
      toast.success(`Stock adjusted! New quantity: ${res.data.product?.quantity}`);
      setIsOpenAdjust(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Adjustment failed'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const typeColors = {
    stock_in: 'text-success', stock_out: 'text-danger',
    adjustment: 'text-blue-700', damage: 'text-danger',
    return: 'text-warning', transfer: 'text-secondary',
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Log</h1>
          <p className="page-subtitle">Full transaction history and manual stock adjustments.</p>
        </div>
        {isManager() && (
          <button onClick={() => { reset({ type: 'stock_in', quantity: 1, reason: '' }); setIsOpenAdjust(true); }} className="btn-primary btn-sm">
            <Plus size={14} /> Adjust Stock
          </button>
        )}
      </div>

      {isLoading ? <TableSkeleton cols={7} rows={10} /> : error ? (
        <div className="alert alert-danger"><AlertTriangle /> Failed to load inventory logs.</div>
      ) : data?.data?.length === 0 ? (
        <EmptyState icon={Warehouse} title="No Transactions" description="Stock movements from purchases and sales will appear here." />
      ) : (
        <div className="space-y-4">
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Product</th><th>Type</th><th>Qty</th><th>Before</th><th>After</th><th>Reference</th><th>Date</th></tr></thead>
              <tbody>
                {data.data.map(t => (
                  <tr key={t._id}>
                    <td className="font-bold">{t.product?.name}<br /><span className="font-mono text-xs text-secondary">{t.product?.sku}</span></td>
                    <td><span className={`font-black text-xs uppercase ${typeColors[t.type] || ''}`}>{t.type?.replace('_', ' ')}</span></td>
                    <td className={`font-black ${t.type === 'stock_in' || t.type === 'return' ? 'text-success' : 'text-danger'}`}>
                      {t.type === 'stock_in' || t.type === 'return' ? '+' : '-'}{t.quantity}
                    </td>
                    <td className="text-secondary">{t.previousQuantity}</td>
                    <td className="font-bold">{t.newQuantity}</td>
                    <td className="font-mono text-xs">{t.reference || t.reason || '—'}</td>
                    <td className="text-xs text-secondary">{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={data.pages} total={data.total} limit={15} onPageChange={setPage} />
        </div>
      )}

      {/* Adjust Stock Modal */}
      <Modal isOpen={isOpenAdjust} onClose={() => setIsOpenAdjust(false)} title="Manual Stock Adjustment">
        <form onSubmit={handleSubmit((d) => adjustMutation.mutate(d))}>
          <div className="modal-body space-y-4">
            <div className="form-group">
              <label className="label">Product *</label>
              <select {...register('productId', { required: 'Product is required' })} className="select">
                <option value="">Select product...</option>
                {productsData?.map(p => <option key={p._id} value={p._id}>{p.name} (Current: {p.quantity} {p.unit})</option>)}
              </select>
              {errors.productId && <p className="form-error">{errors.productId.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Transaction Type *</label>
                <select {...register('type', { required: true })} className="select">
                  <option value="stock_in">Stock In (Add)</option>
                  <option value="stock_out">Stock Out (Remove)</option>
                  <option value="adjustment">Set Absolute Value</option>
                  <option value="damage">Damage/Write-off</option>
                  <option value="return">Customer Return</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Quantity *</label>
                <input type="number" min="1" {...register('quantity', { required: 'Quantity is required', min: 1 })} className="input" />
                {errors.quantity && <p className="form-error">{errors.quantity.message}</p>}
              </div>
            </div>
            <div className="form-group">
              <label className="label">Reason *</label>
              <input type="text" {...register('reason', { required: 'Reason is required' })} className="input" placeholder="e.g. Damaged in transit, Recount, Customer return..." />
              {errors.reason && <p className="form-error">{errors.reason.message}</p>}
            </div>
            <div className="alert alert-warning text-xs">
              <AlertTriangle size={14} /> Adjustments are permanent and logged in the audit trail.
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setIsOpenAdjust(false)} className="btn-outline btn-sm">Cancel</button>
            <button type="submit" disabled={adjustMutation.isPending} className="btn-primary btn-sm">
              {adjustMutation.isPending && <RefreshCw size={14} className="animate-spin" />}
              Apply Adjustment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
