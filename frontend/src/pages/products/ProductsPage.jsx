import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { TableSkeleton, EmptyState } from '../../components/ui/Loading';
import { SearchBar, Pagination } from '../../components/ui/DataTable';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { useAuthStore } from '../../store';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, Eye, Download, AlertTriangle, RefreshCw, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { isManager, isAdmin } = useAuthStore();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', search, categoryFilter, page],
    queryFn: async () => {
      const params = { page, limit: 10, search };
      if (categoryFilter) params.category = categoryFilter;
      const res = await api.get('/products', { params });
      return res.data;
    }
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories-list'],
    queryFn: async () => {
      const res = await api.get('/categories?limit=100');
      return res.data.data;
    }
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: async () => {
      const res = await api.get('/suppliers?limit=100');
      return res.data.data;
    }
  });

  // Mutations
  const formMutation = useMutation({
    mutationFn: async (formData) => {
      if (editingProduct) {
        return api.put(`/products/${editingProduct._id}`, formData);
      }
      return api.post('/products', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success(editingProduct ? 'Product updated' : 'Product created');
      setIsOpenForm(false);
      setEditingProduct(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success('Product deleted');
      setDeletingProduct(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  });

  // Forms
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const handleOpenCreate = () => {
    setEditingProduct(null);
    reset({
      name: '', sku: '', barcode: '', category: '',
      description: '', costPrice: 0, sellingPrice: 0,
      quantity: 0, minimumStock: 10, supplier: '', unit: 'pcs'
    });
    setIsOpenForm(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    reset({
      name: p.name, sku: p.sku, barcode: p.barcode,
      category: p.category?._id || p.category,
      description: p.description, costPrice: p.costPrice,
      sellingPrice: p.sellingPrice, quantity: p.quantity,
      minimumStock: p.minimumStock, supplier: p.supplier?._id || p.supplier,
      unit: p.unit
    });
    setIsOpenForm(true);
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/products/export', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'products.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products Catalog</h1>
          <p className="page-subtitle">Manage system catalog, stock parameters and SKUs.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExport} className="btn btn-outline btn-sm">
            <Download size={14} /> Export CSV
          </button>
          {isManager() && (
            <button onClick={handleOpenCreate} className="btn-primary btn-sm">
              <Plus size={14} /> Add Product
            </button>
          )}
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <SearchBar value={search} onChange={(val) => { setSearch(val); setPage(1); }} placeholder="Search name, SKU, barcode..." />

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="select py-2 w-full md:w-48"
          >
            <option value="">All Categories</option>
            {categoriesData?.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main product table */}
      {isLoading ? (
        <TableSkeleton cols={7} rows={8} />
      ) : error ? (
        <div className="alert alert-danger">
          <AlertTriangle /> Failed to load products. Check server logs.
        </div>
      ) : data?.data?.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Products Found"
          description="Try modifying search filters or add a new product."
          action={isManager() ? <button onClick={handleOpenCreate} className="btn-primary btn-sm">Add Product</button> : null}
        />
      ) : (
        <div className="space-y-4">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>SKU / Barcode</th>
                  <th>Category</th>
                  <th>Cost / Price</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map(p => (
                  <tr key={p._id} className={p.quantity <= p.minimumStock ? 'bg-red-50/50' : ''}>
                    <td>
                      <div>
                        <Link to={`/products/${p._id}`} className="font-black text-primary hover:underline">{p.name}</Link>
                        <p className="text-xs text-secondary/70 truncate max-w-xs">{p.description || 'No description'}</p>
                      </div>
                    </td>
                    <td>
                      <div className="font-mono text-xs space-y-0.5">
                        <p className="font-bold">{p.sku}</p>
                        <p className="text-secondary">{p.barcode || '—'}</p>
                      </div>
                    </td>
                    <td>{p.category?.name || 'Unassigned'}</td>
                    <td>
                      <div className="text-xs">
                        <p className="text-secondary">Cost: ₹{p.costPrice}</p>
                        <p className="font-bold text-primary">Sell: ₹{p.sellingPrice}</p>
                      </div>
                    </td>
                    <td>
                      <div className="font-bold">
                        <span className={p.quantity <= p.minimumStock ? 'text-danger font-black' : 'text-primary'}>
                          {p.quantity}
                        </span>{' '}
                        <span className="text-xs text-secondary">{p.unit}</span>
                      </div>
                    </td>
                    <td>
                      {p.quantity <= p.minimumStock ? (
                        <span className="badge badge-danger">Low Stock</span>
                      ) : (
                        <span className="badge badge-success">In Stock</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="inline-flex gap-1.5">
                        <Link to={`/products/${p._id}`} className="btn-outline btn-sm p-1.5"><Eye size={12} /></Link>
                        {isManager() && (
                          <button onClick={() => handleOpenEdit(p)} className="btn-outline btn-sm p-1.5"><Edit2 size={12} /></button>
                        )}
                        {isAdmin() && (
                          <button onClick={() => setDeletingProduct(p)} className="btn-danger btn-sm p-1.5"><Trash2 size={12} /></button>
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
      <Modal isOpen={isOpenForm} onClose={() => setIsOpenForm(false)} title={editingProduct ? 'Edit Product' : 'Add New Product'}>
        <form onSubmit={handleSubmit((d) => formMutation.mutate(d))}>
          <div className="modal-body space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="form-group">
              <label className="label">Product Name *</label>
              <input type="text" {...register('name', { required: 'Name is required' })} className="input" placeholder="e.g. Wireless Headphones" />
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">SKU (Auto-Generated if blank)</label>
                <input type="text" {...register('sku')} className="input uppercase" placeholder="e.g. ELE-001" />
              </div>
              <div className="form-group">
                <label className="label">Barcode</label>
                <input type="text" {...register('barcode')} className="input" placeholder="e.g. 890123456789" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Category *</label>
                <select {...register('category', { required: 'Category is required' })} className="select">
                  <option value="">Select Category</option>
                  {categoriesData?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                {errors.category && <p className="form-error">{errors.category.message}</p>}
              </div>
              <div className="form-group">
                <label className="label">Unit *</label>
                <select {...register('unit', { required: 'Unit is required' })} className="select">
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="ltr">Liters (ltr)</option>
                  <option value="box">Box</option>
                  <option value="pack">Pack</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="form-group">
                <label className="label">Cost Price (₹) *</label>
                <input type="number" step="0.01" {...register('costPrice', { required: 'Required', min: 0 })} className="input" />
              </div>
              <div className="form-group">
                <label className="label">Selling Price (₹) *</label>
                <input type="number" step="0.01" {...register('sellingPrice', { required: 'Required', min: 0 })} className="input" />
              </div>
              <div className="form-group">
                <label className="label">Min Stock Limit *</label>
                <input type="number" {...register('minimumStock', { required: 'Required', min: 0 })} className="input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Initial Quantity *</label>
                <input type="number" {...register('quantity', { disabled: !!editingProduct })} className="input disabled:bg-accent/30" />
                <p className="text-[10px] text-secondary mt-1">Quantity edits can be managed via stock adjustment logs.</p>
              </div>
              <div className="form-group">
                <label className="label">Supplier</label>
                <select {...register('supplier')} className="select">
                  <option value="">Select Supplier</option>
                  {suppliersData?.map(s => <option key={s._id} value={s._id}>{s.companyName}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Description</label>
              <textarea {...register('description')} className="textarea" rows={3} placeholder="Provide details about specs, contents, warranty etc..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setIsOpenForm(false)} className="btn-outline btn-sm">Cancel</button>
            <button type="submit" disabled={formMutation.isPending} className="btn-primary btn-sm">
              {formMutation.isPending && <RefreshCw size={14} className="animate-spin" />}
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingProduct}
        title="Confirm Deletion"
        message={`Are you sure you want to delete ${deletingProduct?.name}? This action is irreversible.`}
        onClose={() => setDeletingProduct(null)}
        onConfirm={() => deleteMutation.mutate(deletingProduct._id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
