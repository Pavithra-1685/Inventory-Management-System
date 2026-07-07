import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { TableSkeleton, EmptyState } from '../../components/ui/Loading';
import { SearchBar, Pagination } from '../../components/ui/DataTable';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { useAuthStore } from '../../store';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, Eye, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const { isManager, isAdmin } = useAuthStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', search, page],
    queryFn: async () => (await api.get('/customers', { params: { page, limit: 10, search } })).data,
  });

  const formMutation = useMutation({
    mutationFn: async (formData) =>
      editingCustomer ? api.put(`/customers/${editingCustomer._id}`, formData) : api.post('/customers', formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      toast.success(editingCustomer ? 'Customer updated' : 'Customer created');
      setIsOpenForm(false);
      setEditingCustomer(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Operation failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      toast.success('Customer deleted');
      setDeletingCustomer(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const openCreate = () => {
    setEditingCustomer(null);
    reset({ name: '', email: '', phone: '', type: 'retail', notes: '' });
    setIsOpenForm(true);
  };

  const openEdit = (c) => {
    setEditingCustomer(c);
    reset({ name: c.name, email: c.email, phone: c.phone, type: c.type, notes: c.notes });
    setIsOpenForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage customer relationships and purchase histories.</p>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm"><Plus size={14} /> Add Customer</button>
      </div>

      <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name, phone, email..." />

      {isLoading ? <TableSkeleton cols={5} rows={6} /> : error ? (
        <div className="alert alert-danger"><AlertTriangle /> Failed to load customers.</div>
      ) : data?.data?.length === 0 ? (
        <EmptyState icon={Plus} title="No Customers" description="Add customer records to track sales and invoices." action={<button onClick={openCreate} className="btn-primary btn-sm">Add Customer</button>} />
      ) : (
        <div className="space-y-4">
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Customer</th><th>Contact</th><th>Type</th><th>Total Spent</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {data.data.map(c => (
                  <tr key={c._id}>
                    <td className="font-bold">
                      <Link to={`/customers/${c._id}`} className="hover:underline">{c.name}</Link>
                    </td>
                    <td className="text-sm text-secondary">{c.phone}<br />{c.email}</td>
                    <td><span className="badge badge-default capitalize">{c.type}</span></td>
                    <td className="font-bold">₹{(c.totalAmount || 0).toLocaleString()}</td>
                    <td className="text-right">
                      <div className="inline-flex gap-1.5">
                        <Link to={`/customers/${c._id}`} className="btn-outline btn-sm p-1.5"><Eye size={12} /></Link>
                        <button onClick={() => openEdit(c)} className="btn-outline btn-sm p-1.5"><Edit2 size={12} /></button>
                        {isAdmin() && <button onClick={() => setDeletingCustomer(c)} className="btn-danger btn-sm p-1.5"><Trash2 size={12} /></button>}
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

      <Modal isOpen={isOpenForm} onClose={() => setIsOpenForm(false)} title={editingCustomer ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit((d) => formMutation.mutate(d))}>
          <div className="modal-body space-y-4">
            <div className="form-group">
              <label className="label">Customer Name *</label>
              <input type="text" {...register('name', { required: 'Name is required' })} className="input" placeholder="Full name or company" />
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Email</label>
                <input type="email" {...register('email')} className="input" placeholder="customer@email.com" />
              </div>
              <div className="form-group">
                <label className="label">Phone *</label>
                <input type="text" {...register('phone', { required: 'Phone is required' })} className="input" placeholder="9876543210" />
                {errors.phone && <p className="form-error">{errors.phone.message}</p>}
              </div>
            </div>
            <div className="form-group">
              <label className="label">Customer Type</label>
              <select {...register('type')} className="select">
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Notes</label>
              <textarea {...register('notes')} className="textarea" rows={2} placeholder="Additional remarks..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setIsOpenForm(false)} className="btn-outline btn-sm">Cancel</button>
            <button type="submit" disabled={formMutation.isPending} className="btn-primary btn-sm">
              {formMutation.isPending && <RefreshCw size={14} className="animate-spin" />}
              {editingCustomer ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingCustomer}
        title="Delete Customer"
        message={`Delete customer ${deletingCustomer?.name}?`}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={() => deleteMutation.mutate(deletingCustomer._id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
