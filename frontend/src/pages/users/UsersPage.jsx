import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { TableSkeleton, EmptyState } from '../../components/ui/Loading';
import { Pagination } from '../../components/ui/DataTable';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, RefreshCw, AlertTriangle, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', page],
    queryFn: async () => (await api.get('/users', { params: { page, limit: 10 } })).data,
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/auth/register', d),
    onSuccess: () => { queryClient.invalidateQueries(['users']); toast.success('User created'); setIsOpenForm(false); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }) => api.put(`/users/${id}`, d),
    onSuccess: () => { queryClient.invalidateQueries(['users']); toast.success('User updated'); setIsOpenForm(false); setEditingUser(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['users']); toast.success('User deleted'); setDeletingUser(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const openCreate = () => { setEditingUser(null); reset({ name: '', email: '', password: '', role: 'staff', phone: '' }); setIsOpenForm(true); };
  const openEdit = (u) => { setEditingUser(u); reset({ name: u.name, email: u.email, role: u.role, phone: u.phone, isActive: u.isActive }); setIsOpenForm(true); };

  const onSubmit = (d) => {
    if (editingUser) updateMutation.mutate({ id: editingUser._id, ...d });
    else createMutation.mutate(d);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const roleColors = { admin: 'badge-danger', manager: 'badge-warning', staff: 'badge-default' };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage system users and role-based permissions.</p>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm"><Plus size={14} /> Add User</button>
      </div>

      {isLoading ? <TableSkeleton cols={5} rows={6} /> : error ? (
        <div className="alert alert-danger"><AlertTriangle /> Failed to load users.</div>
      ) : data?.data?.length === 0 ? (
        <EmptyState icon={UserCog} title="No Users" description="Create system users to control access." action={<button onClick={openCreate} className="btn-primary btn-sm">Add User</button>} />
      ) : (
        <div className="space-y-4">
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {data.data.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary text-white flex items-center justify-center font-black text-xs">{u.name?.charAt(0)}</div>
                        <span className="font-bold">{u.name}</span>
                      </div>
                    </td>
                    <td className="text-secondary">{u.email}</td>
                    <td><span className={`badge ${roleColors[u.role] || 'badge-default'} capitalize`}>{u.role}</span></td>
                    <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="text-secondary text-sm">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN') : 'Never'}</td>
                    <td className="text-right">
                      <div className="inline-flex gap-1.5">
                        <button onClick={() => openEdit(u)} className="btn-outline btn-sm p-1.5"><Edit2 size={12} /></button>
                        <button onClick={() => setDeletingUser(u)} className="btn-danger btn-sm p-1.5"><Trash2 size={12} /></button>
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

      <Modal isOpen={isOpenForm} onClose={() => setIsOpenForm(false)} title={editingUser ? 'Edit User' : 'Create New User'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body space-y-4">
            <div className="form-group">
              <label className="label">Full Name *</label>
              <input type="text" {...register('name', { required: 'Name is required' })} className="input" />
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>
            <div className="form-group">
              <label className="label">Email *</label>
              <input type="email" {...register('email', { required: 'Email is required' })} className="input" />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>
            {!editingUser && (
              <div className="form-group">
                <label className="label">Password *</label>
                <input type="password" {...register('password', { required: !editingUser, minLength: { value: 6, message: 'Min 6 chars' } })} className="input" placeholder="Minimum 6 characters" />
                {errors.password && <p className="form-error">{errors.password.message}</p>}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Role *</label>
                <select {...register('role', { required: true })} className="select">
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Phone</label>
                <input type="text" {...register('phone')} className="input" placeholder="9876543210" />
              </div>
            </div>
            {editingUser && (
              <div className="form-group">
                <label className="label">Account Status</label>
                <select {...register('isActive')} className="select">
                  <option value={true}>Active</option>
                  <option value={false}>Inactive</option>
                </select>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setIsOpenForm(false)} className="btn-outline btn-sm">Cancel</button>
            <button type="submit" disabled={isPending} className="btn-primary btn-sm">
              {isPending && <RefreshCw size={14} className="animate-spin" />}
              {editingUser ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingUser}
        title="Delete User"
        message={`Delete user ${deletingUser?.name}?`}
        onClose={() => setDeletingUser(null)}
        onConfirm={() => deleteMutation.mutate(deletingUser._id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
