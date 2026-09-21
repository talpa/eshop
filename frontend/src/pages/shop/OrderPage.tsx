import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, RefreshCw, FileText, Download, MapPin, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Order } from '../../types';
import { formatPrice } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);
  const { t } = useTranslation();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get<Order>(`/orders/${id}`).then(r => r.data),
  });

  const { data: shopConfig } = useQuery<{ accountNumber: string; iban: string }>({
    queryKey: ['shop-config'],
    queryFn: () => api.get('/config').then(r => r.data),
    staleTime: Infinity,
  });

  const downloadPdf = () => {
    const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
    window.open(`${base}/orders/${id}/confirmation/pdf`, '_blank');
  };

  const checkMutation = useMutation({
    mutationFn: () => api.post<{ paid: boolean }>(`/payments/${id}/check`).then(r => r.data),
    onSuccess: (data) => {
      if (data.paid) {
        toast.success(t('order.paymentConfirmed'));
        qc.invalidateQueries({ queryKey: ['order', id] });
      } else {
        toast(t('order.paymentNotFound'), { icon: '⏳' });
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.message || t('order.paymentError')),
  });

  if (isLoading) return <div className="max-w-2xl mx-auto px-4 py-12 text-slate-400">{t('common.loading')}</div>;
  if (!order) return <div className="max-w-2xl mx-auto px-4 py-12 text-slate-400">{t('common.notFound')}</div>;

  const isPaid = order.status !== 'PENDING' && order.status !== 'CANCELLED';

  type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <FileText size={24} className="text-brand-600" />
        <div>
          <h1 className="text-2xl font-bold">{t('order.title', { vs: order.variableSymbol })}</h1>
          <span className={`text-sm font-medium ${isPaid ? 'text-green-600' : 'text-amber-600'}`}>
            {t(`order.status.${order.status as OrderStatus}`, { defaultValue: order.status })}
          </span>
        </div>
      </div>

      {order.militaryUnit && (
        <div className="mb-4 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
          {t('order.dedicatedTo', { name: order.militaryUnit.name })}
        </div>
      )}

      {!isPaid && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-center mb-1">{t('order.transfer.title')}</h2>
          {order.militaryUnit && (
            <p className="text-center text-sm text-brand-600 font-medium mb-4">{t('order.transfer.forUnit', { name: order.militaryUnit.name })}</p>
          )}

          {order.payment?.qrPayload ? (
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-3">{t('order.transfer.qrScan')}</p>
              <div className="flex justify-center mb-4">
                <QRCodeSVG value={order.payment.qrPayload} size={200} />
              </div>
            </div>
          ) : null}

          <div className="bg-slate-50 rounded-lg px-4 py-3 mb-4 space-y-1.5 text-sm">
            {shopConfig?.accountNumber && (
              <div className="flex justify-between">
                <span className="text-slate-500">{t('order.transfer.accountNumber')}</span>
                <span className="font-mono font-medium">{shopConfig.accountNumber}</span>
              </div>
            )}
            {shopConfig?.iban && (
              <div className="flex justify-between">
                <span className="text-slate-500">{t('order.transfer.iban')}</span>
                <span className="font-mono font-medium text-xs">{shopConfig.iban}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1.5">
              <span className="text-slate-500">{t('order.transfer.variableSymbol')}</span>
              <span className="font-mono font-bold text-slate-800 text-base">{order.variableSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('order.transfer.amount')}</span>
              <span className="font-bold text-brand-600 text-base">{formatPrice(Number(order.donationAmount))}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center mb-4">{t('order.transfer.minDonation', { min: formatPrice(Number(order.totalCzk)) })}</p>
          <div className="flex justify-center">
            <button
              onClick={() => checkMutation.mutate()}
              disabled={checkMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={checkMutation.isPending ? 'animate-spin' : ''} />
              {t('order.transfer.checkPayment')}
            </button>
          </div>
        </div>
      )}

      {isPaid && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 flex items-start gap-3">
          <CheckCircle size={24} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-green-800">{t('order.paid.title')}</p>
            <p className="text-sm text-green-600 mb-3">
              {order.confirmationSentAt
                ? t('order.paid.confirmation', { email: order.customerEmail })
                : t('order.paid.confirmationPending')}
            </p>
            <button
              onClick={downloadPdf}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-green-300 hover:border-green-500 text-green-800 rounded-lg text-sm font-medium transition-colors"
            >
              <Download size={14} />
              {t('order.paid.download')}
            </button>
            {!user && (
              <p className="text-xs text-green-600 mt-2">
                <Link to="/login" className="underline">{t('nav.login')}</Link> {t('order.paid.loginForDownload')}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
        <h2 className="font-semibold mb-3 text-sm">{t('order.gifts.title')}</h2>
        <div className="space-y-2">
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-slate-600">{item.productName} × {item.quantity}</span>
              <span className="font-medium text-slate-400 text-xs">min. {formatPrice(Number(item.unitPriceCzk) * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="border-t mt-3 pt-3 flex justify-between font-bold">
          <span>{t('order.gifts.amountLabel')}</span>
          <span className="text-brand-600">{formatPrice(Number(order.donationAmount))}</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-600">
        <h2 className="font-semibold mb-2 text-sm text-slate-800">{t('order.delivery.title')}</h2>
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
              {(order.city || order.zip) && <p>{[order.zip, order.city].filter(Boolean).join(' ')}</p>}
              {order.country && order.country !== 'CZ' && <p className="text-xs text-slate-400">{order.country}</p>}
              {!order.street && order.shippingAddress && <p>{order.shippingAddress}</p>}
            </div>
          </div>
        )}
        {order.note && <p className="mt-2 pt-2 border-t border-slate-100"><strong>{t('order.delivery.note')}:</strong> {order.note}</p>}
      </div>

      <Link to="/my-orders" className="inline-block mt-6 text-sm text-brand-600 hover:underline">
        {t('order.backToAll')}
      </Link>
    </div>
  );
}
