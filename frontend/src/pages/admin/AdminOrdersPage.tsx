import { useState } from 'react';
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
  const [filterUnit, setFilterUnit] = useState('');
  const [filterFunds, setFilterFunds] = useState('');

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['admin-orders'],
    queryFn: () => api.get<Order[]>('/orders').then(r => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => { toast.success('Status aktualizován.'); qc.invalidateQueries({ queryKey: ['admin-orders'] }); },
    onError: () => toast.error('Chyba při aktualizaci.'),
  });

  const fundsMutation = useMutation({
    mutationFn: ({ id, fundsUsed }: { id: string; fundsUsed: boolean }) =>
      api.patch(`/orders/${id}/funds-used`, { fundsUsed }),
    onSuccess: () => { toast.success('Stav fondů aktualizován.'); qc.invalidateQueries({ queryKey: ['admin-orders'] }); },
    onError: () => toast.error('Chyba.'),
  });

  const resendMutation = useMutation({
    mutationFn: (id: string) => api.post(`/orders/${id}/resend-confirmation`),
    onSuccess: () => toast.success('Potvrzení odesláno.'),
    onError: () => toast.error('Nepodařilo se odeslat potvrzení.'),
  });

  const units = [...new Set(orders?.map(o => o.militaryUnit?.name).filter(Boolean))];

  const filtered = orders?.filter(o => {
    if (filterUnit && o.militaryUnit?.name !== filterUnit) return false;
    if (filterFunds === 'used' && !o.fundsUsed) return false;
    if (filterFunds === 'unused' && (o.fundsUsed || o.status !== 'PAID')) return false;
    return true;
  });

  const paidTotal = filtered?.filter(o => o.status === 'PAID')
    .reduce((sum, o) => sum + Number(o.donationAmount), 0) ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dary / Objednávky</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterUnit}
          onChange={e => setFilterUnit(e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-3 py-1.5"
        >
          <option value="">Všechny jednotky</option>
          {units.map(u => <option key={u} value={u!}>{u}</option>)}
        </select>
        <select
          value={filterFunds}
          onChange={e => setFilterFunds(e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-3 py-1.5"
        >
          <option value="">Vše</option>
          <option value="unused">Nevyužité prostředky</option>
          <option value="used">Využité prostředky</option>
        </select>
        {paidTotal > 0 && (
          <div className="ml-auto text-sm font-semibold text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg">
            Zaplaceno celkem: {formatPrice(paidTotal)}
          </div>
        )}
      </div>

      {isLoading && <div className="text-slate-400">Načítám...</div>}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['VS', 'Dárce', 'Jednotka', 'Dar', 'Prostředky', 'Status', 'Potvrzení', 'Datum', ''].map(h => (
                <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered?.map(order => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="px-3 py-3">
                  <Link to={`/orders/${order.id}`} className="font-mono text-xs text-brand-600 hover:underline">
                    {order.variableSymbol}
                  </Link>
                </td>
                <td className="px-3 py-3">
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-xs text-slate-400">{order.customerEmail}</p>
                </td>
                <td className="px-3 py-3 text-slate-600 text-xs">
                  {order.militaryUnit?.name || <span className="text-slate-300">—</span>}
                </td>
                <td className="px-3 py-3 font-semibold text-brand-600 whitespace-nowrap">
                  {formatPrice(Number(order.donationAmount))}
                </td>
                <td className="px-3 py-3">
                  {order.status === 'PAID' ? (
                    <button
                      onClick={() => fundsMutation.mutate({ id: order.id, fundsUsed: !order.fundsUsed })}
                      className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                        order.fundsUsed
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      {order.fundsUsed ? 'Využito' : 'Nevyužito'}
                    </button>
                  ) : <span className="text-slate-300 text-xs">—</span>}
                </td>
                <td className="px-3 py-3">
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
                <td className="px-3 py-3">
                  {order.status === 'PAID' ? (
                    <div className="flex flex-col gap-0.5">
                      {order.confirmationSentAt ? (
                        <span className="text-xs text-green-600">
                          ✓ {new Date(order.confirmationSentAt).toLocaleDateString('cs-CZ')}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Neodesláno</span>
                      )}
                      <button
                        onClick={() => resendMutation.mutate(order.id)}
                        className="text-xs text-brand-600 hover:underline text-left"
                      >
                        Odeslat znovu
                      </button>
                    </div>
                  ) : <span className="text-slate-300 text-xs">—</span>}
                </td>
                <td className="px-3 py-3 text-slate-400 text-xs whitespace-nowrap">
                  {new Date(order.createdAt).toLocaleDateString('cs-CZ')}
                </td>
                <td className="px-3 py-3">
                  <Link to={`/orders/${order.id}`} className="text-xs text-slate-400 hover:text-brand-600">
                    Detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
