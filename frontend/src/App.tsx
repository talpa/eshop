import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import ShopLayout from './components/layout/ShopLayout';
import AdminLayout from './components/layout/AdminLayout';
import WidgetLayout from './components/layout/WidgetLayout';

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ProductsPage = lazy(() => import('./pages/shop/ProductsPage'));
const ProductPage = lazy(() => import('./pages/shop/ProductPage'));
const CartPage = lazy(() => import('./pages/shop/CartPage'));
const CheckoutPage = lazy(() => import('./pages/shop/CheckoutPage'));
const OrderPage = lazy(() => import('./pages/shop/OrderPage'));
const MyOrdersPage = lazy(() => import('./pages/shop/MyOrdersPage'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminMilitaryUnitsPage = lazy(() => import('./pages/admin/AdminMilitaryUnitsPage'));
const AdminActivitiesPage = lazy(() => import('./pages/admin/AdminActivitiesPage'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'));
const DonatePage = lazy(() => import('./pages/shop/DonatePage'));
const UnitPage = lazy(() => import('./pages/shop/UnitPage'));
const WidgetGuidePage = lazy(() => import('./pages/shop/WidgetGuidePage'));
const WidgetPage = lazy(() => import('./pages/widget/WidgetPage'));
const UnitWidgetPage = lazy(() => import('./pages/widget/UnitWidgetPage'));
const ActivityWidgetPage = lazy(() => import('./pages/widget/ActivityWidgetPage'));
const AdminUnitUpdatesPage = lazy(() => import('./pages/admin/AdminUnitUpdatesPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const ProfilePage = lazy(() => import('./pages/user/ProfilePage'));

function Loader() {
  return <div className="p-8 text-sm text-slate-500 text-center">Načítám...</div>;
}

function wrap(el: React.ReactNode) {
  return <Suspense fallback={<Loader />}>{el}</Suspense>;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token);
  const location = useLocation();
  return token ? <>{children}</> : <Navigate to="/login" state={{ from: location.pathname }} replace />;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token);
  return token ? <Navigate to="/" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute>{wrap(<LoginPage />)}</PublicRoute>} />
        <Route path="/register" element={<PublicRoute>{wrap(<RegisterPage />)}</PublicRoute>} />

        <Route path="/" element={<ShopLayout />}>
          <Route index element={wrap(<ProductsPage />)} />
          <Route path="products" element={wrap(<ProductsPage />)} />
          <Route path="products/:slug" element={wrap(<ProductPage />)} />
          <Route path="cart" element={wrap(<CartPage />)} />
          <Route path="checkout" element={<RequireAuth>{wrap(<CheckoutPage />)}</RequireAuth>} />
          <Route path="orders/:id" element={wrap(<OrderPage />)} />
          <Route path="my-orders" element={<RequireAuth>{wrap(<MyOrdersPage />)}</RequireAuth>} />
          <Route path="donate" element={wrap(<DonatePage />)} />
          <Route path="jednotky/:slug" element={wrap(<UnitPage />)} />
          <Route path="profil" element={<RequireAuth>{wrap(<ProfilePage />)}</RequireAuth>} />
          <Route path="widget-guide" element={wrap(<WidgetGuidePage />)} />
        </Route>

        <Route path="/widget" element={<WidgetLayout />}>
          <Route index element={wrap(<WidgetPage />)} />
          <Route path="unit" element={wrap(<UnitWidgetPage />)} />
          <Route path="activity" element={wrap(<ActivityWidgetPage />)} />
        </Route>

        <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<Navigate to="/admin/products" replace />} />
          <Route path="products" element={wrap(<AdminProductsPage />)} />
          <Route path="orders" element={wrap(<AdminOrdersPage />)} />
          <Route path="military-units" element={wrap(<AdminMilitaryUnitsPage />)} />
          <Route path="activities" element={wrap(<AdminActivitiesPage />)} />
          <Route path="categories" element={wrap(<AdminCategoriesPage />)} />
          <Route path="unit-updates/:unitId" element={wrap(<AdminUnitUpdatesPage />)} />
          <Route path="users" element={wrap(<AdminUsersPage />)} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
