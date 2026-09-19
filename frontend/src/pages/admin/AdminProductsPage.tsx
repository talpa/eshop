import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Product, Category } from '../../types';
import { formatPrice } from '../../lib/utils';

const schema = z.object({
  name: z.string().min(1, 'Název je povinný'),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Pouze malá písmena, čísla a pomlčky'),
  description: z.string().optional(),
  priceCzk: z.coerce.number().positive('Cena musí být kladná'),
  stock: z.coerce.number().int().min(0),
  categoryId: z.string().optional(),
  isActive: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => api.get<{ products: Product[] }>('/products?limit=100').then(r => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories').then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      editing
        ? api.patch(`/products/${editing.id}`, data)
        : api.post('/products', data),
    onSuccess: () => {
      toast.success(editing ? 'Produkt upraven.' : 'Produkt vytvořen.');
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      setShowForm(false);
      setEditing(null);
      reset();
    },
    onError: () => toast.error('Chyba při ukládání.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => { toast.success('Produkt deaktivován.'); qc.invalidateQueries({ queryKey: ['admin-products'] }); },
  });

  const openEdit = (product: Product) => {
    setEditing(product);
    reset({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      priceCzk: Number(product.priceCzk),
      stock: product.stock,
      categoryId: product.categoryId || '',
      isActive: product.isActive,
    });
    setShowForm(true);
  };

  const openNew = () => { setEditing(null); reset({ isActive: true, stock: 0 }); setShowForm(true); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Produkty</h1>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Nový produkt
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editing ? 'Upravit produkt' : 'Nový produkt'}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-3">
              {[
                { name: 'name' as const, label: 'Název' },
                { name: 'slug' as const, label: 'Slug (URL)' },
              ].map(({ name, label }) => (
                <div key={name}>
                  <label className="block text-xs font-medium mb-1">{label}</label>
                  <input {...register(name)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]?.message}</p>}
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium mb-1">Popis</label>
                <textarea {...register('description')} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Cena (Kč)</label>
                  <input {...register('priceCzk')} type="number" step="0.01" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  {errors.priceCzk && <p className="text-red-500 text-xs mt-1">{errors.priceCzk.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Sklad (ks)</label>
                  <input {...register('stock')} type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Kategorie</label>
                <select {...register('categoryId')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">— bez kategorie —</option>
                  {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input {...register('isActive')} type="checkbox" className="rounded" /> Aktivní
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">Zrušit</button>
                <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 text-sm bg-brand-600 hover:bg-brand-700 text-white rounded-lg disabled:opacity-50">
                  {saveMutation.isPending ? 'Ukládám...' : 'Uložit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading && <div className="text-slate-400">Načítám...</div>}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Název', 'Kategorie', 'Cena', 'Sklad', 'Aktivní', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.products.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-slate-500">{p.category?.name || '—'}</td>
                <td className="px-4 py-3 font-semibold text-brand-600">{formatPrice(p.priceCzk)}</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {p.isActive ? 'Ano' : 'Ne'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-brand-600"><Pencil size={14} /></button>
                    <button onClick={() => { if (confirm('Deaktivovat produkt?')) deleteMutation.mutate(p.id); }} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
