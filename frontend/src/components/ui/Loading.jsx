import { Loader2 } from 'lucide-react';

export function Spinner({ size = 20, className = '' }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} />;
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent animate-spin" />
      <p className="text-sm font-bold uppercase tracking-widest text-secondary">Loading...</p>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="table-wrapper">
      <table className="table">
        <thead><tr>{Array(cols).fill(0).map((_, i) => (
          <th key={i}><div className="skeleton h-3 w-20 rounded-none" /></th>
        ))}</tr></thead>
        <tbody>{Array(rows).fill(0).map((_, r) => (
          <tr key={r}>{Array(cols).fill(0).map((_, c) => (
            <td key={c}><div className="skeleton h-3 w-full rounded-none" /></td>
          ))}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card">
      <div className="skeleton h-3 w-24 mb-3 rounded-none" />
      <div className="skeleton h-8 w-32 mb-2 rounded-none" />
      <div className="skeleton h-2 w-16 rounded-none" />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-accent border-3 border-primary flex items-center justify-center mb-4 shadow-brutal">
        {Icon && <Icon size={28} className="text-secondary" />}
      </div>
      <h3 className="text-xl font-black uppercase mb-2">{title}</h3>
      <p className="text-secondary text-sm font-medium max-w-xs mb-6">{description}</p>
      {action}
    </div>
  );
}
