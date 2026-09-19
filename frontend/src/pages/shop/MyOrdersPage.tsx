import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Order } from '../../types';
import { formatPrice } from '../../lib/utils';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Čeká na platbu',
  PAID: 'Zaplaceno',
  PROCESSING: 'Zpracovává se',
  SHIPPED: 'Odesláno',
  DELIVERED: 'Doručeno',
  CANCELLED: 'Zrušeno',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-amber-600 bg-amber-50',
  PAID: 'text-green-600 bg-green-50',
  PROCESSING: 'text-blue-600 bg-blue-50',
  SHIPPED: 'text-indigo-600 bg-indigo-50',
  DELIVERED: 'text-green-700 bg-green-100',
  CANCELLED: 'text-red-600 bg-red-50',
};

export default function MyOrdersPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get<Order[]>('/orders').then(r => r.data),
  });

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-12 text-slate-400">Načítám...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Moje objednávky</h1>
      {(!orders || orders.length === 0) && (
        <div className="text-center py-12 text-slate-400">
          <p className="mb-3">Zatím nemáte žádné objednávky.</p>
          <Link to="/products" className="text-brand-600 hover:underline text-sm">Začít nakupovat</Link>
        </div>
      )}
      <div className="space-y-3">
        {orders?.map(order => (
          <Link key={order.id} to={`/orders/${order.id}`} className="block bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">#{order.variableSymbol}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || 'text-slate-600 bg-slate-100'}`}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>{order.items.length} položek</span>
              <span className="font-semibold text-slate-800">{formatPrice(order.totalCzk)}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{new Date(order.createdAt).toLocaleDateString('cs-CZ')}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
