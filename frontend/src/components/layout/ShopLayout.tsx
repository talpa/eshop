import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Package, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';

export default function ShopLayout() {
  const { user, logout } = useAuthStore();
  const count = useCartStore(s => s.count());
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-brand-600">Eshop</Link>
          <nav className="flex items-center gap-4">
            <Link to="/products" className="text-sm text-slate-600 hover:text-slate-900">Produkty</Link>
            <Link to="/cart" className="relative text-slate-600 hover:text-slate-900">
              <ShoppingCart size={20} />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </Link>
            {user ? (
              <div className="flex items-center gap-2">
                {user.role === 'ADMIN' && (
                  <Link to="/admin" className="text-slate-600 hover:text-slate-900" title="Admin">
                    <LayoutDashboard size={18} />
                  </Link>
                )}
                <Link to="/my-orders" className="text-slate-600 hover:text-slate-900" title="Moje objednávky">
                  <Package size={18} />
                </Link>
                <button onClick={handleLogout} className="text-slate-600 hover:text-slate-900" title="Odhlásit">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
                <User size={18} /> Přihlásit
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-sm text-slate-400">
        &copy; {new Date().getFullYear()} Eshop
      </footer>
    </div>
  );
}
