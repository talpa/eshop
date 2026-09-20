import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { Heart, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { Activity, MilitaryUnit, Order } from '../../types';
import { formatPrice } from '../../lib/utils';

const schema = z.object({
  customerName: z.string().min(2, 'Zadejte jméno'),
  customerEmail: z.string().email('Neplatný email'),
  donationAmount: z.number({ invalid_type_error: 'Zadejte částku' }).positive(),
  target: z.enum(['unit', 'activity']),
  militaryUnitId: z.string().optional(),
  activityId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const PRESETS = [200, 500, 1000, 2000];

export default function WidgetPage() {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [donationInput, setDonationInput] = useState('500');

  const unitSlugParam = searchParams.get('unit') || '';
  const activityCodeParam = searchParams.get('activity') || '';
  const amountParam = parseFloat(searchParams.get('amount') || '0') || 500;

  const { data: units } = useQuery<MilitaryUnit[]>({
    queryKey: ['military-units'],
    queryFn: () => api.get<MilitaryUnit[]>('/military-units').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: activities } = useQuery<Activity[]>({
    queryKey: ['activities'],
    queryFn: () => api.get<Activity[]>('/activities').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: shopConfig } = useQuery<{ accountNumber: string; iban: string }>({
    queryKey: ['shop-config'],
    queryFn: () => api.get('/config').then(r => r.data),
    staleTime: Infinity,
  });

  const preselectedUnit = units?.find(u => u.slug === unitSlugParam);
  const preselectedActivity = activities?.find(a => a.code === activityCodeParam);

  const defaultTarget = activityCodeParam ? 'activity' : 'unit';

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      donationAmount: amountParam,
      target: defaultTarget,
      militaryUnitId: preselectedUnit?.id || '',
      activityId: preselectedActivity?.id || '',
    },
  });

  const target = watch('target');
  const militaryUnitId = watch('militaryUnitId');
  const selectedUnit = units?.find(u => u.id === militaryUnitId);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post<Order>('/orders', {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        donationAmount: data.donationAmount,
        militaryUnitId: data.target === 'unit' ? data.militaryUnitId || undefined : undefined,
        activityId: data.target === 'activity' ? data.activityId || undefined : undefined,
        isAnonymous: data.target === 'activity',
        items: [],
      }).then(r => r.data),
    onSuccess: (o) => setOrder(o),
  });

  if (order) {
    return (
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 p-6 space-y-4">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle size={20} />
          <span className="font-semibold">Dar zaregistrován</span>
        </div>
        <p className="text-sm text-slate-600">Zašlete prosím dar převodem na účet:</p>

        {order.payment?.qrPayload && (
          <div className="flex justify-center py-2">
            <QRCodeSVG value={order.payment.qrPayload} size={160} />
          </div>
        )}

        <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-sm">
          {shopConfig?.accountNumber && (
            <div className="flex justify-between">
              <span className="text-slate-500">Číslo účtu</span>
              <span className="font-mono font-medium text-xs">{shopConfig.accountNumber}</span>
            </div>
          )}
          {shopConfig?.iban && (
            <div className="flex justify-between">
              <span className="text-slate-500">IBAN</span>
              <span className="font-mono text-xs">{shopConfig.iban}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-200 pt-1.5">
            <span className="text-slate-500">VS</span>
            <span className="font-mono font-bold text-slate-800">{order.variableSymbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Částka</span>
            <span className="font-bold text-brand-600">{formatPrice(Number(order.donationAmount))}</span>
          </div>
          {order.paymentNote && (
            <div className="flex justify-between">
              <span className="text-slate-500">Zpráva</span>
              <span className="font-mono text-xs text-slate-700">{order.paymentNote}</span>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 text-center">
          Platební instrukce Vám byly odeslány na email.
        </p>

        <button
          onClick={() => setOrder(null)}
          className="w-full text-xs text-brand-600 hover:underline text-center"
        >
          Darovat znovu
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Heart size={16} className="text-brand-600" />
        </div>
        <div>
          <p className="font-bold text-slate-800 text-sm leading-tight">Darovat — Česká stopa</p>
          <p className="text-xs text-slate-500">Nadační fond</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">

        <div className="grid grid-cols-2 gap-1.5">
          {([
            { value: 'unit', label: 'Jednotce' },
            { value: 'activity', label: 'Účelu fondu' },
          ] as const).map(({ value, label }) => (
            <label key={value} className={`flex items-center gap-1.5 p-2.5 border-2 rounded-lg cursor-pointer transition-colors text-xs font-medium ${target === value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
              <input type="radio" {...register('target')} value={value} className="sr-only" />
              <span className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${target === value ? 'border-brand-500 bg-brand-500' : 'border-slate-400'}`} />
              {label}
            </label>
          ))}
        </div>

        {target === 'unit' && (
          <div>
            <select {...register('militaryUnitId')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">— Vyberte jednotku —</option>
              {units?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            {selectedUnit?.activity && (
              <p className="text-xs text-slate-500 mt-1">
                Kód: <span className="font-mono font-medium">{selectedUnit.activity.code}</span>
              </p>
            )}
          </div>
        )}

        {target === 'activity' && (
          <select {...register('activityId')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">— Vyberte účel —</option>
            {activities?.map(a => (
              <option key={a.id} value={a.id}>{a.code} – {a.name}</option>
            ))}
          </select>
        )}

        <div>
          <div className="flex gap-1.5 mb-2 flex-wrap">
            {PRESETS.map(amount => (
              <button key={amount} type="button"
                onClick={() => { setValue('donationAmount', amount); setDonationInput(amount.toFixed(0)); }}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${Number(donationInput) === amount ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 hover:border-brand-400'}`}
              >
                {formatPrice(amount)}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="number" min={1} step={1}
              value={donationInput}
              onChange={e => { setDonationInput(e.target.value); const n = parseFloat(e.target.value); if (!isNaN(n)) setValue('donationAmount', n); }}
              placeholder="Jiná částka"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Kč</span>
          </div>
          {errors.donationAmount && <p className="text-red-500 text-xs mt-1">{errors.donationAmount.message}</p>}
        </div>

        <div className="space-y-2">
          <input {...register('customerName')} placeholder="Jméno a příjmení" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          {errors.customerName && <p className="text-red-500 text-xs">{errors.customerName.message}</p>}
          <input {...register('customerEmail')} type="email" placeholder="Email" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          {errors.customerEmail && <p className="text-red-500 text-xs">{errors.customerEmail.message}</p>}
        </div>

        {mutation.isError && (
          <p className="text-xs text-red-600 text-center">{(mutation.error as any)?.response?.data?.message || 'Nepodařilo se odeslat.'}</p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-xl py-2.5 font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Heart size={15} />
          {mutation.isPending ? 'Odesílám...' : 'Potvrdit dar'}
        </button>

        <p className="text-xs text-slate-400 text-center">
          Dar pro{' '}
          <a href="/" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
            Česká stopa — Nadační fond
          </a>
        </p>
      </form>
    </div>
  );
}
