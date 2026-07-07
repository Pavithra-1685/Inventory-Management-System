import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { TableSkeleton, EmptyState } from '../../components/ui/Loading';
import { SearchBar, Pagination } from '../../components/ui/DataTable';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { useAuthStore } from '../../store';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, Eye, AlertTriangle, RefreshCw, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const { isManager, isAdmin } = useAuthStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deletingSupplier, setDeletingSupplier] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['suppliers', search, page],
    queryFn: async () => {
      const res = await api.get('/suppliers', { params: { page, limit: 10, search } });
      return res.data;
    }
  });

  const formMutation = useMutation({
    mutationFn: async (formData) => {
      if (editingSupplier) {
        return api.put(`/suppliers/${editingSupplier._id}`, formData);
      }
      return api.post('/suppliers', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      toast.success(editingSupplier ? 'Supplier updated' : 'Supplier created');
      setIsOpenForm(false);
      setEditingSupplier(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      toast.success('Supplier deleted');
      setDeletingSupplier(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    reset({
      companyName: '', contactPerson: '', email: '', phone: '',
      rating: 3, address: { street: '', city: '', state: '', zipCode: '' }, notes: ''
    });
    setIsOpenForm(true);
  };

  const handleOpenEdit = (s) => {
    setEditingSupplier(s);
    reset({
      companyName: s.companyName, contactPerson: s.contactPerson,
      email: s.email, phone: s.phone, rating: s.rating || 3,
      address: {
        street: s.address?.street || '',
        city: s.address?.city || '',
        state: s.address?.state || '',
        zipCode: s.address?.zipCode || '',
      },
      notes: s.notes || ''
    });
    setIsOpenForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">Track supplier ratings, addresses and trade transaction volumes.</p>
        </div>
        {isManager() && (
          <button onClick={handleOpenCreate} className="btn-primary btn-sm">
            <Plus size={14} /> Add Supplier
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <SearchBar value={search} onChange={(val) => { setSearch(val); setPage(1); }} placeholder="Search supplier company..." />
      </div>

      {isLoading ? (
        <TableSkeleton cols={5} rows={6} />
      ) : error ? (
        <div className="alert alert-danger">
          <AlertTriangle /> Failed to load suppliers.
        </div>
      ) : data?.data?.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No Suppliers Found"
          description="Register suppliers to connect purchases and update procurement stock logs."
          action={isManager() ? <button onClick={handleOpenCreate} className="btn-primary btn-sm">Add Supplier</button> : null}
        />
      ) : (
        <div className="space-y-4">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Company Details</th>
                  <th>Contact Person</th>
                  <th>Procurement Volume</th>
                  <th>Rating</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div>
                        <Link to={`/suppliers/${s._id}`} className="font-bold text-primary hover:underline">{s.companyName}</Link>
                        <p className="text-xs text-secondary">{s.email} · {s.phone}</p>
                      </div>
                    </td>
                    <td>{s.contactPerson}</td>
                    <td>
                      <div className="text-xs">
                        <p className="font-bold">₹{s.totalAmount?.toLocaleString('en-IN')}</p>
                        <p className="text-secondary">{s.totalPurchases || 0} POs</p>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star size={14} className="fill-amber-500" />
                        <span>{s.rating}</span>
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="inline-flex gap-1.5">
                        <Link to={`/suppliers/${s._id}`} className="btn-outline btn-sm p-1.5"><Eye size={12} /></Link>
                        {isManager() && (
                          <button onClick={() => handleOpenEdit(s)} className="btn-outline btn-sm p-1.5"><Edit2 size={12} /></button>
                        )}
                        {isAdmin() && (
                          <button onClick={() => setDeletingSupplier(s)} className="btn-danger btn-sm p-1.5"><Trash2 size={12} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            pages={data.pages}
            total={data.total}
            limit={10}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Form Modal */}
      <Modal isOpen={isOpenForm} onClose={() => setIsOpenForm(false)} title={editingSupplier ? 'Edit Supplier' : 'Register Supplier'}>
        <form onSubmit={handleSubmit((d) => formMutation.mutate(d))}>
          <div className="modal-body space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Company Name *</label>
                <input type="text" {...register('companyName', { required: 'Company is required' })} className="input" placeholder="TechCorp Ltd" />
                {errors.companyName && <p className="form-error">{errors.companyName.message}</p>}
              </div>
              <div className="form-group">
                <label className="label">Contact Person *</label>
                <input type="text" {...register('contactPerson', { required: 'Contact name is required' })} className="input" placeholder="John Doe" />
                {errors.contactPerson && <p className="form-error">{errors.contactPerson.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Email Address *</label>
                <input type="email" {...register('email', { required: 'Email is required' })} className="input" placeholder="sales@techcorp.com" />
                {errors.email && <p className="form-error">{errors.email.message}</p>}
              </div>
              <div className="form-group">
                <label className="label">Phone Number *</label>
                <input type="text" {...register('phone', { required: 'Phone is required' })} className="input" placeholder="9876543210" />
                {errors.phone && <p className="form-error">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="form-group">
              <label className="label">Supplier Performance Rating *</label>
              <select {...register('rating')} className="select">
                <option value="1">1 Star (Poor)</option>
                <option value="2">2 Star (Fair)</option>
                <option value="3">3 Star (Satisfactory)</option>
                <option value="4">4 Star (Good)</option>
                <option value="5">5 Star (Outstanding)</option>
              </select>
            </div>

            <div className="border-t-2 border-accent pt-4 space-y-4">
              <p className="text-xs font-black uppercase text-secondary">Address Details</p>
              <div className="form-group">
                <label className="label">Street Address</label>
                <input type="text" {...register('address.street')} className="input" placeholder="Suite 404, Tech Park" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="label">City</label>
                  <input type="text" {...register('address.city')} className="input" placeholder="Bangalore" />
                </div>
                <div className="form-group">
                  <label className="label">State</label>
                  <input type="text" {...register('address.state')} className="input" placeholder="Karnataka" />
                </div>
                <div className="form-group">
                  <label className="label">Zip Code</label>
                  <input type="text" {...register('address.zipCode')} className="input" placeholder="560001" />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Notes / Terms</label>
              <textarea {...register('notes')} className="textarea" rows={2} placeholder="Add payment terms, lead times, credit details..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setIsOpenForm(false)} className="btn-outline btn-sm">Cancel</button>
            <button type="submit" disabled={formMutation.isPending} className="btn-primary btn-sm">
              {formMutation.isPending && <RefreshCw size={14} className="animate-spin" />}
              {editingSupplier ? 'Save Changes' : 'Register Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingSupplier}
        title="Delete Supplier"
        message={`Delete supplier ${deletingSupplier?.companyName}?`}
        onClose={() => setDeletingSupplier(null)}
        onConfirm={() => deleteMutation.mutate(deletingSupplier._id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
