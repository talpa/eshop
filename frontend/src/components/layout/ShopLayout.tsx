import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, FileText, LayoutDashboard, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';

export default function ShopLayout() {
  const { user, logout } = useAuthStore();
  const count = useCartStore(s => s.count());
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-brand-900 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-base leading-none block">Česká stopa</span>
              <span className="text-brand-300 text-xs leading-none">Nadační fond</span>
            </div>
          </Link>
          <nav className="flex items-center gap-5">
            <Link to="/products" className="text-sm text-brand-200 hover:text-white transition-colors hidden sm:block">Dárky</Link>
            <Link
              to="/donate"
              className="text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Darovat
            </Link>
            <Link to="/cart" className="relative text-brand-200 hover:text-white transition-colors">
              <ShoppingCart size={20} />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </Link>
            {user ? (
              <div className="flex items-center gap-3">
                {user.role === 'ADMIN' && (
                  <Link to="/admin" className="text-brand-200 hover:text-white transition-colors" title="Administrace">
                    <LayoutDashboard size={18} />
                  </Link>
                )}
                <Link to="/my-orders" className="text-brand-200 hover:text-white transition-colors" title="Moje darovací smlouvy">
                  <FileText size={18} />
                </Link>
                <button onClick={handleLogout} className="text-brand-200 hover:text-white transition-colors" title="Odhlásit">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-1.5 text-sm text-brand-200 hover:text-white transition-colors">
                <User size={16} /> Přihlásit
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-brand-900 text-brand-300 py-10 mt-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} className="text-brand-400" />
                <span className="font-semibold text-white text-sm">Česká stopa</span>
              </div>
              <p className="text-xs text-brand-400 leading-relaxed">
                Nadační fond pro podporu vojenských jednotek působících na Ukrajině.
                Každý dar je doložen potvrzením a transparentně využit.
              </p>
            </div>
            <div>
              <p className="font-semibold text-white text-sm mb-3">Jak darovat</p>
              <ul className="text-xs text-brand-400 space-y-1.5">
                <li>1. Vyberte dárek jako poděkování</li>
                <li>2. Zvolte vojenskou jednotku</li>
                <li>3. Zašlete dar převodem (QR kód)</li>
                <li>4. Obdržíte potvrzení o daru (PDF)</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white text-sm mb-3">Informace</p>
              <ul className="text-xs text-brand-400 space-y-1.5">
                <li><Link to="/donate" className="hover:text-white transition-colors">Darovat přímo</Link></li>
                <li><Link to="/my-orders" className="hover:text-white transition-colors">Moje darovací smlouvy</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Přihlášení / Registrace</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-brand-800 pt-6 text-center text-xs text-brand-500">
            &copy; {new Date().getFullYear()} Česká stopa — Nadační fond na pomoc Ukrajině
          </div>
        </div>
      </footer>
    </div>
  );
}
