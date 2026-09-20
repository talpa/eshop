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

const PRESETS = [200, 500, 1000, 2000];

function buildQr(iban: string, amount: number, message: string) {
  if (!iban || amount <= 0) return '';
  return `SPD*1.0*ACC:${iban}*AM:${amount.toFixed(2)}*CC:CZK*MSG:${message}`;
}

const unitSchema = z.object({
  customerName: z.string().min(2, 'Zadejte jméno'),
  customerEmail: z.string().email('Neplatný email'),
  donationAmount: z.number({ invalid_type_error: 'Zadejte částku' }).positive(),
  militaryUnitId: z.string().optional(),
});
type UnitFormData = z.infer<typeof unitSchema>;

function ActivityView({ activities, shopConfig, defaultActivityId, defaultAmount }: {
  activities: Activity[];
  shopConfig: { accountNumber: string; iban: string } | undefined;
  defaultActivityId: string;
  defaultAmount: number;
}) {
  const [activityId, setActivityId] = useState(defaultActivityId);
  const [amount, setAmount] = useState(defaultAmount);
  const [amountInput, setAmountInput] = useState(defaultAmount.toFixed(0));

  const activity = activities.find(a => a.id === activityId);
  const message = activity ? `${activity.code} ${activity.name}`.slice(0, 60) : '';
  const qr = activity && shopConfig?.iban ? buildQr(shopConfig.iban, amount, message) : '';

  return (
    <div className="space-y-4">
      <div>
        <select
          value={activityId}
          onChange={e => setActivityId(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">— Vyberte účel —</option>
          {activities.map(a => (
            <option key={a.id} value={a.id}>{a.code} – {a.name}</option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex gap-1.5 mb-2 flex-wrap">
          {PRESETS.map(p => (
            <button key={p} type="button"
              onClick={() => { setAmount(p); setAmountInput(p.toFixed(0)); }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${amount === p ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 hover:border-brand-400'}`}
            >
              {formatPrice(p)}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            type="number" min={1} step={1}
            value={amountInput}
            onChange={e => {
              setAmountInput(e.target.value);
              const n = parseFloat(e.target.value);
              if (!isNaN(n) && n > 0) setAmount(n);
            }}
            placeholder="Jiná částka"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Kč</span>
        </div>
      </div>

      {activity && shopConfig && (
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          {qr && (
            <div className="flex justify-center pb-1">
              <QRCodeSVG value={qr} size={150} />
            </div>
          )}
          <div className="space-y-1.5 text-sm">
            {shopConfig.accountNumber && (
              <div className="flex justify-between">
                <span className="text-slate-500">Číslo účtu</span>
                <span className="font-mono font-medium text-xs">{shopConfig.accountNumber}</span>
              </div>
            )}
            {shopConfig.iban && (
              <div className="flex justify-between">
                <span className="text-slate-500">IBAN</span>
                <span className="font-mono text-xs">{shopConfig.iban}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-1.5">
              <span className="text-slate-500">Zpráva / účel</span>
              <span className="font-mono font-bold text-slate-800 text-xs">{activity.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Částka</span>
              <span className="font-bold text-brand-600">{formatPrice(amount)}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            Naskenujte QR kód nebo převeďte na uvedený účet.<br />Do zprávy uveďte kód <strong>{activity.code}</strong>.
          </p>
        </div>
      )}

      {!activity && (
        <p className="text-xs text-slate-400 text-center py-4">
          Vyberte účel pro zobrazení platebních instrukcí.
        </p>
      )}
    </div>
  );
}

function UnitView({ units, shopConfig, defaultUnitId, defaultAmount }: {
  units: MilitaryUnit[];
  shopConfig: { accountNumber: string; iban: string } | undefined;
  defaultUnitId: string;
  defaultAmount: number;
}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [amountInput, setAmountInput] = useState(defaultAmount.toFixed(0));

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: { donationAmount: defaultAmount, militaryUnitId: defaultUnitId },
  });

  const militaryUnitId = watch('militaryUnitId');
  const selectedUnit = units.find(u => u.id === militaryUnitId);

  const mutation = useMutation({
    mutationFn: (data: UnitFormData) =>
      api.post<Order>('/orders', {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        donationAmount: data.donationAmount,
        militaryUnitId: data.militaryUnitId || undefined,
        items: [],
      }).then(r => r.data),
    onSuccess: (o) => setOrder(o),
  });

  if (order) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle size={18} />
          <span className="font-semibold text-sm">Dar zaregistrován</span>
        </div>
        <p className="text-xs text-slate-600">Zašlete dar převodem — platební instrukce jsme Vám odeslali emailem.</p>

        {order.payment?.qrPayload && (
          <div className="flex justify-center py-1">
            <QRCodeSVG value={order.payment.qrPayload} size={150} />
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

        <button onClick={() => setOrder(null)} className="w-full text-xs text-brand-600 hover:underline text-center">
          Darovat znovu
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-3">
      <div>
        <select {...register('militaryUnitId')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">— Vyberte jednotku —</option>
          {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        {selectedUnit?.activity && (
          <p className="text-xs text-slate-500 mt-1">
            Kód: <span className="font-mono font-medium">{selectedUnit.activity.code}</span>
          </p>
        )}
      </div>

      <div>
        <div className="flex gap-1.5 mb-2 flex-wrap">
          {PRESETS.map(p => (
            <button key={p} type="button"
              onClick={() => { setValue('donationAmount', p); setAmountInput(p.toFixed(0)); }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${Number(amountInput) === p ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 hover:border-brand-400'}`}
            >
              {formatPrice(p)}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            type="number" min={1} step={1}
            value={amountInput}
            onChange={e => { setAmountInput(e.target.value); const n = parseFloat(e.target.value); if (!isNaN(n)) setValue('donationAmount', n); }}
            placeholder="Jiná částka"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Kč</span>
        </div>
        {errors.donationAmount && <p className="text-red-500 text-xs">{errors.donationAmount.message}</p>}
      </div>

      <input {...register('customerName')} placeholder="Jméno a příjmení" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      {errors.customerName && <p className="text-red-500 text-xs">{errors.customerName.message}</p>}
      <input {...register('customerEmail')} type="email" placeholder="Email" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      {errors.customerEmail && <p className="text-red-500 text-xs">{errors.customerEmail.message}</p>}

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
    </form>
  );
}

export default function WidgetPage() {
  const [searchParams] = useSearchParams();

  const unitSlugParam = searchParams.get('unit') || '';
  const activityCodeParam = searchParams.get('activity') || '';
  const amountParam = parseFloat(searchParams.get('amount') || '0') || 500;

  const { data: units = [] } = useQuery<MilitaryUnit[]>({
    queryKey: ['military-units'],
    queryFn: () => api.get<MilitaryUnit[]>('/military-units').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ['activities'],
    queryFn: () => api.get<Activity[]>('/activities').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: shopConfig } = useQuery<{ accountNumber: string; iban: string }>({
    queryKey: ['shop-config'],
    queryFn: () => api.get('/config').then(r => r.data),
    staleTime: Infinity,
  });

  const defaultTarget: 'unit' | 'activity' = activityCodeParam ? 'activity' : 'unit';
  const [target, setTarget] = useState<'unit' | 'activity'>(defaultTarget);

  const preselectedUnit = units.find(u => u.slug === unitSlugParam);
  const preselectedActivity = activities.find(a => a.code === activityCodeParam);

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

      <div className="grid grid-cols-2 gap-1.5 mb-4">
        {([
          { value: 'unit', label: 'Jednotce' },
          { value: 'activity', label: 'Účelu fondu' },
        ] as const).map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTarget(value)}
            className={`flex items-center gap-1.5 p-2.5 border-2 rounded-lg transition-colors text-xs font-medium ${target === value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
          >
            <span className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${target === value ? 'border-brand-500 bg-brand-500' : 'border-slate-400'}`} />
            {label}
          </button>
        ))}
      </div>

      {target === 'activity' ? (
        <ActivityView
          activities={activities}
          shopConfig={shopConfig}
          defaultActivityId={preselectedActivity?.id || ''}
          defaultAmount={amountParam}
        />
      ) : (
        <UnitView
          units={units}
          shopConfig={shopConfig}
          defaultUnitId={preselectedUnit?.id || ''}
          defaultAmount={amountParam}
        />
      )}

      <p className="text-xs text-slate-400 text-center mt-4">
        Dar pro{' '}
        <a href="/" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
          Česká stopa — Nadační fond
        </a>
      </p>
    </div>
  );
}
