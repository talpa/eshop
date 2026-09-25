import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FileDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { Order, UserProfile } from '../../types';
import { formatPrice } from '../../lib/utils';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-amber-700 bg-amber-50',
  PAID: 'text-green-700 bg-green-50',
  PROCESSING: 'text-green-700 bg-green-50',
  SHIPPED: 'text-green-700 bg-green-50',
  DELIVERED: 'text-green-700 bg-green-50',
  CANCELLED: 'text-red-600 bg-red-50',
};

const PAID_STATUSES = new Set(['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED']);

export default function MyOrdersPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get<Order[]>('/orders').then(r => r.data),
  });
  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: () => api.get<UserProfile>('/profile').then(r => r.data),
  });
  const { t, i18n } = useTranslation();

  const locale = i18n.language.startsWith('uk') ? 'uk-UA' : i18n.language.startsWith('en') ? 'en-GB' : 'cs-CZ';

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-12 text-slate-400">{t('common.loading')}</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('myOrders.title')}</h1>
      {(!orders || orders.length === 0) && (
        <div className="text-center py-12 text-slate-400">
          <p className="mb-3">{t('myOrders.empty')}</p>
          <Link to="/products" className="text-brand-600 hover:underline text-sm">{t('myOrders.browse')}</Link>
        </div>
      )}
      {!profile?.bankAccountNumber && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex gap-3 items-start mb-4">
          <FileDown size={16} className="flex-shrink-0 mt-0.5" />
          <span>Pro stažení PDF potvrzení o daru doplňte <Link to="/profile" className="underline font-medium">číslo bankovního účtu v profilu</Link>.</span>
        </div>
      )}
      <div className="space-y-3">
        {orders?.map(order => (
          <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div>
                <Link to={`/orders/${order.id}`} className="font-medium text-sm hover:text-brand-600">#{order.variableSymbol}</Link>
                {order.militaryUnit && (
                  <span className="ml-2 text-xs text-slate-400">{order.militaryUnit.name}</span>
                )}
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || 'text-slate-600 bg-slate-100'}`}>
                {t(`order.status.${order.status}`, { defaultValue: order.status })}
              </span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>{order.items.map(i => i.productName).join(', ')}</span>
              <span className="font-semibold text-slate-800">{formatPrice(Number(order.donationAmount))}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString(locale)}</p>
              {PAID_STATUSES.has(order.status) && profile?.bankAccountNumber && (
                <a
                  href={`${import.meta.env.VITE_API_URL || ''}/api/orders/${order.id}/confirmation/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium"
                  onClick={e => e.stopPropagation()}
                >
                  <FileDown size={13} /> PDF potvrzení
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
