import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Category } from '../../types';

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', nameEn: '', nameUk: '', nameDe: '', slug: '', description: '', descriptionEn: '', descriptionUk: '', descriptionDe: '' });

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories').then(r => r.data),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['categories'] });

  const slugify = (name: string) =>
    name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const emptyForm = () => setForm({ name: '', nameEn: '', nameUk: '', nameDe: '', slug: '', description: '', descriptionEn: '', descriptionUk: '', descriptionDe: '' });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/categories', data),
    onSuccess: () => { toast.success('Kategorie přidána.'); setCreating(false); emptyForm(); invalidate(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Chyba'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof form> }) => api.patch(`/categories/${id}`, data),
    onSuccess: () => { toast.success('Uloženo.'); setEditing(null); invalidate(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Chyba'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => { toast.success('Kategorie odstraněna.'); invalidate(); },
    onError: () => toast.error('Chyba při mazání'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Skupiny výrobků</h1>
          <p className="text-sm text-slate-500 mt-1">Kategorie produktů — překlady jsou zobrazeny zákazníkům podle jejich jazyka.</p>
        </div>
        <button
          onClick={() => { setCreating(true); setEditing(null); emptyForm(); }}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Přidat kategorii
        </button>
      </div>

      {(creating || editing) && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold mb-4">{creating ? 'Nová kategorie' : 'Upravit kategorii'}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Název (CS)</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: editing ? f.slug : slugify(e.target.value) }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Název EN</label>
              <input
                value={form.nameEn}
                onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))}
                placeholder="Name in English"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Назва UK</label>
              <input
                value={form.nameUk}
                onChange={e => setForm(f => ({ ...f, nameUk: e.target.value }))}
                placeholder="Назва українською"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name DE</label>
              <input
                value={form.nameDe}
                onChange={e => setForm(f => ({ ...f, nameDe: e.target.value }))}
                placeholder="Name auf Deutsch"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Popis (CS, volitelně)</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Popis EN</label>
              <textarea
                value={form.descriptionEn}
                onChange={e => setForm(f => ({ ...f, descriptionEn: e.target.value }))}
                rows={2}
                placeholder="Description in English"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Опис UK</label>
              <textarea
                value={form.descriptionUk}
                onChange={e => setForm(f => ({ ...f, descriptionUk: e.target.value }))}
                rows={2}
                placeholder="Опис українською"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Beschreibung DE</label>
              <textarea
                value={form.descriptionDe}
                onChange={e => setForm(f => ({ ...f, descriptionDe: e.target.value }))}
                rows={2}
                placeholder="Beschreibung auf Deutsch"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => {
                if (creating) createMutation.mutate(form);
                else if (editing) updateMutation.mutate({ id: editing.id, data: form });
              }}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {creating ? 'Přidat' : 'Uložit'}
            </button>
            <button
              onClick={() => { setCreating(false); setEditing(null); }}
              className="px-4 py-2 rounded-lg text-sm border border-slate-300 hover:bg-slate-50"
            >
              Zrušit
            </button>
          </div>
        </div>
      )}

      {isLoading && <div className="text-slate-400">Načítám...</div>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Název', 'Slug', 'EN', 'UK', 'Produktů', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories?.map(cat => (
              <tr key={cat.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium">{cat.name}</p>
                  {cat.description && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{cat.description}</p>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{cat.slug}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{cat.nameEn || <span className="text-slate-300">—</span>}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{cat.nameUk || <span className="text-slate-300">—</span>}</td>
                <td className="px-4 py-3 text-slate-500">{cat._count?.products ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setEditing(cat);
                        setCreating(false);
                        setForm({
                          name: cat.name,
                          nameEn: cat.nameEn || '',
                          nameUk: cat.nameUk || '',
                          nameDe: cat.nameDe || '',
                          slug: cat.slug,
                          description: cat.description || '',
                          descriptionEn: cat.descriptionEn || '',
                          descriptionUk: cat.descriptionUk || '',
                          descriptionDe: cat.descriptionDe || '',
                        });
                      }}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Upravit
                    </button>
                    {(cat._count?.products ?? 0) === 0 && (
                      <button
                        onClick={() => { if (confirm(`Smazat kategorii "${cat.name}"?`)) deleteMutation.mutate(cat.id); }}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Smazat
                      </button>
                    )}
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
