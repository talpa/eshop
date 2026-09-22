import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Phone, Mail, MapPin, Plus, Trash2, Star, Globe, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { UserProfile, UserAddress } from '../../types';
import { LANGUAGES } from '../../i18n';

const COUNTRY_LABELS: Record<string, string> = { CZ: 'Česko', SK: 'Slovensko', DE: 'Německo', AT: 'Rakousko', PL: 'Polsko', UA: 'Ukrajina' };

const emptyAddress = { label: '', street: '', city: '', zip: '', country: 'CZ', isDefault: false };

export default function ProfilePage() {
  const qc = useQueryClient();
  const { t, i18n } = useTranslation();
  const [editingAddress, setEditingAddress] = useState<Partial<UserAddress> | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [addrForm, setAddrForm] = useState(emptyAddress);
  const [profileForm, setProfileForm] = useState<{ name: string; phone: string } | null>(null);

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: () => api.get<UserProfile>('/profile').then(r => r.data),
  });

  useEffect(() => {
    if (profile && !profileForm) setProfileForm({ name: profile.name, phone: profile.phone ?? '' });
  }, [profile?.id]);

  const patchProfile = useMutation({
    mutationFn: (data: Partial<{ name: string; phone: string | null; preferredLanguage: string | null }>) =>
      api.patch('/profile', data).then(r => r.data),
    onSuccess: () => { toast.success('Profil uložen.'); qc.invalidateQueries({ queryKey: ['profile'] }); },
    onError: () => toast.error('Nepodařilo se uložit profil.'),
  });

  const createAddress = useMutation({
    mutationFn: (data: typeof emptyAddress) => api.post('/profile/addresses', data).then(r => r.data),
    onSuccess: () => { toast.success('Adresa přidána.'); setAddingAddress(false); setAddrForm(emptyAddress); qc.invalidateQueries({ queryKey: ['profile'] }); },
    onError: () => toast.error('Chyba při ukládání adresy.'),
  });

  const updateAddress = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof emptyAddress> }) =>
      api.patch(`/profile/addresses/${id}`, data).then(r => r.data),
    onSuccess: () => { toast.success('Adresa uložena.'); setEditingAddress(null); qc.invalidateQueries({ queryKey: ['profile'] }); },
    onError: () => toast.error('Chyba při ukládání adresy.'),
  });

  const deleteAddress = useMutation({
    mutationFn: (id: string) => api.delete(`/profile/addresses/${id}`),
    onSuccess: () => { toast.success('Adresa smazána.'); qc.invalidateQueries({ queryKey: ['profile'] }); },
    onError: () => toast.error('Chyba při mazání adresy.'),
  });

  const setDefaultAddress = useMutation({
    mutationFn: (id: string) => api.patch(`/profile/addresses/${id}`, { isDefault: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profile'] }); },
  });

  if (isLoading) return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-slate-400">{t('common.loading')}</div>;
  if (!profile) return null;

  const handleSaveProfile = () => {
    if (!profileForm) return;
    patchProfile.mutate({ name: profileForm.name, phone: profileForm.phone || null as string | null });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <User size={22} /> Můj profil
      </h1>

      {/* Jazyk */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={16} className="text-brand-500" />
          <h2 className="font-semibold text-sm text-slate-700 uppercase tracking-wide">Preferovaný jazyk</h2>
        </div>
        <p className="text-xs text-slate-500 mb-3">Aktuality od jednotek Vám budeme zasílat v tomto jazyce.</p>
        <div className="flex gap-2 flex-wrap">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => patchProfile.mutate({ preferredLanguage: lang.code })}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                (profile.preferredLanguage ?? i18n.language ?? 'cs') === lang.code
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'border-slate-300 text-slate-600 hover:border-brand-400'
              }`}
            >
              {lang.label} — {lang.name}
            </button>
          ))}
        </div>
      </div>

      {/* Kontaktní údaje */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-brand-500" />
          <h2 className="font-semibold text-sm text-slate-700 uppercase tracking-wide">Kontaktní údaje</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Jméno a příjmení</label>
            <input
              value={profileForm?.name ?? profile.name}
              onChange={e => setProfileForm(f => ({ ...(f ?? { name: profile.name, phone: profile.phone ?? '' }), name: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
              <Mail size={13} className="text-slate-400" /> Email
            </label>
            <input value={profile.email} disabled className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed" />
            <p className="text-xs text-slate-400 mt-1">Email nelze změnit.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
              <Phone size={13} className="text-slate-400" /> Telefon
            </label>
            <input
              value={profileForm?.phone ?? profile.phone ?? ''}
              onChange={e => setProfileForm(f => ({ ...(f ?? { name: profile.name, phone: '' }), phone: e.target.value }))}
              placeholder="+420 ..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={patchProfile.isPending}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            <Save size={14} />
            {patchProfile.isPending ? 'Ukládám...' : 'Uložit'}
          </button>
        </div>
      </div>

      {/* Doručovací adresy */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-brand-500" />
            <h2 className="font-semibold text-sm text-slate-700 uppercase tracking-wide">Doručovací adresy</h2>
          </div>
          <button
            onClick={() => { setAddingAddress(true); setAddrForm(emptyAddress); }}
            className="flex items-center gap-1.5 text-sm text-brand-600 hover:underline font-medium"
          >
            <Plus size={14} /> Přidat adresu
          </button>
        </div>

        {profile.addresses.length === 0 && !addingAddress && (
          <p className="text-sm text-slate-400 text-center py-4">Žádné uložené adresy.</p>
        )}

        <div className="space-y-3">
          {profile.addresses.map(addr => (
            <div key={addr.id} className={`rounded-xl border p-4 ${addr.isDefault ? 'border-brand-300 bg-brand-50/40' : 'border-slate-200'}`}>
              {editingAddress?.id === addr.id ? (
                <AddressForm
                  form={addrForm}
                  onChange={setAddrForm}
                  onSave={() => updateAddress.mutate({ id: addr.id, data: addrForm })}
                  onCancel={() => setEditingAddress(null)}
                  saving={updateAddress.isPending}
                />
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {addr.label && <p className="text-xs font-semibold text-brand-700 mb-0.5">{addr.label}</p>}
                    <p className="text-sm text-slate-700">{addr.street}</p>
                    <p className="text-sm text-slate-500">{addr.zip} {addr.city}, {COUNTRY_LABELS[addr.country] ?? addr.country}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {addr.isDefault && (
                      <span className="flex items-center gap-1 text-xs text-brand-600 font-medium">
                        <Star size={11} fill="currentColor" /> Výchozí
                      </span>
                    )}
                    {!addr.isDefault && (
                      <button onClick={() => setDefaultAddress.mutate(addr.id)} className="text-xs text-slate-500 hover:text-brand-600 transition-colors">
                        Nastavit výchozí
                      </button>
                    )}
                    <button
                      onClick={() => { setEditingAddress(addr); setAddrForm({ label: addr.label ?? '', street: addr.street, city: addr.city, zip: addr.zip, country: addr.country, isDefault: addr.isDefault }); }}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Upravit
                    </button>
                    <button
                      onClick={() => { if (confirm('Smazat adresu?')) deleteAddress.mutate(addr.id); }}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {addingAddress && (
            <div className="rounded-xl border border-brand-200 p-4 bg-brand-50/30">
              <AddressForm
                form={addrForm}
                onChange={setAddrForm}
                onSave={() => createAddress.mutate(addrForm)}
                onCancel={() => setAddingAddress(false)}
                saving={createAddress.isPending}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddressForm({
  form,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  form: typeof emptyAddress;
  onChange: (f: typeof emptyAddress) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const set = (key: keyof typeof emptyAddress) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...form, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium mb-1 text-slate-600">Označení (volitelně)</label>
          <input value={form.label} onChange={set('label')} placeholder="Domů, Práce…" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium mb-1 text-slate-600">Ulice a číslo</label>
          <input value={form.street} onChange={set('street')} placeholder="Václavské náměstí 1" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-slate-600">Město</label>
          <input value={form.city} onChange={set('city')} placeholder="Praha" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-slate-600">PSČ</label>
          <input value={form.zip} onChange={set('zip')} placeholder="110 00" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-slate-600">Země</label>
          <select value={form.country} onChange={set('country')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            {Object.entries({ CZ: 'Česko', SK: 'Slovensko', DE: 'Německo', AT: 'Rakousko', PL: 'Polsko', UA: 'Ukrajina' }).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 self-end pb-2">
          <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={set('isDefault')} className="accent-brand-600" />
          <label htmlFor="isDefault" className="text-xs text-slate-600 cursor-pointer">Výchozí adresa</label>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onSave} disabled={saving || !form.street || !form.city || !form.zip} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
          {saving ? 'Ukládám...' : 'Uložit'}
        </button>
        <button onClick={onCancel} className="px-4 py-1.5 rounded-lg text-sm border border-slate-300 hover:bg-slate-50">Zrušit</button>
      </div>
    </div>
  );
}
