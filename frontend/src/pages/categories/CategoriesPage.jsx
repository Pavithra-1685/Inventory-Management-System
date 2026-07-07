import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { TableSkeleton, EmptyState } from '../../components/ui/Loading';
import { SearchBar, Pagination } from '../../components/ui/DataTable';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { useAuthStore } from '../../store';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { isManager, isAdmin } = useAuthStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['categories', search, page],
    queryFn: async () => {
      const res = await api.get('/categories', { params: { page, limit: 10, search } });
      return res.data;
    }
  });

  const formMutation = useMutation({
    mutationFn: async (formData) => {
      if (editingCategory) {
        return api.put(`/categories/${editingCategory._id}`, formData);
      }
      return api.post('/categories', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      toast.success(editingCategory ? 'Category updated' : 'Category created');
      setIsOpenForm(false);
      setEditingCategory(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      toast.success('Category deleted');
      setDeletingCategory(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const handleOpenCreate = () => {
    setEditingCategory(null);
    reset({ name: '', description: '' });
    setIsOpenForm(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCategory(c);
    reset({ name: c.name, description: c.description });
    setIsOpenForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Organize products into distinct structural classifications.</p>
        </div>
        {isManager() && (
          <button onClick={handleOpenCreate} className="btn-primary btn-sm">
            <Plus size={14} /> Add Category
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <SearchBar value={search} onChange={(val) => { setSearch(val); setPage(1); }} placeholder="Search categories..." />
      </div>

      {isLoading ? (
        <TableSkeleton cols={3} rows={6} />
      ) : error ? (
        <div className="alert alert-danger">
          <AlertTriangle /> Failed to load categories.
        </div>
      ) : data?.data?.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No Categories Available"
          description="Create custom product categories to keep inventory structured."
          action={isManager() ? <button onClick={handleOpenCreate} className="btn-primary btn-sm">Add Category</button> : null}
        />
      ) : (
        <div className="space-y-4">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Products Count</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map(c => (
                  <tr key={c._id}>
                    <td className="font-bold">{c.name}</td>
                    <td className="text-secondary">{c.description || '—'}</td>
                    <td className="font-bold">{c.productCount || 0}</td>
                    <td className="text-right">
                      <div className="inline-flex gap-1.5">
                        {isManager() && (
                          <button onClick={() => handleOpenEdit(c)} className="btn-outline btn-sm p-1.5"><Edit2 size={12} /></button>
                        )}
                        {isAdmin() && (
                          <button onClick={() => setDeletingCategory(c)} className="btn-danger btn-sm p-1.5"><Trash2 size={12} /></button>
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
      <Modal isOpen={isOpenForm} onClose={() => setIsOpenForm(false)} title={editingCategory ? 'Edit Category' : 'Create Category'}>
        <form onSubmit={handleSubmit((d) => formMutation.mutate(d))}>
          <div className="modal-body space-y-4">
            <div className="form-group">
              <label className="label">Category Name *</label>
              <input type="text" {...register('name', { required: 'Name is required' })} className="input" placeholder="e.g. Audio Gadgets" />
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea {...register('description')} className="textarea" rows={3} placeholder="Explain the range of products in this category..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setIsOpenForm(false)} className="btn-outline btn-sm">Cancel</button>
            <button type="submit" disabled={formMutation.isPending} className="btn-primary btn-sm">
              {formMutation.isPending && <RefreshCw size={14} className="animate-spin" />}
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingCategory}
        title="Delete Category"
        message={`Are you sure you want to delete Category: ${deletingCategory?.name}?`}
        onClose={() => setDeletingCategory(null)}
        onConfirm={() => deleteMutation.mutate(deletingCategory._id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
