import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-9 w-full md:w-72"
      />
    </div>
  );
}

export function Pagination({ page, pages, onPageChange, total, limit }) {
  if (pages <= 1) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-accent">
      <p className="text-xs font-bold text-secondary">
        Showing <span className="text-primary">{from}–{to}</span> of <span className="text-primary">{total}</span> results
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="btn btn-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`btn btn-sm w-8 ${p === page ? 'bg-primary text-white' : 'bg-white'}`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === pages}
          className="btn btn-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    active: 'badge-success', pending: 'badge-warning', cancelled: 'badge-danger',
    completed: 'badge-success', received: 'badge-success', draft: 'badge-default',
    paid: 'badge-success', unpaid: 'badge-danger', partial: 'badge-warning',
    ordered: 'badge-info', refunded: 'badge-default', damage: 'badge-danger',
    stock_in: 'badge-success', stock_out: 'badge-danger', adjustment: 'badge-info',
    return: 'badge-warning',
  };
  return (
    <span className={map[status] || 'badge-default'}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export function StatCard({ label, value, icon: Icon, color = 'bg-primary', trend, suffix = '' }) {
  return (
    <div className="card hover:shadow-brutal-xl transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="label">{label}</p>
          <p className="text-3xl font-black mt-1">
            {suffix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value ?? '—'}
          </p>
          {trend && (
            <p className={`text-xs font-bold mt-2 ${trend > 0 ? 'text-success' : 'text-danger'}`}>
              {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
        <div className={`${color} w-12 h-12 border-3 border-primary flex items-center justify-center shadow-brutal-sm flex-shrink-0`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}
