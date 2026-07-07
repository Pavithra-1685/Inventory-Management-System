import { NavLink, useLocation } from 'react-router-dom';
import { useUIStore, useAuthStore } from '../../store';
import {
  LayoutDashboard, Package, Tags, Truck, Users, ShoppingCart,
  TrendingUp, Warehouse, BarChart3, UserCog, Activity, X, ChevronRight
} from 'lucide-react';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    label: 'Catalog',
    items: [
      { to: '/products', icon: Package, label: 'Products' },
      { to: '/categories', icon: Tags, label: 'Categories' },
    ]
  },
  {
    label: 'Operations',
    items: [
      { to: '/inventory', icon: Warehouse, label: 'Inventory' },
      { to: '/purchases', icon: ShoppingCart, label: 'Purchases' },
      { to: '/sales', icon: TrendingUp, label: 'Sales' },
    ]
  },
  {
    label: 'Partners',
    items: [
      { to: '/suppliers', icon: Truck, label: 'Suppliers' },
      { to: '/customers', icon: Users, label: 'Customers' },
    ]
  },
  {
    label: 'Analytics',
    items: [
      { to: '/reports', icon: BarChart3, label: 'Reports' },
    ]
  },
  {
    label: 'Admin',
    roles: ['admin', 'manager'],
    items: [
      { to: '/users', icon: UserCog, label: 'Users', roles: ['admin'] },
      { to: '/activity', icon: Activity, label: 'Activity Log', roles: ['admin', 'manager'] },
    ]
  },
];

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { user } = useAuthStore();
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-primary/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-40 flex flex-col
        bg-white border-r-3 border-primary
        transition-transform duration-200 ease-in-out
        w-64
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b-3 border-primary bg-primary">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white border-2 border-white flex items-center justify-center flex-shrink-0">
              <span className="font-black text-primary text-sm">IP</span>
            </div>
            <span className="text-white font-black text-base uppercase tracking-tight">InventoryPro</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white hover:text-accent">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(
              item => !item.roles || item.roles.includes(user?.role)
            );
            if (visibleItems.length === 0) return null;
            if (group.roles && !group.roles.includes(user?.role)) return null;

            return (
              <div key={group.label} className="mb-4">
                <p className="px-3 mb-1 text-[10px] font-black uppercase tracking-[0.15em] text-secondary/50">
                  {group.label}
                </p>
                {visibleItems.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 mb-0.5 text-sm font-bold transition-all duration-100 border-2 group
                      ${isActive
                        ? 'bg-primary text-white border-primary shadow-brutal-sm'
                        : 'text-secondary border-transparent hover:bg-accent/50 hover:border-accent'
                      }`
                    }
                  >
                    <Icon size={16} className="flex-shrink-0" />
                    <span className="flex-1">{label}</span>
                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* User info */}
        <div className="border-t-3 border-primary p-4 bg-accent/20">
          <NavLink to="/profile" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-primary border-2 border-primary flex items-center justify-center text-white font-black text-sm flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.name}</p>
              <p className="text-xs text-secondary capitalize font-medium">{user?.role}</p>
            </div>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
