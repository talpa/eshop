import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, Banknote, CheckCircle, Bell, Upload, ImageOff, Youtube, Plus, X, Images } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { MilitaryUnit, Activity } from '../../types';
import { formatPrice, getImageUrl } from '../../lib/utils';

interface UnitStats {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  orderCount: number;
  totalReceived: number;
  totalUsed: number;
}

export default function AdminMilitaryUnitsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<MilitaryUnit | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', nameEn: '', nameUk: '', nameDe: '', slug: '', description: '', descriptionEn: '', descriptionUk: '', descriptionDe: '', logo: '', activityId: '' as string | null });
  const [youtubeUrls, setYoutubeUrls] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { data: units, isLoading } = useQuery<MilitaryUnit[]>({
    queryKey: ['admin-military-units'],
    queryFn: () => api.get<MilitaryUnit[]>('/military-units/admin').then(r => r.data),
  });

  const { data: stats } = useQuery<UnitStats[]>({
    queryKey: ['military-units-stats'],
    queryFn: () => api.get<UnitStats[]>('/military-units/stats').then(r => r.data),
  });

  const { data: activities } = useQuery<Activity[]>({
    queryKey: ['activities-admin'],
    queryFn: () => api.get<Activity[]>('/activities/admin').then(r => r.data),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-military-units'] });
    qc.invalidateQueries({ queryKey: ['military-units-stats'] });
  };

  const resetForm = () => {
    setForm({ name: '', nameEn: '', nameUk: '', nameDe: '', slug: '', description: '', descriptionEn: '', descriptionUk: '', descriptionDe: '', logo: '', activityId: null });
    setYoutubeUrls([]);
    setPhotos([]);
  };

  const createMutation = useMutation({
    mutationFn: (data: typeof form & { youtubeUrls: string[]; photos: string[] }) => api.post('/military-units', data),
    onSuccess: () => { toast.success('Jednotka přidána.'); setCreating(false); resetForm(); invalidate(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Chyba'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof form> & { youtubeUrls: string[]; photos: string[] } }) => api.patch(`/military-units/${id}`, data),
    onSuccess: () => { toast.success('Uloženo.'); setEditing(null); invalidate(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Chyba'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/military-units/${id}`),
    onSuccess: () => { toast.success('Jednotka deaktivována.'); invalidate(); },
    onError: () => toast.error('Chyba'),
  });

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post<{ url: string }>('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(f => ({ ...f, logo: data.url }));
    } catch {
      toast.error('Nahrávání selhalo');
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoUpload = async (files: FileList) => {
    setUploadingPhoto(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        const { data } = await api.post<{ url: string }>('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        uploaded.push(data.url);
      }
      setPhotos(p => [...p, ...uploaded]);
    } catch {
      toast.error('Nahrávání fotek selhalo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const slugify = (name: string) =>
    name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const totalReceived = stats?.reduce((s, u) => s + u.totalReceived, 0) ?? 0;
  const totalUsed = stats?.reduce((s, u) => s + u.totalUsed, 0) ?? 0;
  const totalOrders = stats?.reduce((s, u) => s + u.orderCount, 0) ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Vojenské jednotky</h1>
        <button
          onClick={() => { setCreating(true); resetForm(); }}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Přidat jednotku
        </button>
      </div>

      {/* Souhrnné statistiky */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp size={18} className="text-brand-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Celkem darů</p>
            <p className="text-lg font-bold">{totalOrders}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Banknote size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Celkem přijato</p>
            <p className="text-lg font-bold text-green-700">{formatPrice(totalReceived)}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <CheckCircle size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Celkem vyplaceno</p>
            <p className="text-lg font-bold text-blue-700">{formatPrice(totalUsed)}</p>
          </div>
        </div>
      </div>

      {/* Statistiky per jednotka */}
      {stats && stats.some(s => s.orderCount > 0) && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-8">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <h2 className="font-semibold text-sm">Statistiky per jednotka</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100">
              <tr>
                {['Jednotka', 'Počet darů', 'Přijato', 'Vyplaceno', 'Zbývá'].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats.filter(s => s.orderCount > 0).sort((a, b) => b.totalReceived - a.totalReceived).map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-slate-600">{s.orderCount}</td>
                  <td className="px-4 py-3 font-semibold text-green-700">{formatPrice(s.totalReceived)}</td>
                  <td className="px-4 py-3 text-blue-700">{formatPrice(s.totalUsed)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${s.totalReceived - s.totalUsed > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                        {formatPrice(s.totalReceived - s.totalUsed)}
                      </span>
                      {s.totalReceived > 0 && (
                        <div className="flex-1 max-w-20 bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, (s.totalUsed / s.totalReceived) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(creating || editing) && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold mb-4">{creating ? 'Nová jednotka' : 'Upravit jednotku'}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Název</label>
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
              <label className="block text-sm font-medium mb-1">Popis (volitelně)</label>
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
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-2">Logo jednotky</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 flex-shrink-0 overflow-hidden">
                  {form.logo ? (
                    <img src={getImageUrl(form.logo)} alt="logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <ImageOff size={20} className="text-slate-400" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                  >
                    <Upload size={14} />
                    {uploading ? 'Nahrávám…' : 'Nahrát logo'}
                  </button>
                  {form.logo && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, logo: '' }))} className="text-xs text-red-500 hover:underline">
                      Odebrat
                    </button>
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ''; }}
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Youtube size={14} className="text-red-500" />
                YouTube videa
              </label>
              <div className="space-y-2">
                {youtubeUrls.map((url, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={url}
                      onChange={e => setYoutubeUrls(urls => urls.map((u, j) => j === i ? e.target.value : u))}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <button type="button" onClick={() => setYoutubeUrls(urls => urls.filter((_, j) => j !== i))} className="p-2 text-red-400 hover:text-red-600">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setYoutubeUrls(u => [...u, ''])}
                  className="flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
                >
                  <Plus size={13} /> Přidat odkaz
                </button>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Images size={14} className="text-slate-500" />
                Fotogalerie
              </label>
              {photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {photos.map((photo, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 group">
                      <img src={getImageUrl(photo)} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotos(p => p.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                <Upload size={14} />
                {uploadingPhoto ? 'Nahrávám…' : 'Přidat fotky'}
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => { const fl = e.target.files; if (fl) handlePhotoUpload(fl); e.target.value = ''; }}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Platební kód (aktivita)</label>
              <select
                value={form.activityId || ''}
                onChange={e => setForm(f => ({ ...f, activityId: e.target.value || null }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">— Bez přiřazení —</option>
                {activities?.map(a => (
                  <option key={a.id} value={a.id}>{a.code} – {a.name}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">Kód se přidá do platební poznámky u darů pro tuto jednotku.</p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => {
                const urls = youtubeUrls.filter(u => u.trim());
                if (creating) createMutation.mutate({ ...form, youtubeUrls: urls, photos });
                else if (editing) updateMutation.mutate({ id: editing.id, data: { ...form, youtubeUrls: urls, photos } });
              }}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {creating ? 'Přidat' : 'Uložit'}
            </button>
            <button
              onClick={() => { setCreating(false); setEditing(null); resetForm(); }}
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
              {['Název', 'Platební kód', 'Darů', 'Aktivní', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {units?.map(unit => (
              <tr key={unit.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium">{unit.name}</p>
                  {unit.description && <p className="text-xs text-slate-400 mt-0.5">{unit.description}</p>}
                </td>
                <td className="px-4 py-3">
                  {unit.activity ? (
                    <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{unit.activity.code}</span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">{unit._count?.orders ?? 0}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${unit.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {unit.isActive ? 'Ano' : 'Ne'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end items-center">
                    <Link
                      to={`/admin/unit-updates/${unit.id}`}
                      className="flex items-center gap-1 text-xs text-amber-600 hover:underline"
                    >
                      <Bell size={12} />
                      Aktuality
                    </Link>
                    <button
                      onClick={() => { setEditing(unit); setCreating(false); setForm({ name: unit.name, nameEn: unit.nameEn || '', nameUk: unit.nameUk || '', nameDe: unit.nameDe || '', slug: unit.slug, description: unit.description || '', descriptionEn: unit.descriptionEn || '', descriptionUk: unit.descriptionUk || '', descriptionDe: unit.descriptionDe || '', logo: unit.logo || '', activityId: unit.activityId || null }); setYoutubeUrls(unit.youtubeUrls ?? []); setPhotos(unit.photos ?? []); }}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Upravit
                    </button>
                    {unit.isActive && (
                      <button
                        onClick={() => { if (confirm(`Deaktivovat ${unit.name}?`)) deleteMutation.mutate(unit.id); }}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Deaktivovat
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
