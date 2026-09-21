import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MapPin, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { localName } from '../../lib/localise';
import { api } from '../../lib/api';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { Order, MilitaryUnit, Activity } from '../../types';
import { formatPrice } from '../../lib/utils';

const schema = z.object({
  customerName: z.string().min(2, 'Zadejte jméno'),
  customerEmail: z.string().email('Neplatný email'),
  deliveryType: z.enum(['HOME', 'PACKETA']),
  street: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().default('CZ'),
  packetaPointId: z.string().optional(),
  packetaPointName: z.string().optional(),
  note: z.string().optional(),
  militaryUnitId: z.string().optional(),
  activityId: z.string().optional(),
  isAnonymous: z.boolean().optional(),
  donationAmount: z.number({ invalid_type_error: 'Zadejte částku' }).positive('Částka musí být kladná'),
  subscribeNewsletter: z.boolean().optional(),
}).refine(d => {
  if (d.deliveryType === 'HOME') return !!(d.street && d.city && d.zip);
  return !!d.packetaPointId;
}, {
  message: 'Vyplňte doručovací adresu nebo vyberte výdejní místo',
  path: ['street'],
});

type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, clear } = useCartStore();
  const user = useAuthStore(s => s.user);
  const minAmount = total();
  const [donationInput, setDonationInput] = useState(minAmount.toFixed(0));
  const [packetaPoint, setPacketaPoint] = useState<{ id: string; name: string; address: string } | null>(null);
  const [packetaScriptLoaded, setPacketaScriptLoaded] = useState(false);
  const { t, i18n } = useTranslation();

  const { data: units } = useQuery<MilitaryUnit[]>({
    queryKey: ['military-units'],
    queryFn: () => api.get<MilitaryUnit[]>('/military-units').then(r => r.data),
  });

  const { data: activities } = useQuery<Activity[]>({
    queryKey: ['activities'],
    queryFn: () => api.get<Activity[]>('/activities').then(r => r.data),
  });

  const { data: shopConfig } = useQuery<{ packetaApiKey: string }>({
    queryKey: ['shop-config'],
    queryFn: () => api.get('/config').then(r => r.data),
    staleTime: Infinity,
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: user?.name || '',
      customerEmail: user?.email || '',
      deliveryType: 'HOME',
      country: 'CZ',
      donationAmount: minAmount,
      subscribeNewsletter: false,
      isAnonymous: false,
    },
  });

  const deliveryType = watch('deliveryType');
  const isAnonymous = watch('isAnonymous');
  const militaryUnitId = watch('militaryUnitId');
  const selectedUnit = units?.find(u => u.id === militaryUnitId);

  useEffect(() => {
    setValue('donationAmount', minAmount);
    setDonationInput(minAmount.toFixed(0));
  }, [minAmount, setValue]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://widget.packeta.com/v6/www/js/library.js';
    script.onload = () => setPacketaScriptLoaded(true);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const openPacketaWidget = () => {
    const apiKey = shopConfig?.packetaApiKey;
    if (!apiKey) { toast.error('Zásilkovna API klíč není nastaven.'); return; }
    if (!packetaScriptLoaded || !window.Packeta) { toast.error('Widget se načítá, zkuste za chvíli.'); return; }
    window.Packeta.Widget.pick(apiKey, (point) => {
      if (!point) return;
      setPacketaPoint({ id: point.id, name: point.name, address: `${point.nameStreet}, ${point.zip} ${point.city}` });
      setValue('packetaPointId', point.id);
      setValue('packetaPointName', point.name);
    });
  };

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post<Order>('/orders', {
        ...data,
        items: items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
      }).then(r => r.data),
    onSuccess: (order) => { clear(); navigate(`/orders/${order.id}`); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Nepodařilo se vytvořit darovací smlouvu.'),
  });

  if (items.length === 0) { navigate('/cart'); return null; }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">{t('checkout.title')}</h1>
      <p className="text-slate-500 text-sm mb-6">{t('checkout.subtitle')}</p>

      {!user && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          {t('checkout.loginNotice')}
          {' '}<Link to="/login" className="underline font-medium">{t('checkout.login')}</Link>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">

          <div>
            <label className="block text-sm font-medium mb-1">{t('checkout.name')}</label>
            <input {...register('customerName')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('checkout.email')}</label>
            <input {...register('customerEmail')} type="email" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            {errors.customerEmail && <p className="text-red-500 text-xs mt-1">{errors.customerEmail.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('checkout.delivery.label')}</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'HOME', label: t('checkout.delivery.home'), icon: MapPin },
                { value: 'PACKETA', label: t('checkout.delivery.packeta'), icon: Package },
              ] as const).map(({ value, label, icon: Icon }) => (
                <label key={value} className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${deliveryType === value ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" {...register('deliveryType')} value={value} className="sr-only" />
                  <Icon size={16} className={deliveryType === value ? 'text-brand-600' : 'text-slate-400'} />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {deliveryType === 'HOME' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t('checkout.delivery.street')}</label>
                <input {...register('street')} placeholder={t('checkout.delivery.streetPlaceholder')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('checkout.delivery.city')}</label>
                  <input {...register('city')} placeholder={t('checkout.delivery.cityPlaceholder')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('checkout.delivery.zip')}</label>
                  <input {...register('zip')} placeholder={t('checkout.delivery.zipPlaceholder')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
            </div>
          )}

          {deliveryType === 'PACKETA' && (
            <div>
              {packetaPoint ? (
                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <Package size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-green-800">{packetaPoint.name}</p>
                    <p className="text-green-600 text-xs">{packetaPoint.address}</p>
                  </div>
                  <button type="button" onClick={openPacketaWidget} className="text-xs text-brand-600 hover:underline">{t('checkout.delivery.packetaChange')}</button>
                </div>
              ) : (
                <button type="button" onClick={openPacketaWidget} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-brand-400 rounded-lg py-4 text-sm text-slate-500 hover:text-brand-600 transition-colors">
                  <Package size={16} />
                  {t('checkout.delivery.packetaSelect')}
                </button>
              )}
              {errors.packetaPointId && <p className="text-red-500 text-xs mt-1">{t('checkout.delivery.packetaRequired')}</p>}
            </div>
          )}

          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" {...register('isAnonymous')}
                onChange={e => {
                  setValue('isAnonymous', e.target.checked);
                  if (e.target.checked) { setValue('militaryUnitId', ''); }
                  else { setValue('activityId', ''); }
                }}
                className="mt-0.5 w-4 h-4 accent-brand-600" />
              <span className="text-sm">
                <span className="font-medium">{t('checkout.anonymous.label')}</span>
                <span className="block text-xs text-slate-500 mt-0.5">{t('checkout.anonymous.desc')}</span>
              </span>
            </label>

            {isAnonymous ? (
              <div>
                <label className="block text-sm font-medium mb-1">{t('checkout.activity.label')}</label>
                <select {...register('activityId')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">{t('checkout.activity.select')}</option>
                  {activities?.map(a => (
                    <option key={a.id} value={a.id}>{a.code} – {localName(a, i18n.language)}</option>
                  ))}
                </select>
              </div>
            ) : (
              units && units.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1">{t('checkout.unit.label')}</label>
                  <select {...register('militaryUnitId')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">{t('checkout.unit.select')}</option>
                    {units.map(u => <option key={u.id} value={u.id}>{localName(u, i18n.language)}</option>)}
                  </select>
                  {selectedUnit?.activity && (
                    <p className="text-xs text-slate-500 mt-1.5">
                      {t('checkout.unit.paymentCode', { code: selectedUnit.activity.code, name: localName(selectedUnit.activity, i18n.language) })}
                    </p>
                  )}
                </div>
              )
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('checkout.amount.label')}
              <span className="ml-2 text-xs text-slate-400 font-normal">{t('checkout.amount.minimum', { min: formatPrice(minAmount) })}</span>
            </label>
            <div className="relative">
              <input
                type="number" min={minAmount} step="1"
                value={donationInput}
                onChange={e => { setDonationInput(e.target.value); const n = parseFloat(e.target.value); if (!isNaN(n)) setValue('donationAmount', n); }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Kč</span>
            </div>
            {errors.donationAmount && <p className="text-red-500 text-xs mt-1">{errors.donationAmount.message}</p>}
            <div className="flex gap-2 mt-2">
              {[minAmount, minAmount * 2, minAmount * 3].map(amount => (
                <button key={amount} type="button"
                  onClick={() => { setValue('donationAmount', amount); setDonationInput(amount.toFixed(0)); }}
                  className="text-xs px-2 py-1 rounded border border-slate-300 hover:border-brand-500 hover:text-brand-600 transition-colors">
                  {formatPrice(amount)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('checkout.note')}</label>
            <textarea {...register('note')} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register('subscribeNewsletter')} className="mt-0.5" />
            <span className="text-slate-600">{t('checkout.newsletter')}</span>
          </label>

          <button type="submit" disabled={mutation.isPending} className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-3 font-medium transition-colors disabled:opacity-50">
            {mutation.isPending ? t('checkout.submitting') : t('checkout.submit')}
          </button>
        </form>

        <div className="bg-slate-50 rounded-xl p-4 h-fit space-y-4">
          <div>
            <h2 className="font-semibold mb-3 text-sm">{t('checkout.gifts.title')}</h2>
            <div className="space-y-2 text-sm">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between">
                  <span className="text-slate-600 truncate mr-2">{product.name} × {quantity}</span>
                  <span className="text-slate-400 flex-shrink-0 text-xs">min. {formatPrice(Number(product.priceCzk) * quantity)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t pt-3 text-xs text-slate-500">
            <p>{t('checkout.gifts.confirmationNotice')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
