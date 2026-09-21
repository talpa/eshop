import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X, Upload, ImageOff } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Product, Category, MilitaryUnit } from '../../types';
import { formatPrice, getImageUrl } from '../../lib/utils';

const schema = z.object({
  name: z.string().min(1, 'Název je povinný'),
  nameEn: z.string().optional(),
  nameUk: z.string().optional(),
  nameDe: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Pouze malá písmena, čísla a pomlčky'),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionUk: z.string().optional(),
  descriptionDe: z.string().optional(),
  priceCzk: z.coerce.number().positive('Cena musí být kladná'),
  stock: z.coerce.number().int().min(0),
  categoryId: z.string().optional(),
  isActive: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => api.get<{ products: Product[] }>('/products?limit=100').then(r => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories').then(r => r.data),
  });

  const { data: units } = useQuery<MilitaryUnit[]>({
    queryKey: ['admin-military-units'],
    queryFn: () => api.get<MilitaryUnit[]>('/military-units/admin').then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || !data?.products) return;
    const product = data.products.find(p => p.id === editId);
    if (product) {
      openEdit(product);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, data?.products]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData & { militaryUnitIds: string[]; images: string[] }) =>
      editing
        ? api.patch(`/products/${editing.id}`, data)
        : api.post('/products', data),
    onSuccess: () => {
      toast.success(editing ? 'Produkt upraven.' : 'Produkt vytvořen.');
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      setShowForm(false);
      setEditing(null);
      setSelectedUnitIds([]);
      setProductImages([]);
      reset();
    },
    onError: () => toast.error('Chyba při ukládání.'),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post<{ url: string }>('/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProductImages(prev => [...prev, res.data.url]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Chyba při nahrávání obrázku.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => { toast.success('Produkt deaktivován.'); qc.invalidateQueries({ queryKey: ['admin-products'] }); },
  });

  const openEdit = (product: Product) => {
    setEditing(product);
    setSelectedUnitIds((product.militaryUnits || []).map(u => u.id));
    setProductImages(product.images || []);
    reset({
      name: product.name,
      nameEn: product.nameEn || '',
      nameUk: product.nameUk || '',
      nameDe: product.nameDe || '',
      slug: product.slug,
      description: product.description || '',
      descriptionEn: product.descriptionEn || '',
      descriptionUk: product.descriptionUk || '',
      descriptionDe: product.descriptionDe || '',
      priceCzk: Number(product.priceCzk),
      stock: product.stock,
      categoryId: product.categoryId || '',
      isActive: product.isActive,
    });
    setShowForm(true);
  };

  const openNew = () => {
    setEditing(null);
    setSelectedUnitIds([]);
    setProductImages([]);
    reset({ isActive: true, stock: 0 });
    setShowForm(true);
  };

  const toggleUnit = (id: string) =>
    setSelectedUnitIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Produkty / Dárky</h1>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Nový produkt
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editing ? 'Upravit produkt' : 'Nový produkt'}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(d => saveMutation.mutate({ ...d, militaryUnitIds: selectedUnitIds, images: productImages }))} className="space-y-3">
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

              <div className="border-t border-slate-200 pt-3 mt-1">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Překlady (EN / UK / DE)</p>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">Název EN</label>
                    <input {...register('nameEn')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Název UK</label>
                    <input {...register('nameUk')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Name DE</label>
                    <input {...register('nameDe')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Popis EN</label>
                    <textarea {...register('descriptionEn')} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Popis UK</label>
                    <textarea {...register('descriptionUk')} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Beschreibung DE</label>
                    <textarea {...register('descriptionDe')} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-2">Obrázky</label>
                {productImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {productImages.map((url, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={getImageUrl(url)}
                          alt=""
                          className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => setProductImages(prev => prev.filter((_, j) => j !== i))}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-3 py-2 text-xs border border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-brand-400 hover:text-brand-600 transition-colors disabled:opacity-50"
                >
                  <Upload size={14} />
                  {uploading ? 'Nahrávám...' : 'Nahrát obrázek'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Min. dar (Kč)</label>
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

              {units && units.length > 0 && (
                <div>
                  <label className="block text-xs font-medium mb-2">Vojenské jednotky</label>
                  <div className="space-y-1 max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2">
                    {units.filter(u => u.isActive).map(unit => (
                      <label key={unit.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5">
                        <input
                          type="checkbox"
                          checked={selectedUnitIds.includes(unit.id)}
                          onChange={() => toggleUnit(unit.id)}
                          className="rounded"
                        />
                        {unit.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

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
              {['', 'Název', 'Kategorie', 'Min. dar', 'Jednotky', 'Sklad', 'Aktivní', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.products.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  {p.images?.[0] ? (
                    <img src={getImageUrl(p.images[0])} alt="" className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center">
                      <ImageOff size={14} className="text-slate-300" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-slate-500">{p.category?.name || '—'}</td>
                <td className="px-4 py-3 font-semibold text-brand-600">{formatPrice(p.priceCzk)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {p.militaryUnits?.length ? p.militaryUnits.map(u => (
                      <span key={u.id} className="text-xs bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded-full">{u.name}</span>
                    )) : <span className="text-slate-300 text-xs">—</span>}
                  </div>
                </td>
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
