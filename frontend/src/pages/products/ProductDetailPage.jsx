import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import { PageLoader } from '../../components/ui/Loading';
import { AlertTriangle, ArrowLeft, Barcode, Calendar, DollarSign, Layers, Package, User } from 'lucide-react';
import { StatusBadge } from '../../components/ui/DataTable';

export default function ProductDetailPage() {
  const { id } = useParams();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product-detail', id],
    queryFn: async () => {
      const res = await api.get(`/products/${id}`);
      return res.data.data;
    }
  });

  if (isLoading) return <PageLoader />;
  if (error) {
    return (
      <div className="alert alert-danger">
        <AlertTriangle /> Failed to retrieve product details.
      </div>
    );
  }

  const barcodeUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products/${product._id}/barcode`;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/products" className="btn btn-outline btn-sm mb-4">
          <ArrowLeft size={14} /> Back to Catalog
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="page-title">{product.name}</h1>
            <p className="font-mono text-sm text-secondary font-bold mt-1">SKU: {product.sku}</p>
          </div>
          <div>
            {product.quantity <= product.minimumStock ? (
              <span className="badge badge-danger text-sm px-3 py-1">Low Stock Alert</span>
            ) : (
              <span className="badge badge-success text-sm px-3 py-1">In Stock</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <div className="card lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-sm font-black uppercase text-secondary border-b-2 border-accent pb-1 mb-3">Description</h2>
            <p className="text-sm text-secondary font-medium leading-relaxed">
              {product.description || 'No description provided for this product.'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="label">Category</p>
              <p className="font-bold text-sm">{product.category?.name || 'Unassigned'}</p>
            </div>
            <div>
              <p className="label">Unit Measure</p>
              <p className="font-bold text-sm capitalize">{product.unit}</p>
            </div>
            <div>
              <p className="label">Supplier</p>
              <p className="font-bold text-sm">{product.supplier?.companyName || 'None'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 border-t-2 border-accent pt-6">
            <div>
              <p className="label">Cost Price</p>
              <p className="font-bold text-lg text-primary">₹{product.costPrice?.toFixed(2)}</p>
            </div>
            <div>
              <p className="label">Selling Price</p>
              <p className="font-bold text-lg text-primary">₹{product.sellingPrice?.toFixed(2)}</p>
            </div>
            <div>
              <p className="label">Profit Margin</p>
              <p className="font-bold text-lg text-success">{product.profitMargin}%</p>
            </div>
          </div>
        </div>

        {/* Barcode & Inventory Status */}
        <div className="card space-y-6">
          <div>
            <h2 className="text-sm font-black uppercase text-secondary border-b-2 border-accent pb-1 mb-4">Barcode</h2>
            <div className="border-3 border-primary p-4 bg-white flex flex-col items-center justify-center">
              <img src={barcodeUrl} alt="Product Barcode" className="max-h-24 max-w-full" onError={(e) => {
                e.target.style.display = 'none';
              }} />
              <p className="font-mono text-xs font-bold mt-2">{product.barcode || product.sku}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase text-secondary border-b-2 border-accent pb-1">Stock Status</h2>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-secondary">Current Stock:</span>
              <span className="font-black text-lg">{product.quantity} {product.unit}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-secondary">Safety Level:</span>
              <span className="font-bold text-sm">{product.minimumStock} {product.unit}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-secondary">Valuation (Cost):</span>
              <span className="font-black text-sm text-primary">₹{(product.quantity * product.costPrice).toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t-2 border-accent pt-4 text-xs font-bold text-secondary space-y-2">
            <div className="flex items-center gap-2">
              <User size={12} />
              <span>Created by: {product.createdBy?.name || 'System'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={12} />
              <span>Added: {new Date(product.createdAt).toLocaleDateString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
