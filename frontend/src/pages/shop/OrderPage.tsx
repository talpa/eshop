import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, RefreshCw, Package } from 'lucide-react';
import { api } from '../../lib/api';
import { Order } from '../../types';
import { formatPrice } from '../../lib/utils';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Čeká na platbu',
  PAID: 'Zaplaceno',
  PROCESSING: 'Zpracovává se',
  SHIPPED: 'Odesláno',
  DELIVERED: 'Doručeno',
  CANCELLED: 'Zrušeno',
};

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [checking, setChecking] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get<Order>(`/orders/${id}`).then(r => r.data),
  });

  const checkMutation = useMutation({
    mutationFn: () => api.post<{ paid: boolean }>(`/payments/${id}/check`).then(r => r.data),
    onSuccess: (data) => {
      if (data.paid) {
        toast.success('Platba potvrzena!');
        qc.invalidateQueries({ queryKey: ['order', id] });
      } else {
        toast('Platba zatím nebyla nalezena. Zkuste to za chvíli.', { icon: '⏳' });
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Chyba při kontrole platby.'),
  });

  if (isLoading) return <div className="max-w-2xl mx-auto px-4 py-12 text-slate-400">Načítám...</div>;
  if (!order) return <div className="max-w-2xl mx-auto px-4 py-12 text-slate-400">Objednávka nenalezena.</div>;

  const isPaid = order.status === 'PAID' || order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Package size={24} className="text-brand-600" />
        <div>
          <h1 className="text-2xl font-bold">Objednávka #{order.variableSymbol}</h1>
          <span className={`text-sm font-medium ${isPaid ? 'text-green-600' : 'text-amber-600'}`}>
            {STATUS_LABELS[order.status] || order.status}
          </span>
        </div>
      </div>

      {!isPaid && order.payment?.qrPayload && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 text-center">
          <h2 className="font-semibold mb-1">Zaplaťte převodem</h2>
          <p className="text-sm text-slate-500 mb-4">
            Naskenujte QR kód nebo použijte variabilní symbol <strong>{order.variableSymbol}</strong>
          </p>
          <div className="flex justify-center mb-4">
            <QRCodeSVG value={order.payment.qrPayload} size={200} />
          </div>
          <p className="text-2xl font-bold text-brand-600 mb-4">{formatPrice(order.totalCzk)}</p>
          <button
            onClick={() => checkMutation.mutate()}
            disabled={checkMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={checkMutation.isPending ? 'animate-spin' : ''} />
            Zkontrolovat platbu
          </button>
        </div>
      )}

      {isPaid && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 flex items-center gap-3">
          <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Platba přijata</p>
            <p className="text-sm text-green-600">Vaše objednávka je zpracovávána.</p>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
        <h2 className="font-semibold mb-3 text-sm">Položky</h2>
        <div className="space-y-2">
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-slate-600">{item.productName} × {item.quantity}</span>
              <span className="font-medium">{formatPrice(Number(item.unitPriceCzk) * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="border-t mt-3 pt-3 flex justify-between font-bold">
          <span>Celkem</span>
          <span className="text-brand-600">{formatPrice(order.totalCzk)}</span>
        </div>
      </div>

      <div className="text-sm text-slate-500">
        <p><strong>Doručit na:</strong> {order.shippingAddress}</p>
        {order.note && <p className="mt-1"><strong>Poznámka:</strong> {order.note}</p>}
      </div>

      <Link to="/my-orders" className="inline-block mt-6 text-sm text-brand-600 hover:underline">
        Zobrazit všechny objednávky
      </Link>
    </div>
  );
}
