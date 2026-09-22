import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Mail, Phone, Globe, ShoppingBag, ChevronDown, ChevronUp, Save, MapPin, UserPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import { LANGUAGES } from '../../i18n';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  preferredLanguage?: string | null;
  role: 'ADMIN' | 'CUSTOMER';
  createdAt: string;
  _count: { orders: number };
}

interface UserOrder {
  id: string;
  status: string;
  totalCzk: number | string;
  donationAmount: number | string;
  variableSymbol: string;
  createdAt: string;
  customerName: string;
  militaryUnit?: { name: string; slug: string } | null;
}

interface UserAddr {
  id: string;
  label?: string | null;
  street: string;
  city: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

interface AdminUserDetail {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  preferredLanguage?: string | null;
  role: 'ADMIN' | 'CUSTOMER';
  createdAt: string;
  addresses: UserAddr[];
  orders: UserOrder[];
}

const COUNTRY_LABELS: Record<string, string> = { CZ: 'Česko', SK: 'Slovensko', DE: 'Německo', AT: 'Rakousko', PL: 'Polsko', UA: 'Ukrajina' };

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Čeká', color: 'bg-amber-50 text-amber-700' },
  PAID: { label: 'Zaplaceno', color: 'bg-green-50 text-green-700' },
  PROCESSING: { label: 'Zpracovává se', color: 'bg-blue-50 text-blue-700' },
  SHIPPED: { label: 'Odesláno', color: 'bg-violet-50 text-violet-700' },
  DELIVERED: { label: 'Doručeno', color: 'bg-slate-50 text-slate-700' },
  CANCELLED: { label: 'Zrušeno', color: 'bg-red-50 text-red-600' },
};

interface EditForm { name: string; phone: string; preferredLanguage: string; }
interface CreateForm { email: string; name: string; password: string; role: 'ADMIN' | 'CUSTOMER'; }
const emptyCreate: CreateForm = { email: '', name: '', password: '', role: 'CUSTOMER' };

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editForms, setEditForms] = useState<Record<string, EditForm>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreate);

  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin-users'],
    queryFn: () => api.get<AdminUser[]>('/admin/users').then(r => r.data),
  });

  const { data: detail } = useQuery<AdminUserDetail>({
    queryKey: ['admin-user-detail', expandedId],
    queryFn: () => api.get<AdminUserDetail>(`/admin/users/${expandedId}`).then(r => r.data),
    enabled: !!expandedId,
  });

  useEffect(() => {
    if (detail && !editForms[detail.id]) {
      setEditForms(f => ({
        ...f,
        [detail.id]: { name: detail.name, phone: detail.phone ?? '', preferredLanguage: detail.preferredLanguage ?? 'cs' },
      }));
    }
  }, [detail?.id]);

  const createUser = useMutation({
    mutationFn: (data: CreateForm) => api.post('/auth/admin/create-user', data).then(r => r.data),
    onSuccess: () => {
      toast.success('Uživatel vytvořen.');
      setShowCreate(false);
      setCreateForm(emptyCreate);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Chyba při vytváření uživatele.'),
  });

  const patchUser = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/admin/users/${id}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('Uloženo.');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-user-detail', expandedId] });
    },
    onError: () => toast.error('Chyba při ukládání.'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users size={22} className="text-brand-600" />
          <h1 className="text-2xl font-bold">Uživatelé</h1>
          {users && <span className="text-sm text-slate-400 ml-1">({users.length})</span>}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <UserPlus size={15} /> Vytvořit uživatele
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border border-brand-200 rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">Nový uživatel</h3>
            <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-slate-600">Jméno</label>
              <input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-slate-600">Email</label>
              <input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-slate-600">Heslo</label>
              <input type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="min. 6 znaků" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-slate-600">Role</label>
              <select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value as 'ADMIN' | 'CUSTOMER' }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="CUSTOMER">Dárce</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => createUser.mutate(createForm)}
              disabled={createUser.isPending || !createForm.email || !createForm.name || createForm.password.length < 6}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              <UserPlus size={14} /> {createUser.isPending ? 'Ukládám...' : 'Vytvořit'}
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm border border-slate-300 hover:bg-slate-50">Zrušit</button>
          </div>
        </div>
      )}

      {isLoading && <div className="text-slate-400">Načítám...</div>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Jméno / Email', 'Telefon', 'Jazyk', 'Role', 'Darů', 'Registrace', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users?.map(user => (
              <>
                <tr
                  key={user.id}
                  className={`hover:bg-slate-50 cursor-pointer ${expandedId === user.id ? 'bg-slate-50' : ''}`}
                  onClick={() => setExpandedId(prev => prev === user.id ? null : user.id)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Mail size={10} />{user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{user.phone || <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-3">
                    {user.preferredLanguage
                      ? <span className="flex items-center gap-1 text-xs"><Globe size={11} className="text-brand-500" />{user.preferredLanguage.toUpperCase()}</span>
                      : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.role === 'ADMIN' ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'}`}>
                      {user.role === 'ADMIN' ? 'Admin' : 'Dárce'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{user._count.orders}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{new Date(user.createdAt).toLocaleDateString('cs-CZ')}</td>
                  <td className="px-4 py-3 text-slate-400">{expandedId === user.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</td>
                </tr>

                {expandedId === user.id && detail?.id === user.id && (
                  <tr key={`${user.id}-detail`}>
                    <td colSpan={7} className="px-4 py-5 bg-slate-50/70 border-t border-slate-100">
                      <div className="grid lg:grid-cols-2 gap-6">

                        {/* Edit form */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-sm text-slate-700">Upravit profil</h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                              <label className="block text-xs font-medium mb-1 text-slate-600">Jméno</label>
                              <input
                                value={editForms[user.id]?.name ?? ''}
                                onChange={e => setEditForms(f => ({ ...f, [user.id]: { ...f[user.id], name: e.target.value } }))}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1 text-slate-600 flex items-center gap-1"><Phone size={10} /> Telefon</label>
                              <input
                                value={editForms[user.id]?.phone ?? ''}
                                onChange={e => setEditForms(f => ({ ...f, [user.id]: { ...f[user.id], phone: e.target.value } }))}
                                placeholder="+420..."
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1 text-slate-600 flex items-center gap-1"><Globe size={10} /> Jazyk emailů</label>
                              <select
                                value={editForms[user.id]?.preferredLanguage ?? 'cs'}
                                onChange={e => setEditForms(f => ({ ...f, [user.id]: { ...f[user.id], preferredLanguage: e.target.value } }))}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                              >
                                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label} — {l.name}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => patchUser.mutate({
                                id: user.id,
                                data: {
                                  name: editForms[user.id].name,
                                  phone: editForms[user.id].phone || null,
                                  preferredLanguage: editForms[user.id].preferredLanguage,
                                },
                              })}
                              disabled={patchUser.isPending}
                              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                            >
                              <Save size={13} /> Uložit
                            </button>
                            {user.role === 'CUSTOMER' && (
                              <button
                                onClick={() => { if (confirm(`Povýšit ${user.name} na admina?`)) patchUser.mutate({ id: user.id, data: { role: 'ADMIN' } }); }}
                                className="px-3 py-1.5 rounded-lg text-xs border border-slate-300 hover:bg-slate-100 text-slate-600"
                              >
                                Povýšit na admina
                              </button>
                            )}
                          </div>

                          <div>
                            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                              <MapPin size={11} /> Adresy
                            </h4>
                            {detail.addresses.length === 0
                              ? <p className="text-xs text-slate-400">Žádné uložené adresy.</p>
                              : (
                                <div className="space-y-2">
                                  {detail.addresses.map(addr => (
                                    <div key={addr.id} className={`text-xs rounded-lg p-3 border ${addr.isDefault ? 'border-brand-200 bg-brand-50/40' : 'border-slate-200 bg-white'}`}>
                                      {addr.label && <p className="font-semibold text-brand-700 mb-0.5">{addr.label}</p>}
                                      <p>{addr.street}, {addr.zip} {addr.city}, {COUNTRY_LABELS[addr.country] ?? addr.country}</p>
                                    </div>
                                  ))}
                                </div>
                              )
                            }
                          </div>
                        </div>

                        {/* Orders */}
                        <div>
                          <h3 className="font-semibold text-sm text-slate-700 flex items-center gap-1.5 mb-3">
                            <ShoppingBag size={14} /> Objednávky ({detail.orders.length})
                          </h3>
                          {detail.orders.length === 0 && <p className="text-xs text-slate-400">Žádné objednávky.</p>}
                          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                            {detail.orders.map(order => {
                              const st = STATUS_LABELS[order.status] ?? { label: order.status, color: 'bg-slate-100 text-slate-600' };
                              return (
                                <div key={order.id} className="flex items-center justify-between gap-2 text-xs bg-white border border-slate-200 rounded-lg px-3 py-2">
                                  <div>
                                    <p className="font-mono text-slate-500">{order.variableSymbol}</p>
                                    {order.militaryUnit && <p className="text-slate-400">{order.militaryUnit.name}</p>}
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-brand-600">{formatPrice(order.donationAmount)}</p>
                                    <span className={`px-1.5 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                                  </div>
                                  <p className="text-slate-400 flex-shrink-0">{new Date(order.createdAt).toLocaleDateString('cs-CZ')}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
