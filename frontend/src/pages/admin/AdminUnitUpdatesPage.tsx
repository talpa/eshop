import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bell, Send, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { UnitUpdate, MilitaryUnit } from '../../types';

export default function AdminUnitUpdatesPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const { data: units } = useQuery<MilitaryUnit[]>({
    queryKey: ['admin-military-units'],
    queryFn: () => api.get<MilitaryUnit[]>('/military-units/admin').then(r => r.data),
  });

  const { data: updates, isLoading } = useQuery<UnitUpdate[]>({
    queryKey: ['unit-updates', unitId],
    queryFn: () => api.get<UnitUpdate[]>(`/military-units/${unitId}/updates`).then(r => r.data),
    enabled: !!unitId,
  });

  const unit = units?.find(u => u.id === unitId);

  const sendMutation = useMutation({
    mutationFn: () => api.post(`/military-units/${unitId}/updates`, { title, content }).then(r => r.data),
    onSuccess: (update: UnitUpdate) => {
      toast.success(`Aktualita odeslána ${update.recipientCount} dárcům.`);
      setTitle('');
      setContent('');
      qc.invalidateQueries({ queryKey: ['unit-updates', unitId] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Chyba při odesílání'),
  });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('cs-CZ', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/military-units" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell size={22} className="text-brand-600" />
            Aktuality jednotky
          </h1>
          {unit && <p className="text-slate-500 text-sm mt-0.5">{unit.name}</p>}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold mb-4 text-sm text-slate-700 uppercase tracking-wide">Nová aktualita</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nadpis</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Novinky z výcviku..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Obsah</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={8}
                placeholder="Napište zprávu dárcům jednotky..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
              />
            </div>
            <button
              onClick={() => sendMutation.mutate()}
              disabled={!title.trim() || !content.trim() || sendMutation.isPending}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              <Send size={15} />
              {sendMutation.isPending ? 'Odesílám...' : 'Uložit a odeslat emailem'}
            </button>
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-4 text-sm text-slate-700 uppercase tracking-wide">Historie</h2>
          {isLoading && <div className="text-slate-400 text-sm">Načítám...</div>}
          {updates?.length === 0 && (
            <div className="text-slate-400 text-sm bg-white border border-slate-200 rounded-xl p-6 text-center">
              Žádné aktuality zatím nebyly odeslány.
            </div>
          )}
          <div className="space-y-3">
            {updates?.map(u => (
              <div key={u.id} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-sm">{u.title}</p>
                  <span className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
                    <Users size={12} />
                    {u.recipientCount}
                  </span>
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-line line-clamp-3">{u.content}</p>
                <p className="text-xs text-slate-400 mt-2">{formatDate(u.sentAt)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
