import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, User, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore, useUIStore } from '../../store';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function Topbar() {
  const { toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {}
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return (
    <header className="bg-white border-b-3 border-primary px-4 md:px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="btn-icon"
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>
        <div className="hidden md:block">
          <p className="text-xs font-bold uppercase tracking-widest text-secondary">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications placeholder */}
        <button className="btn-icon relative" aria-label="Notifications">
          <Bell size={17} />
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-danger text-white text-[8px] font-black flex items-center justify-center border border-white">
            3
          </span>
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="btn btn-sm flex items-center gap-2"
            aria-expanded={dropdownOpen}
          >
            <div className="w-6 h-6 bg-primary text-white flex items-center justify-center font-black text-xs">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <span className="hidden sm:block text-sm font-bold max-w-[120px] truncate">{user?.name}</span>
            <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white border-3 border-primary shadow-brutal-lg z-50 animate-fade-in">
              <div className="px-4 py-3 border-b-2 border-accent">
                <p className="text-sm font-black">{user?.name}</p>
                <p className="text-xs text-secondary font-medium capitalize">{user?.role} · {user?.email}</p>
              </div>
              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-bold hover:bg-accent/50 transition-colors"
              >
                <User size={15} /> My Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-danger hover:bg-red-50 transition-colors border-t-2 border-accent"
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Close dropdown on outside click */}
      {dropdownOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
      )}
    </header>
  );
}
