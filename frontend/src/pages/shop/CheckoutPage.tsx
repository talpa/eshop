import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { Order, MilitaryUnit } from '../../types';
import { formatPrice } from '../../lib/utils';

const schema = z.object({
  customerName: z.string().min(2, 'Zadejte jméno'),
  customerEmail: z.string().email('Neplatný email'),
  shippingAddress: z.string().min(5, 'Zadejte adresu'),
  note: z.string().optional(),
  militaryUnitId: z.string().optional(),
  donationAmount: z.number({ invalid_type_error: 'Zadejte částku' }).positive('Částka musí být kladná'),
  subscribeNewsletter: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, clear } = useCartStore();
  const user = useAuthStore(s => s.user);
  const minAmount = total();
  const [donationInput, setDonationInput] = useState(minAmount.toString());

  const { data: units } = useQuery<MilitaryUnit[]>({
    queryKey: ['military-units'],
    queryFn: () => api.get<MilitaryUnit[]>('/military-units').then(r => r.data),
  });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: user?.name || '',
      customerEmail: user?.email || '',
      donationAmount: minAmount,
      subscribeNewsletter: false,
    },
  });

  useEffect(() => {
    setValue('donationAmount', minAmount);
    setDonationInput(minAmount.toFixed(0));
  }, [minAmount, setValue]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post<Order>('/orders', {
        ...data,
        items: items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
      }).then(r => r.data),
    onSuccess: (order) => {
      clear();
      navigate(`/orders/${order.id}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Nepodařilo se vytvořit objednávku.'),
  });

  if (items.length === 0) { navigate('/cart'); return null; }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Váš dar</h1>
      <p className="text-slate-500 text-sm mb-6">Vaše kontaktní údaje jsou důvěrné a slouží výhradně pro účely fondu.</p>

      {!user && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          Přihlásit se není nutné, ale po přihlášení budete mít přístup k potvrzení o daru kdykoliv znovu.
          {' '}<a href="/login" className="underline font-medium">Přihlásit se</a>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Jméno a příjmení</label>
            <input {...register('customerName')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input {...register('customerEmail')} type="email" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            {errors.customerEmail && <p className="text-red-500 text-xs mt-1">{errors.customerEmail.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Doručovací adresa</label>
            <textarea {...register('shippingAddress')} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            {errors.shippingAddress && <p className="text-red-500 text-xs mt-1">{errors.shippingAddress.message}</p>}
          </div>

          {units && units.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">Vojenská jednotka (volitelně)</label>
              <select {...register('militaryUnitId')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">— Nevybráno —</option>
                {units.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Výše daru
              <span className="ml-2 text-xs text-slate-400 font-normal">minimum {formatPrice(minAmount)}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={minAmount}
                step="1"
                value={donationInput}
                onChange={e => {
                  setDonationInput(e.target.value);
                  const num = parseFloat(e.target.value);
                  if (!isNaN(num)) setValue('donationAmount', num);
                }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Kč</span>
            </div>
            {errors.donationAmount && <p className="text-red-500 text-xs mt-1">{errors.donationAmount.message}</p>}
            <div className="flex gap-2 mt-2">
              {[minAmount, minAmount * 2, minAmount * 3].map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => { setValue('donationAmount', amount); setDonationInput(amount.toFixed(0)); }}
                  className="text-xs px-2 py-1 rounded border border-slate-300 hover:border-brand-500 hover:text-brand-600 transition-colors"
                >
                  {formatPrice(amount)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Poznámka (volitelně)</label>
            <textarea {...register('note')} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register('subscribeNewsletter')} className="mt-0.5" />
            <span className="text-slate-600">Chci dostávat aktuality o využití darů a novinkách z misí</span>
          </label>

          <button type="submit" disabled={mutation.isPending} className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-3 font-medium transition-colors disabled:opacity-50">
            {mutation.isPending ? 'Odesílám...' : 'Potvrdit dar a zaplatit'}
          </button>
        </form>

        <div className="bg-slate-50 rounded-xl p-4 h-fit">
          <h2 className="font-semibold mb-3 text-sm">Jako poděkování obdržíte</h2>
          <div className="space-y-2 text-sm mb-4">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex justify-between">
                <span className="text-slate-600 truncate mr-2">{product.name} × {quantity}</span>
                <span className="text-slate-400 flex-shrink-0 text-xs">min. {formatPrice(Number(product.priceCzk) * quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 text-xs text-slate-500">
            <p>Po přijetí platby Vám bude odesláno potvrzení o daru na zadaný email.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
