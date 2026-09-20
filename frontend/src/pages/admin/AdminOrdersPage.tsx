import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Order } from '../../types';
import { formatPrice } from '../../lib/utils';

type DonationStatus = 'PENDING' | 'PAID' | 'VYPLACENA' | 'CANCELLED';

const getDonationStatus = (order: Order): DonationStatus => {
  if (order.fundsUsed) return 'VYPLACENA';
  if (order.status === 'CANCELLED') return 'CANCELLED';
  if (order.status === 'PAID' || order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED') return 'PAID';
  return 'PENDING';
};

const STATUS_LABELS: Record<DonationStatus, string> = {
  PENDING: 'Nezaplacená',
  PAID: 'Zaplacená',
  VYPLACENA: 'Vyplacená',
  CANCELLED: 'Zrušená',
};

const STATUS_COLORS: Record<DonationStatus, string> = {
  PENDING: 'text-amber-700 bg-amber-50 border-amber-200',
  PAID: 'text-green-700 bg-green-50 border-green-200',
  VYPLACENA: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  CANCELLED: 'text-red-600 bg-red-50 border-red-200',
};

export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<DonationStatus | ''>('');
  const [filterUnit, setFilterUnit] = useState('');

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['admin-orders'],
    queryFn: () => api.get<Order[]>('/orders').then(r => r.data),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-orders'] });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/orders/${id}/status`, { status: 'CANCELLED' }),
    onSuccess: () => { toast.success('Smlouva zrušena.'); invalidate(); },
    onError: () => toast.error('Chyba.'),
  });

  const payoutMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/orders/${id}/funds-used`, { fundsUsed: true }),
    onSuccess: () => { toast.success('Označeno jako vyplacené.'); invalidate(); },
    onError: () => toast.error('Chyba.'),
  });

  const revertPayoutMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/orders/${id}/funds-used`, { fundsUsed: false }),
    onSuccess: () => { toast.success('Vráceno na Zaplacená.'); invalidate(); },
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
    if (filterStatus && getDonationStatus(o) !== filterStatus) return false;
    return true;
  });

  const paidTotal = filtered
    ?.filter(o => getDonationStatus(o) === 'PAID' || getDonationStatus(o) === 'VYPLACENA')
    .reduce((sum, o) => sum + Number(o.donationAmount), 0) ?? 0;

  const payoutTotal = filtered
    ?.filter(o => getDonationStatus(o) === 'VYPLACENA')
    .reduce((sum, o) => sum + Number(o.donationAmount), 0) ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Darovací smlouvy</h1>

      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as DonationStatus | '')}
          className="text-sm border border-slate-300 rounded-lg px-3 py-1.5"
        >
          <option value="">Všechny stavy</option>
          {(['PENDING', 'PAID', 'VYPLACENA', 'CANCELLED'] as DonationStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={filterUnit}
          onChange={e => setFilterUnit(e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-3 py-1.5"
        >
          <option value="">Všechny jednotky</option>
          {units.map(u => <option key={u} value={u!}>{u}</option>)}
        </select>

        {paidTotal > 0 && (
          <div className="ml-auto flex gap-3">
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
              Přijato: <strong>{formatPrice(paidTotal)}</strong>
            </div>
            {payoutTotal > 0 && (
              <div className="text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg">
                Vyplaceno: <strong>{formatPrice(payoutTotal)}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {isLoading && <div className="text-slate-400">Načítám...</div>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['VS', 'Dárce', 'Jednotka', 'Výše daru', 'Stav', 'Potvrzení', 'Datum', ''].map(h => (
                <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered?.map(order => {
              const donStatus = getDonationStatus(order);
              return (
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
                    <div className="flex flex-col gap-1.5">
                      <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[donStatus]}`}>
                        {STATUS_LABELS[donStatus]}
                      </span>
                      {donStatus === 'PENDING' && (
                        <button
                          onClick={() => { if (confirm('Zrušit smlouvu?')) cancelMutation.mutate(order.id); }}
                          className="text-xs text-red-500 hover:underline text-left"
                        >
                          Zrušit
                        </button>
                      )}
                      {donStatus === 'PAID' && (
                        <button
                          onClick={() => payoutMutation.mutate(order.id)}
                          className="text-xs text-indigo-600 hover:underline text-left"
                        >
                          Označit jako vyplacenou
                        </button>
                      )}
                      {donStatus === 'VYPLACENA' && (
                        <button
                          onClick={() => revertPayoutMutation.mutate(order.id)}
                          className="text-xs text-slate-400 hover:underline text-left"
                        >
                          Vrátit na zaplacená
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {donStatus !== 'PENDING' && donStatus !== 'CANCELLED' ? (
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
