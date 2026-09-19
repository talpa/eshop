import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Order, OrderStatus } from '../../types';
import { formatPrice } from '../../lib/utils';

const STATUSES: OrderStatus[] = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Čeká na platbu',
  PAID: 'Zaplaceno',
  PROCESSING: 'Zpracovává se',
  SHIPPED: 'Odesláno',
  DELIVERED: 'Doručeno',
  CANCELLED: 'Zrušeno',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'text-amber-600 bg-amber-50',
  PAID: 'text-green-600 bg-green-50',
  PROCESSING: 'text-blue-600 bg-blue-50',
  SHIPPED: 'text-indigo-600 bg-indigo-50',
  DELIVERED: 'text-green-700 bg-green-100',
  CANCELLED: 'text-red-600 bg-red-50',
};

export default function AdminOrdersPage() {
  const qc = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => api.get<Order[]>('/orders').then(r => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => { toast.success('Status aktualizován.'); qc.invalidateQueries({ queryKey: ['admin-orders'] }); },
    onError: () => toast.error('Chyba při aktualizaci.'),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Objednávky</h1>
      {isLoading && <div className="text-slate-400">Načítám...</div>}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['VS', 'Zákazník', 'Položky', 'Celkem', 'Status', 'Datum'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders?.map(order => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link to={`/orders/${order.id}`} className="font-mono text-xs text-brand-600 hover:underline">
                    {order.variableSymbol}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-xs text-slate-400">{order.customerEmail}</p>
                </td>
                <td className="px-4 py-3 text-slate-500">{order.items.length} ks</td>
                <td className="px-4 py-3 font-semibold text-brand-600">{formatPrice(order.totalCzk)}</td>
                <td className="px-4 py-3">
                  <select
                    value={order.status}
                    onChange={e => statusMutation.mutate({ id: order.id, status: e.target.value as OrderStatus })}
                    className={`text-xs font-medium px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-brand-500 cursor-pointer ${STATUS_COLORS[order.status]}`}
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {new Date(order.createdAt).toLocaleDateString('cs-CZ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
