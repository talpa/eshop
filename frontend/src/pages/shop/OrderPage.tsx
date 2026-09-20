import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, RefreshCw, FileText, Download, MapPin, Package } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Order } from '../../types';
import { formatPrice } from '../../lib/utils';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Nezaplacená',
  PAID: 'Zaplacená',
  PROCESSING: 'Zaplacená',
  SHIPPED: 'Zaplacená',
  DELIVERED: 'Zaplacená',
  CANCELLED: 'Zrušená',
};

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const user = useAuthStore(s => s.user);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get<Order>(`/orders/${id}`).then(r => r.data),
  });

  const downloadPdf = () => {
    const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
    window.open(`${base}/orders/${id}/confirmation/pdf`, '_blank');
  };

  const checkMutation = useMutation({
    mutationFn: () => api.post<{ paid: boolean }>(`/payments/${id}/check`).then(r => r.data),
    onSuccess: (data) => {
      if (data.paid) {
        toast.success('Platba potvrzena — potvrzení Vám bylo odesláno emailem.');
        qc.invalidateQueries({ queryKey: ['order', id] });
      } else {
        toast('Platba zatím nebyla nalezena. Zkuste to za chvíli.', { icon: '⏳' });
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Chyba při kontrole platby.'),
  });

  if (isLoading) return <div className="max-w-2xl mx-auto px-4 py-12 text-slate-400">Načítám...</div>;
  if (!order) return <div className="max-w-2xl mx-auto px-4 py-12 text-slate-400">Smlouva nenalezena.</div>;

  const isPaid = order.status !== 'PENDING' && order.status !== 'CANCELLED';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <FileText size={24} className="text-brand-600" />
        <div>
          <h1 className="text-2xl font-bold">Darovací smlouva #{order.variableSymbol}</h1>
          <span className={`text-sm font-medium ${isPaid ? 'text-green-600' : 'text-amber-600'}`}>
            {STATUS_LABELS[order.status] || order.status}
          </span>
        </div>
      </div>

      {order.militaryUnit && (
        <div className="mb-4 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
          Dar je určen pro: <strong>{order.militaryUnit.name}</strong>
        </div>
      )}

      {!isPaid && order.payment?.qrPayload && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 text-center">
          <h2 className="font-semibold mb-1">Zašlete dar převodem</h2>
          <p className="text-sm text-slate-500 mb-4">
            Naskenujte QR kód nebo použijte variabilní symbol <strong>{order.variableSymbol}</strong>
          </p>
          <div className="flex justify-center mb-4">
            <QRCodeSVG value={order.payment.qrPayload} size={200} />
          </div>
          <p className="text-2xl font-bold text-brand-600 mb-4">{formatPrice(Number(order.donationAmount))}</p>
          <p className="text-xs text-slate-400 mb-4">Minimální dar: {formatPrice(Number(order.totalCzk))} — můžete darovat i více</p>
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
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 flex items-start gap-3">
          <CheckCircle size={24} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-green-800">Dar přijat — děkujeme!</p>
            <p className="text-sm text-green-600 mb-3">
              {order.confirmationSentAt
                ? `Potvrzení o daru bylo odesláno na ${order.customerEmail}.`
                : 'Potvrzení o daru Vám bude odesláno na email.'}
            </p>
            <button
              onClick={downloadPdf}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-green-300 hover:border-green-500 text-green-800 rounded-lg text-sm font-medium transition-colors"
            >
              <Download size={14} />
              Stáhnout potvrzení (PDF)
            </button>
            {!user && (
              <p className="text-xs text-green-600 mt-2">
                <Link to="/login" className="underline">Přihlaste se</Link> pro opakované stažení kdykoliv.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
        <h2 className="font-semibold mb-3 text-sm">Jako poděkování obdržíte</h2>
        <div className="space-y-2">
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-slate-600">{item.productName} × {item.quantity}</span>
              <span className="font-medium text-slate-400 text-xs">min. {formatPrice(Number(item.unitPriceCzk) * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="border-t mt-3 pt-3 flex justify-between font-bold">
          <span>Výše daru</span>
          <span className="text-brand-600">{formatPrice(Number(order.donationAmount))}</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-600">
        <h2 className="font-semibold mb-2 text-sm text-slate-800">Doručení</h2>
        {order.deliveryType === 'PACKETA' ? (
          <div className="flex items-start gap-2">
            <Package size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">{order.packetaPointName || 'Zásilkovna'}</p>
              {order.packetaPointId && <p className="text-xs text-slate-400">ID: {order.packetaPointId}</p>}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              {order.street && <p>{order.street}</p>}
              {(order.city || order.zip) && (
                <p>{[order.zip, order.city].filter(Boolean).join(' ')}</p>
              )}
              {order.country && order.country !== 'CZ' && <p className="text-xs text-slate-400">{order.country}</p>}
              {!order.street && order.shippingAddress && <p>{order.shippingAddress}</p>}
            </div>
          </div>
        )}
        {order.note && <p className="mt-2 pt-2 border-t border-slate-100"><strong>Poznámka:</strong> {order.note}</p>}
      </div>

      <Link to="/my-orders" className="inline-block mt-6 text-sm text-brand-600 hover:underline">
        Zobrazit všechny darovací smlouvy
      </Link>
    </div>
  );
}
