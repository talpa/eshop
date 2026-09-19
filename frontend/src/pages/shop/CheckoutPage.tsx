import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { Order } from '../../types';
import { formatPrice } from '../../lib/utils';

const schema = z.object({
  customerName: z.string().min(2, 'Zadejte jméno'),
  customerEmail: z.string().email('Neplatný email'),
  shippingAddress: z.string().min(5, 'Zadejte adresu'),
  note: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, clear } = useCartStore();
  const user = useAuthStore(s => s.user);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { customerName: user?.name || '', customerEmail: user?.email || '' },
  });

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
      <h1 className="text-2xl font-bold mb-6">Dokončení objednávky</h1>
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
          <div>
            <label className="block text-sm font-medium mb-1">Poznámka (volitelně)</label>
            <textarea {...register('note')} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <button type="submit" disabled={mutation.isPending} className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-3 font-medium transition-colors disabled:opacity-50">
            {mutation.isPending ? 'Odesílám...' : 'Objednat a zaplatit'}
          </button>
        </form>

        <div className="bg-slate-50 rounded-xl p-4 h-fit">
          <h2 className="font-semibold mb-3 text-sm">Shrnutí objednávky</h2>
          <div className="space-y-2 text-sm mb-4">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex justify-between">
                <span className="text-slate-600 truncate mr-2">{product.name} × {quantity}</span>
                <span className="font-medium flex-shrink-0">{formatPrice(Number(product.priceCzk) * quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 flex justify-between font-bold">
            <span>Celkem</span>
            <span className="text-brand-600">{formatPrice(total())}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
