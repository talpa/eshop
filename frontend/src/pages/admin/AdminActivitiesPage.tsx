import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Activity } from '../../types';

export default function AdminActivitiesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Activity | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ code: '', name: '' });

  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ['activities-admin'],
    queryFn: () => api.get<Activity[]>('/activities/admin').then(r => r.data),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['activities-admin'] });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/activities', data),
    onSuccess: () => { toast.success('Aktivita přidána.'); setCreating(false); setForm({ code: '', name: '' }); invalidate(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Chyba'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof form & { isActive: boolean }> }) =>
      api.patch(`/activities/${id}`, data),
    onSuccess: () => { toast.success('Uloženo.'); setEditing(null); invalidate(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Chyba'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/activities/${id}`),
    onSuccess: () => { toast.success('Aktivita deaktivována.'); invalidate(); },
    onError: () => toast.error('Chyba'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Číselník aktivit</h1>
          <p className="text-sm text-slate-500 mt-1">Platební kódy uváděné v poznámce k platbě a ve zprávě QR kódu.</p>
        </div>
        <button
          onClick={() => { setCreating(true); setEditing(null); setForm({ code: '', name: '' }); }}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Přidat aktivitu
        </button>
      </div>

      {(creating || editing) && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold mb-4">{creating ? 'Nová aktivita' : 'Upravit aktivitu'}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium mb-1">Kód</label>
              <input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                placeholder="2110"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Název</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Podpora vojáků – Arisovy Poletuchy"
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
              {['Kód', 'Název', 'Jednotek', 'Aktivní', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activities?.map(activity => (
              <tr key={activity.id} className={`hover:bg-slate-50 ${!activity.isActive ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <span className="font-mono font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">{activity.code}</span>
                </td>
                <td className="px-4 py-3 text-slate-700">{activity.name}</td>
                <td className="px-4 py-3 text-slate-500">{activity._count?.militaryUnits ?? 0}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${activity.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {activity.isActive ? 'Ano' : 'Ne'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => { setEditing(activity); setCreating(false); setForm({ code: activity.code, name: activity.name }); }}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Upravit
                    </button>
                    {activity.isActive && (
                      <button
                        onClick={() => { if (confirm(`Deaktivovat aktivitu ${activity.code}?`)) deleteMutation.mutate(activity.id); }}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Deaktivovat
                      </button>
                    )}
                    {!activity.isActive && (
                      <button
                        onClick={() => updateMutation.mutate({ id: activity.id, data: { isActive: true } })}
                        className="text-xs text-green-600 hover:underline"
                      >
                        Aktivovat
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
