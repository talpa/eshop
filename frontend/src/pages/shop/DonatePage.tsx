import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Heart, AlertCircle } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { localName } from '../../lib/localise';
import { buildQr, PaymentBlock } from '../widget/widgetShared';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Activity, MilitaryUnit, Order } from '../../types';
import { formatPrice } from '../../lib/utils';

const PRESETS = [200, 500, 1000, 2000];

const unitSchema = z.object({
  customerName: z.string().min(2, 'Zadejte jméno'),
  customerEmail: z.string().email('Neplatný email'),
  donationAmount: z.number({ invalid_type_error: 'Zadejte částku' }).positive('Zadejte kladnou částku'),
  militaryUnitId: z.string().optional(),
  subscribeNewsletter: z.boolean().optional(),
});
type UnitFormData = z.infer<typeof unitSchema>;

export default function DonatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore(s => s.user);
  const { t, i18n } = useTranslation();

  const unitSlugParam = searchParams.get('unit') || '';
  const activityCodeParam = searchParams.get('activity') || '';
  const amountParam = parseFloat(searchParams.get('amount') || '0') || 500;

  const [target, setTarget] = useState<'unit' | 'activity'>(activityCodeParam ? 'activity' : 'unit');
  const [activityId, setActivityId] = useState('');
  const [activityAmount, setActivityAmount] = useState(amountParam);
  const [activityInput, setActivityInput] = useState(amountParam.toFixed(0));
  const [unitDonationInput, setUnitDonationInput] = useState(amountParam.toFixed(0));

  const { data: units } = useQuery<MilitaryUnit[]>({
    queryKey: ['military-units'],
    queryFn: () => api.get<MilitaryUnit[]>('/military-units').then(r => r.data),
  });

  const { data: activities } = useQuery<Activity[]>({
    queryKey: ['activities'],
    queryFn: () => api.get<Activity[]>('/activities').then(r => r.data),
  });

  const { data: shopConfig } = useQuery<{ accountNumber: string; iban: string }>({
    queryKey: ['shop-config'],
    queryFn: () => api.get('/config').then(r => r.data),
    staleTime: Infinity,
  });

  const preselectedUnit = units?.find(u => u.slug === unitSlugParam);
  const preselectedActivity = activities?.find(a => a.code === activityCodeParam);

  useEffect(() => {
    if (preselectedActivity && !activityId) setActivityId(preselectedActivity.id);
  }, [preselectedActivity]);

  useEffect(() => {
    if (preselectedUnit) setValue('militaryUnitId', preselectedUnit.id);
  }, [preselectedUnit?.id]);

  const selectedActivity = activities?.find(a => a.id === activityId);
  const activityMessage = selectedActivity ? `${selectedActivity.code} ${selectedActivity.name}`.slice(0, 60) : '';
  const activityQr = selectedActivity && shopConfig?.iban ? buildQr(shopConfig.iban, activityAmount, activityMessage) : '';

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      customerName: user?.name || '',
      customerEmail: user?.email || '',
      donationAmount: amountParam,
      militaryUnitId: preselectedUnit?.id || '',
      subscribeNewsletter: false,
    },
  });

  const militaryUnitId = watch('militaryUnitId');
  const selectedUnit = units?.find(u => u.id === militaryUnitId);

  const mutation = useMutation({
    mutationFn: (data: UnitFormData) =>
      api.post<Order>('/orders', {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        donationAmount: data.donationAmount,
        militaryUnitId: data.militaryUnitId || undefined,
        subscribeNewsletter: data.subscribeNewsletter,
        items: [],
      }).then(r => r.data),
    onSuccess: (order) => navigate(`/orders/${order.id}`),
    onError: (err: any) => toast.error(err.response?.data?.message || t('donate.error')),
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
          <Heart size={20} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('donate.title')}</h1>
          <p className="text-sm text-slate-500">{t('donate.subtitle')}</p>
        </div>
      </div>

      {!user && target === 'unit' && (
        <div className="mt-4 mb-6 flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-amber-500" />
          <span>
            <Trans i18nKey="donate.loginAlert" components={{ 1: <Link to="/login" className="underline font-medium" /> }} />
          </span>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {/* Target selector */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-sm text-slate-700">{t('donate.target.title')}</h2>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: 'unit', label: t('donate.target.unit') },
              { value: 'activity', label: t('donate.target.activity') },
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTarget(value)}
                className={`flex items-center gap-2 p-3 border-2 rounded-lg transition-colors text-left ${target === value ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${target === value ? 'border-brand-500 bg-brand-500' : 'border-slate-400'}`} />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ACTIVITY MODE — client-side QR, no order */}
        {target === 'activity' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('donate.activity.label')}</label>
                <select
                  value={activityId}
                  onChange={e => setActivityId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">{t('donate.activity.select')}</option>
                  {activities?.map(a => (
                    <option key={a.id} value={a.id}>{a.code} – {localName(a, i18n.language)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('donate.amount.title')}</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {PRESETS.map(amount => (
                    <button key={amount} type="button"
                      onClick={() => { setActivityAmount(amount); setActivityInput(amount.toFixed(0)); }}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${activityAmount === amount ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 hover:border-brand-400 hover:text-brand-600'}`}>
                      {formatPrice(amount)}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="number" min={1} step={1}
                    value={activityInput}
                    onChange={e => {
                      setActivityInput(e.target.value);
                      const n = parseFloat(e.target.value);
                      if (!isNaN(n) && n > 0) setActivityAmount(n);
                    }}
                    placeholder={t('donate.amount.other')}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Kč</span>
                </div>
              </div>
            </div>

            {selectedActivity && shopConfig ? (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <h2 className="font-semibold text-sm text-slate-700">{t('order.transfer.title')}</h2>
                <PaymentBlock
                  qr={activityQr}
                  accountNumber={shopConfig.accountNumber}
                  iban={shopConfig.iban}
                  variableSymbol={selectedActivity.code}
                  amount={activityAmount}
                  message={activityMessage}
                />
                <p className="text-xs text-slate-400 text-center leading-relaxed">
                  {t('widget.activityWidget.note', { code: selectedActivity.code })}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-2">{t('widget.activityWidget.noActivity')}</p>
            )}
          </div>
        )}

        {/* UNIT MODE — creates order */}
        {target === 'unit' && (
          <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('donate.unit.label')}</label>
                <select {...register('militaryUnitId')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">{t('donate.unit.select')}</option>
                  {units?.map(u => <option key={u.id} value={u.id}>{localName(u, i18n.language)}</option>)}
                </select>
                {selectedUnit?.activity && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    {t('donate.unit.paymentCode', { code: selectedUnit.activity.code, name: localName(selectedUnit.activity, i18n.language) })}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('donate.amount.title')}</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {PRESETS.map(amount => (
                    <button key={amount} type="button"
                      onClick={() => { setValue('donationAmount', amount); setUnitDonationInput(amount.toFixed(0)); }}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${Number(unitDonationInput) === amount ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 hover:border-brand-400 hover:text-brand-600'}`}>
                      {formatPrice(amount)}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="number" min={1} step={1}
                    value={unitDonationInput}
                    onChange={e => { setUnitDonationInput(e.target.value); const n = parseFloat(e.target.value); if (!isNaN(n)) setValue('donationAmount', n); }}
                    placeholder={t('donate.amount.other')}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Kč</span>
                </div>
                {errors.donationAmount && <p className="text-red-500 text-xs">{errors.donationAmount.message}</p>}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-sm text-slate-700">{t('donate.contact.title')}</h2>
              <div>
                <label className="block text-sm font-medium mb-1">{t('donate.contact.name')}</label>
                <input {...register('customerName')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('donate.contact.email')}</label>
                <input {...register('customerEmail')} type="email" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                {errors.customerEmail && <p className="text-red-500 text-xs mt-1">{errors.customerEmail.message}</p>}
              </div>
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input type="checkbox" {...register('subscribeNewsletter')} className="mt-0.5" />
                <span className="text-slate-600">{t('donate.newsletter')}</span>
              </label>
            </div>

            <button type="submit" disabled={mutation.isPending}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-xl py-3.5 font-semibold text-base transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <Heart size={18} />
              {mutation.isPending ? t('donate.submitting') : t('donate.submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
