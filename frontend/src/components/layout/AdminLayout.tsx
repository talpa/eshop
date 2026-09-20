import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, LogOut, ArrowLeft, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { to: '/admin/products', label: 'Produkty', icon: Package },
  { to: '/admin/orders', label: 'Dary', icon: ShoppingBag },
  { to: '/admin/military-units', label: 'Jednotky', icon: Shield },
];

export default function AdminLayout() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-slate-900 text-white flex flex-col">
        <div className="px-4 h-16 flex items-center font-bold text-lg border-b border-slate-700">
          Admin
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
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
          <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800 hover:text-white">
            <ArrowLeft size={16} /> Zpět do eshopu
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800 hover:text-white">
            <LogOut size={16} /> Odhlásit
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 bg-slate-50 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
