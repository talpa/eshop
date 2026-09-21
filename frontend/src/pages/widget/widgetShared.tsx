import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { Heart, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { Activity, MilitaryUnit, Order } from '../../types';
import { formatPrice } from '../../lib/utils';
import { LANGUAGES, setLanguage } from '../../i18n';
import { localName } from '../../lib/localise';

export const PRESETS = [200, 500, 1000, 2000];

export function buildQr(iban: string, amount: number, message: string, variableSymbol?: string) {
  if (!iban || amount <= 0) return '';
  const vs = variableSymbol ? `*X-VS:${variableSymbol}` : '';
  return `SPD*1.0*ACC:${iban}*AM:${amount.toFixed(2)}*CC:CZK*MSG:${message}${vs}`;
}

export const unitSchema = z.object({
  customerName: z.string().min(2, 'Zadejte jméno'),
  customerEmail: z.string().email('Neplatný email'),
  donationAmount: z.number({ invalid_type_error: 'Zadejte částku' }).positive(),
  militaryUnitId: z.string().optional(),
  _hp: z.string().default(''),
});
export type UnitFormData = z.infer<typeof unitSchema>;

function WidgetLanguageSwitcher() {
  const { i18n } = useTranslation();
  return (
    <div className="flex justify-center gap-1 mt-3">
      {LANGUAGES.map(({ code, label }) => (
        <button key={code} onClick={() => setLanguage(code)}
          className={`text-xs px-1.5 py-0.5 rounded font-semibold transition-colors ${i18n.language === code ? 'bg-ua-yellow text-brand-900' : 'text-slate-400 hover:text-slate-600'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function AmountPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [input, setInput] = useState(value.toFixed(0));
  return (
    <div>
      <div className="flex gap-1.5 mb-2 flex-wrap">
        {PRESETS.map(p => (
          <button key={p} type="button"
            onClick={() => { onChange(p); setInput(p.toFixed(0)); }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${value === p ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 hover:border-brand-400'}`}
          >
            {formatPrice(p)}
          </button>
        ))}
      </div>
      <div className="relative">
        <input
          type="number" min={1} step={1} value={input}
          onChange={e => { setInput(e.target.value); const n = parseFloat(e.target.value); if (!isNaN(n) && n > 0) onChange(n); }}
          placeholder="Jiná částka"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Kč</span>
      </div>
    </div>
  );
}

export function PaymentBlock({ qr, accountNumber, iban, variableSymbol, amount, message }: {
  qr: string; accountNumber?: string; iban?: string; variableSymbol?: string; amount: number; message?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
      {qr && <div className="flex justify-center pb-1"><QRCodeSVG value={qr} size={150} /></div>}
      <div className="space-y-1.5 text-sm">
        {accountNumber && (
          <div className="flex justify-between">
            <span className="text-slate-500">{t('widget.payment.accountNumber')}</span>
            <span className="font-mono font-medium text-xs">{accountNumber}</span>
          </div>
        )}
        {iban && (
          <div className="flex justify-between">
            <span className="text-slate-500">{t('widget.payment.iban')}</span>
            <span className="font-mono text-xs">{iban}</span>
          </div>
        )}
        {variableSymbol && (
          <div className="flex justify-between border-t border-slate-200 pt-1.5">
            <span className="text-slate-500">{t('widget.payment.vs')}</span>
            <span className="font-mono font-bold text-slate-800">{variableSymbol}</span>
          </div>
        )}
        {message && (
          <div className="flex justify-between">
            <span className="text-slate-500">{t('widget.payment.message')}</span>
            <span className="font-mono text-xs text-slate-700">{message}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-slate-200 pt-1.5">
          <span className="text-slate-500">{t('widget.payment.amount')}</span>
          <span className="font-bold text-brand-600">{formatPrice(amount)}</span>
        </div>
      </div>
    </div>
  );
}

export function ActivityWidget({ activities, shopConfig, fixedActivity, defaultActivityId, defaultAmount, title }: {
  activities: Activity[];
  shopConfig: { accountNumber: string; iban: string } | undefined;
  fixedActivity: Activity | undefined;
  defaultActivityId: string;
  defaultAmount: number;
  title: string | null;
}) {
  const [activityId, setActivityId] = useState(fixedActivity?.id || defaultActivityId);
  const [amount, setAmount] = useState(defaultAmount);
  const { t, i18n } = useTranslation();

  const activity = fixedActivity || activities.find(a => a.id === activityId);
  const message = activity ? `${activity.code} ${activity.name}`.slice(0, 60) : '';
  const qr = activity && shopConfig?.iban ? buildQr(shopConfig.iban, amount, message) : '';

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-slate-500 mb-0.5">{title || t('widget.donateToFund')}</p>
        {fixedActivity ? (
          <p className="font-semibold text-slate-800">
            {t('widget.activityWidget.forActivity', { code: fixedActivity.code, name: localName(fixedActivity, i18n.language) })}
          </p>
        ) : (
          <select
            value={activityId}
            onChange={e => setActivityId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">{t('widget.activityWidget.selectActivity')}</option>
            {activities.map(a => (
              <option key={a.id} value={a.id}>{a.code} – {localName(a, i18n.language)}</option>
            ))}
          </select>
        )}
      </div>

      <AmountPicker value={amount} onChange={setAmount} />

      {activity && shopConfig ? (
        <PaymentBlock qr={qr} accountNumber={shopConfig.accountNumber} iban={shopConfig.iban} amount={amount} message={activity.code} />
      ) : (
        <p className="text-xs text-slate-400 text-center py-2">{t('widget.activityWidget.noActivity')}</p>
      )}

      {activity && (
        <p className="text-xs text-slate-400 text-center leading-relaxed">
          {t('widget.activityWidget.note', { code: activity.code })}
        </p>
      )}
    </div>
  );
}

export function UnitWidget({ units, shopConfig, fixedUnit, defaultUnitId, defaultAmount, title }: {
  units: MilitaryUnit[];
  shopConfig: { accountNumber: string; iban: string } | undefined;
  fixedUnit: MilitaryUnit | undefined;
  defaultUnitId: string;
  defaultAmount: number;
  title: string | null;
}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [amount, setAmount] = useState(defaultAmount);
  const { t, i18n } = useTranslation();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: { donationAmount: defaultAmount, militaryUnitId: fixedUnit?.id || defaultUnitId },
  });

  const militaryUnitId = watch('militaryUnitId');
  const selectedUnit = fixedUnit || units.find(u => u.id === militaryUnitId);

  const mutation = useMutation({
    mutationFn: (data: UnitFormData) =>
      api.post<Order>('/orders', {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        donationAmount: data.donationAmount,
        militaryUnitId: fixedUnit?.id || data.militaryUnitId || undefined,
        items: [],
      }).then(r => r.data),
    onSuccess: (o) => setOrder(o),
  });

  if (order) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle size={18} />
          <span className="font-semibold text-sm">{t('widget.unitWidget.success.title')}</span>
        </div>
        <p className="text-xs text-slate-600">{t('widget.unitWidget.success.instruction')}</p>
        <PaymentBlock
          qr={order.payment?.qrPayload || buildQr(shopConfig?.iban || '', Number(order.donationAmount), order.paymentNote || order.variableSymbol, order.variableSymbol)}
          accountNumber={shopConfig?.accountNumber}
          iban={shopConfig?.iban}
          variableSymbol={order.variableSymbol}
          amount={Number(order.donationAmount)}
          message={order.paymentNote || undefined}
        />
        <button onClick={() => setOrder(null)} className="w-full text-xs text-brand-600 hover:underline text-center">
          {t('widget.unitWidget.donateAgain')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(d => { setValue('donationAmount', amount); mutation.mutate({ ...d, donationAmount: amount }); })} className="space-y-4">
      {/* honeypot — humans won't see this, bots will fill it */}
      <input {...register('_hp')} aria-hidden="true" tabIndex={-1} autoComplete="off"
        style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}
      />
      <div>
        <p className="text-xs text-slate-500 mb-0.5">{title || t('widget.donateToFund')}</p>
        {fixedUnit ? (
          <p className="font-semibold text-slate-800">{t('widget.unitWidget.fromUnit', { name: localName(fixedUnit, i18n.language) })}</p>
        ) : (
          <div>
            <select {...register('militaryUnitId')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">{t('widget.unitWidget.selectUnit')}</option>
              {units.map(u => <option key={u.id} value={u.id}>{localName(u, i18n.language)}</option>)}
            </select>
            {selectedUnit?.activity && (
              <p className="text-xs text-slate-500 mt-1">{t('widget.unitWidget.paymentCode', { code: selectedUnit.activity.code })}</p>
            )}
          </div>
        )}
      </div>

      <AmountPicker value={amount} onChange={n => { setAmount(n); setValue('donationAmount', n); }} />

      <input {...register('customerName')} placeholder={t('widget.unitWidget.name')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      {errors.customerName && <p className="text-red-500 text-xs">{errors.customerName.message}</p>}
      <input {...register('customerEmail')} type="email" placeholder={t('widget.unitWidget.email')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      {errors.customerEmail && <p className="text-red-500 text-xs">{errors.customerEmail.message}</p>}

      {mutation.isError && (
        <p className="text-xs text-red-600 text-center">{(mutation.error as any)?.response?.data?.message || t('widget.unitWidget.error')}</p>
      )}

      <button type="submit" disabled={mutation.isPending}
        className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-xl py-2.5 font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Heart size={15} />
        {mutation.isPending ? t('widget.unitWidget.submitting') : t('widget.unitWidget.submit')}
      </button>
    </form>
  );
}

export function WidgetShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Heart size={16} className="text-brand-600" />
        </div>
        <div>
          <p className="font-bold text-slate-800 text-sm leading-tight">{t('common.fundName')}</p>
          <p className="text-xs text-slate-500">{t('common.fundSubtitle')}</p>
        </div>
      </div>
      {children}
      <p className="text-xs text-slate-400 text-center mt-4">
        <a href="/" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
          {t('widget.footer')}
        </a>
      </p>
      <WidgetLanguageSwitcher />
    </div>
  );
}
