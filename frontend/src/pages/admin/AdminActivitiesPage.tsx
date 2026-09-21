import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../../lib/api';
import { Activity, MilitaryUnit } from '../../types';

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-800 px-2 py-1 rounded border border-brand-200 hover:border-brand-400 transition-colors flex-shrink-0">
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Zkopírováno' : 'Kopírovat'}
    </button>
  );
}

function EmbedBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <div className="flex items-start gap-2">
        <pre className="flex-1 bg-slate-900 text-green-300 text-xs p-3 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed">{code}</pre>
        <CopyButton code={code} />
      </div>
    </div>
  );
}

export default function AdminActivitiesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Activity | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', nameEn: '', nameUk: '', nameDe: '' });
  const [widgetsOpen, setWidgetsOpen] = useState(false);

  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ['activities-admin'],
    queryFn: () => api.get<Activity[]>('/activities/admin').then(r => r.data),
  });

  const { data: units } = useQuery<MilitaryUnit[]>({
    queryKey: ['admin-military-units'],
    queryFn: () => api.get<MilitaryUnit[]>('/military-units/admin').then(r => r.data),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['activities-admin'] });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/activities', data),
    onSuccess: () => { toast.success('Aktivita přidána.'); setCreating(false); setForm({ code: '', name: '', nameEn: '', nameUk: '', nameDe: '' }); invalidate(); },
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
          onClick={() => { setCreating(true); setEditing(null); setForm({ code: '', name: '', nameEn: '', nameUk: '', nameDe: '' }); }}
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
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Název EN</label>
              <input
                value={form.nameEn}
                onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))}
                placeholder="Support for soldiers – Arisa's Poletuchy"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Назва UK</label>
              <input
                value={form.nameUk}
                onChange={e => setForm(f => ({ ...f, nameUk: e.target.value }))}
                placeholder="Підтримка військових"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Name DE</label>
              <input
                value={form.nameDe}
                onChange={e => setForm(f => ({ ...f, nameDe: e.target.value }))}
                placeholder="Unterstützung der Soldaten"
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
                      onClick={() => { setEditing(activity); setCreating(false); setForm({ code: activity.code, name: activity.name, nameEn: activity.nameEn || '', nameUk: activity.nameUk || '', nameDe: activity.nameDe || '' }); }}
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

      <div className="mt-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setWidgetsOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
        >
          <div>
            <p className="font-semibold text-sm">Widgety pro integraci</p>
            <p className="text-xs text-slate-500 mt-0.5">Embed kódy pro vložení donation widgetu na externí stránky</p>
          </div>
          {widgetsOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {widgetsOpen && (
          <div className="border-t border-slate-100 p-5 space-y-8">
            <div>
              <p className="text-sm text-slate-600 mb-1">
                Widget je samostatná stránka vhodná pro vložení do libovolného webu přes <code className="bg-slate-100 px-1 rounded">&lt;iframe&gt;</code>.
                Podporuje URL parametry <code className="bg-slate-100 px-1 rounded">?unit=slug</code>,{' '}
                <code className="bg-slate-100 px-1 rounded">?activity=code</code> a{' '}
                <code className="bg-slate-100 px-1 rounded">?amount=500</code>.
              </p>
              <p className="text-xs text-slate-400">Doporučená velikost iframe: 380 × 560 px.</p>
            </div>

            <EmbedBlock
              label="Obecný widget (bez předvolby)"
              code={`<iframe\n  src="${window.location.origin}/widget"\n  width="380"\n  height="560"\n  style="border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.10);"\n  title="Darovat — Česká stopa"\n></iframe>`}
            />

            <EmbedBlock
              label="Obecný widget — React"
              code={`<iframe\n  src="${window.location.origin}/widget"\n  width={380}\n  height={560}\n  style={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}\n  title="Darovat — Česká stopa"\n/>`}
            />

            <EmbedBlock
              label="Widget s předvolenou částkou (1000 Kč)"
              code={`<iframe\n  src="${window.location.origin}/widget?amount=1000"\n  width="380"\n  height="560"\n  style="border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.10);"\n  title="Darovat — Česká stopa"\n></iframe>`}
            />

            {units && units.filter(u => u.isActive).length > 0 && (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Widgety per jednotka</p>
                {units.filter(u => u.isActive).map(unit => (
                  <EmbedBlock
                    key={unit.id}
                    label={unit.name}
                    code={`<iframe\n  src="${window.location.origin}/widget?unit=${unit.slug}"\n  width="380"\n  height="560"\n  style="border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.10);"\n  title="Darovat — ${unit.name}"\n></iframe>`}
                  />
                ))}
              </div>
            )}

            {activities && activities.filter(a => a.isActive).length > 0 && (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Widgety per aktivita</p>
                {activities.filter(a => a.isActive).map(activity => (
                  <EmbedBlock
                    key={activity.id}
                    label={`${activity.code} – ${activity.name}`}
                    code={`<iframe\n  src="${window.location.origin}/widget?activity=${activity.code}"\n  width="380"\n  height="560"\n  style="border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.10);"\n  title="Darovat — ${activity.name}"\n></iframe>`}
                  />
                ))}
              </div>
            )}

            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Příklady kombinace parametrů</p>
              <EmbedBlock
                label="Jednotka + předvolená částka 500 Kč"
                code={`<iframe src="${window.location.origin}/widget?unit=arisovy-poletuchy&amount=500" width="380" height="560" style="border:none;border-radius:12px;" title="Darovat"></iframe>`}
              />
              <EmbedBlock
                label="Aktivita + předvolená částka 1000 Kč"
                code={`<iframe src="${window.location.origin}/widget?activity=2100&amount=1000" width="380" height="560" style="border:none;border-radius:12px;" title="Darovat"></iframe>`}
              />
              <EmbedBlock
                label="Kompletní příklad HTML stránky"
                code={`<!DOCTYPE html>\n<html lang="cs">\n<head>\n  <meta charset="UTF-8">\n  <title>Podpořte Českou stopu</title>\n</head>\n<body>\n  <h2>Podpořte naši jednotku</h2>\n  <iframe\n    src="${window.location.origin}/widget?unit=vas-slug&amount=500"\n    width="380" height="560"\n    style="border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.10);"\n    title="Darovat — Česká stopa"\n  ></iframe>\n</body>\n</html>`}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-brand-50 border border-brand-100 rounded-xl">
              <div>
                <p className="text-sm font-medium text-brand-800">Veřejná dokumentace widgetu</p>
                <p className="text-xs text-brand-600 mt-0.5">Sdílejte s podporovateli — obsahuje živý náhled a všechny příklady</p>
              </div>
              <a
                href="/widget-guide"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-brand-700 hover:text-brand-900 underline flex-shrink-0 ml-4"
              >
                Otevřít stránku →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
