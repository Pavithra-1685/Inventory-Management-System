import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-bg flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 border-r-4 border-primary">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white border-3 border-white flex items-center justify-center">
              <span className="font-black text-primary text-lg">I</span>
            </div>
            <span className="text-white font-black text-2xl tracking-tight uppercase">InventoryPro</span>
          </div>
          <h1 className="text-5xl font-black text-white leading-tight uppercase mb-6">
            Control Your<br />
            <span className="text-accent">Inventory</span><br />
            Like a Pro.
          </h1>
          <p className="text-accent/80 text-lg font-medium max-w-md">
            A powerful, brutalist inventory management platform built for modern businesses.
          </p>
        </div>

        {/* Feature bullets */}
        <div className="space-y-4">
          {['Real-time stock tracking', 'Multi-role access control', 'PDF invoice generation', 'Advanced analytics'].map(f => (
            <div key={f} className="flex items-center gap-3 text-white">
              <div className="w-5 h-5 bg-white border-2 border-white flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-black text-xs">✓</span>
              </div>
              <span className="font-bold text-sm">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-primary border-3 border-primary flex items-center justify-center">
              <span className="font-black text-white text-base">I</span>
            </div>
            <span className="text-primary font-black text-xl uppercase">InventoryPro</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
