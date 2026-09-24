import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, LogOut, ArrowLeft, Shield, ListOrdered, Tag, Users, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { to: '/admin/products', label: 'Produkty', icon: Package },
  { to: '/admin/orders', label: 'Darovací smlouvy', icon: ShoppingBag },
  { to: '/admin/military-units', label: 'Jednotky', icon: Shield },
  { to: '/admin/activities', label: 'Číselník aktivit', icon: ListOrdered },
  { to: '/admin/categories', label: 'Skupiny výrobků', icon: Tag },
  { to: '/admin/users', label: 'Uživatelé', icon: Users },
];

function NavContent({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={onClose}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              location.pathname === to
                ? 'bg-brand-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Icon size={16} /> {label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-700 space-y-1">
        <Link to="/" onClick={onClose} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800 hover:text-white">
          <ArrowLeft size={16} /> Zpět do eshopu
        </Link>
        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800 hover:text-white">
          <LogOut size={16} /> Odhlásit
        </button>
      </div>
    </>
  );
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-slate-900 text-white flex-col flex-shrink-0">
        <div className="px-4 h-16 flex items-center font-bold text-lg border-b border-slate-700">
          Admin
        </div>
        <NavContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 text-white flex flex-col z-50">
            <div className="px-4 h-14 flex items-center justify-between border-b border-slate-700">
              <span className="font-bold text-lg">Admin</span>
              <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <NavContent onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 h-14 bg-slate-900 text-white flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-slate-300 hover:text-white">
            <Menu size={22} />
          </button>
          <span className="font-bold">Admin</span>
        </div>

        <main className="flex-1 p-4 md:p-8 bg-slate-50 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
