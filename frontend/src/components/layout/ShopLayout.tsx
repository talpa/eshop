import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, FileText, LayoutDashboard, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import LanguageSwitcher from '../LanguageSwitcher';

export default function ShopLayout() {
  const { user, logout } = useAuthStore();
  const count = useCartStore(s => s.count());
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-brand-900 text-white sticky top-0 z-10 shadow-lg border-b-[3px] border-ua-yellow">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-base leading-none block">{t('common.fundName')}</span>
              <span className="text-brand-300 text-xs leading-none">{t('common.fundSubtitle')}</span>
            </div>
          </Link>
          <nav className="flex items-center gap-5">
            <Link to="/products" className="text-sm text-brand-200 hover:text-white transition-colors hidden sm:block">{t('nav.products')}</Link>
            <a href="/#jednotky" className="text-sm text-brand-200 hover:text-white transition-colors hidden sm:block">{t('nav.units')}</a>
            <Link
              to="/donate"
              className="text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              {t('nav.donate')}
            </Link>
            <Link to="/cart" className="relative text-brand-200 hover:text-white transition-colors">
              <ShoppingCart size={20} />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </Link>
            <LanguageSwitcher />
            {user ? (
              <div className="flex items-center gap-3">
                {user.role === 'ADMIN' && (
                  <Link to="/admin" className="text-brand-200 hover:text-white transition-colors" title={t('nav.admin')}>
                    <LayoutDashboard size={18} />
                  </Link>
                )}
                <Link to="/profil" className="text-brand-200 hover:text-white transition-colors" title={t('nav.profile')}>
                  <User size={18} />
                </Link>
                <Link to="/my-orders" className="text-brand-200 hover:text-white transition-colors" title={t('nav.myOrders')}>
                  <FileText size={18} />
                </Link>
                <button onClick={handleLogout} className="text-brand-200 hover:text-white transition-colors" title={t('nav.logout')}>
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-1.5 text-sm text-brand-200 hover:text-white transition-colors">
                <User size={16} /> {t('nav.login')}
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
                <span className="font-semibold text-white text-sm">{t('common.fundName')}</span>
              </div>
              <p className="text-xs text-brand-400 leading-relaxed">{t('footer.fundDesc')}</p>
            </div>
            <div>
              <p className="font-semibold text-white text-sm mb-3">{t('footer.howToDonate')}</p>
              <ul className="text-xs text-brand-400 space-y-1.5">
                <li>1. {t('footer.step1')}</li>
                <li>2. {t('footer.step2')}</li>
                <li>3. {t('footer.step3')}</li>
                <li>4. {t('footer.step4')}</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white text-sm mb-3">{t('footer.information')}</p>
              <ul className="text-xs text-brand-400 space-y-1.5">
                <li><Link to="/donate" className="hover:text-white transition-colors">{t('footer.links.donate')}</Link></li>
                <li><Link to="/my-orders" className="hover:text-white transition-colors">{t('footer.links.myOrders')}</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">{t('footer.links.login')}</Link></li>
                <li><Link to="/widget-guide" className="hover:text-white transition-colors">{t('footer.links.widgetGuide')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-brand-800 pt-6 text-center text-xs text-brand-500">
            &copy; {new Date().getFullYear()} {t('footer.copyright')}
          </div>
        </div>
      </footer>
    </div>
  );
}
