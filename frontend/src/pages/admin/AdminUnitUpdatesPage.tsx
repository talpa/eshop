import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bell, Send, Users, Pencil, Trash2, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { UnitUpdate, MilitaryUnit } from '../../types';
import { LANGUAGES } from '../../i18n';

type LangCode = 'cs' | 'en' | 'uk' | 'de';

interface UpdateForm {
  title: string; titleEn: string; titleUk: string; titleDe: string;
  content: string; contentEn: string; contentUk: string; contentDe: string;
}

const emptyForm: UpdateForm = {
  title: '', titleEn: '', titleUk: '', titleDe: '',
  content: '', contentEn: '', contentUk: '', contentDe: '',
};

const TITLE_KEY: Record<LangCode, keyof UpdateForm> = { cs: 'title', en: 'titleEn', uk: 'titleUk', de: 'titleDe' };
const CONTENT_KEY: Record<LangCode, keyof UpdateForm> = { cs: 'content', en: 'contentEn', uk: 'contentUk', de: 'contentDe' };

function updateToForm(u: UnitUpdate): UpdateForm {
  return {
    title: u.title, titleEn: u.titleEn ?? '', titleUk: u.titleUk ?? '', titleDe: u.titleDe ?? '',
    content: u.content, contentEn: u.contentEn ?? '', contentUk: u.contentUk ?? '', contentDe: u.contentDe ?? '',
  };
}

function LangTabs({ activeLang, form, onChange }: { activeLang: LangCode; form: UpdateForm; onChange: (l: LangCode) => void }) {
  return (
    <div className="flex gap-0 border-b border-slate-200 mb-4">
      {LANGUAGES.map(lang => {
        const hasContent = lang.code !== 'cs' && (form[TITLE_KEY[lang.code as LangCode]] || form[CONTENT_KEY[lang.code as LangCode]]);
        return (
          <button
            key={lang.code}
            onClick={() => onChange(lang.code as LangCode)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeLang === lang.code ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {lang.label}
            {hasContent && <span className="w-1.5 h-1.5 rounded-full bg-brand-400 inline-block" />}
            {lang.code === 'cs' && <span className="text-xs text-red-400 ml-0.5">*</span>}
          </button>
        );
      })}
    </div>
  );
}

export default function AdminUnitUpdatesPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const qc = useQueryClient();
  const [form, setForm] = useState<UpdateForm>(emptyForm);
  const [activeLang, setActiveLang] = useState<LangCode>('cs');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateForm>(emptyForm);
  const [editLang, setEditLang] = useState<LangCode>('cs');

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

  const invalidate = () => qc.invalidateQueries({ queryKey: ['unit-updates', unitId] });

  const sendMutation = useMutation({
    mutationFn: () => api.post(`/military-units/${unitId}/updates`, {
      title: form.title,
      titleEn: form.titleEn || null, titleUk: form.titleUk || null, titleDe: form.titleDe || null,
      content: form.content,
      contentEn: form.contentEn || null, contentUk: form.contentUk || null, contentDe: form.contentDe || null,
    }).then(r => r.data),
    onSuccess: (update: UnitUpdate) => {
      toast.success(`Aktualita odeslána ${update.recipientCount} dárcům.`);
      setForm(emptyForm);
      invalidate();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Chyba při odesílání'),
  });

  const editMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/military-units/${unitId}/updates/${id}`, {
      title: editForm.title,
      titleEn: editForm.titleEn || null, titleUk: editForm.titleUk || null, titleDe: editForm.titleDe || null,
      content: editForm.content,
      contentEn: editForm.contentEn || null, contentUk: editForm.contentUk || null, contentDe: editForm.contentDe || null,
    }).then(r => r.data),
    onSuccess: () => { toast.success('Aktualita uložena.'); setEditingId(null); invalidate(); },
    onError: () => toast.error('Chyba při ukládání.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/military-units/${unitId}/updates/${id}`),
    onSuccess: () => { toast.success('Aktualita smazána.'); invalidate(); },
    onError: () => toast.error('Chyba při mazání.'),
  });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('cs-CZ', { dateStyle: 'medium', timeStyle: 'short' });

  const setField = (key: keyof UpdateForm, value: string) => setForm(f => ({ ...f, [key]: value }));
  const setEditField = (key: keyof UpdateForm, value: string) => setEditForm(f => ({ ...f, [key]: value }));

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
        {/* New update form */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold mb-4 text-sm text-slate-700 uppercase tracking-wide">Nová aktualita</h2>

          <LangTabs activeLang={activeLang} form={form} onChange={setActiveLang} />

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nadpis {activeLang !== 'cs' && <span className="text-xs text-slate-400 font-normal">(volitelně)</span>}
              </label>
              <input
                value={form[TITLE_KEY[activeLang]]}
                onChange={e => setField(TITLE_KEY[activeLang], e.target.value)}
                placeholder={activeLang === 'cs' ? 'Novinky z výcviku...' : `Title in ${LANGUAGES.find(l => l.code === activeLang)?.name}...`}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Obsah {activeLang !== 'cs' && <span className="text-xs text-slate-400 font-normal">(volitelně)</span>}
              </label>
              <textarea
                value={form[CONTENT_KEY[activeLang]]}
                onChange={e => setField(CONTENT_KEY[activeLang], e.target.value)}
                rows={8}
                placeholder={activeLang === 'cs' ? 'Napište zprávu dárcům jednotky...' : `Content in ${LANGUAGES.find(l => l.code === activeLang)?.name}...`}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
              />
            </div>
            {activeLang === 'cs' && (
              <p className="text-xs text-slate-400">
                Ostatní jazyky jsou volitelné — pokud nejsou vyplněny, obdrží příjemce českou verzi.
              </p>
            )}
            <button
              onClick={() => sendMutation.mutate()}
              disabled={!form.title.trim() || !form.content.trim() || sendMutation.isPending}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              <Send size={15} />
              {sendMutation.isPending ? 'Odesílám...' : 'Uložit a odeslat emailem'}
            </button>
          </div>
        </div>

        {/* History */}
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
                {editingId === u.id ? (
                  <div>
                    <LangTabs activeLang={editLang} form={editForm} onChange={setEditLang} />
                    <div className="space-y-3">
                      <input
                        value={editForm[TITLE_KEY[editLang]]}
                        onChange={e => setEditField(TITLE_KEY[editLang], e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <textarea
                        value={editForm[CONTENT_KEY[editLang]]}
                        onChange={e => setEditField(CONTENT_KEY[editLang], e.target.value)}
                        rows={5}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => editMutation.mutate(u.id)}
                          disabled={!editForm.title.trim() || !editForm.content.trim() || editMutation.isPending}
                          className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                        >
                          <Save size={13} /> {editMutation.isPending ? 'Ukládám...' : 'Uložit'}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-slate-300 hover:bg-slate-50"
                        >
                          <X size={13} /> Zrušit
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-semibold text-sm">{u.title}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Users size={12} /> {u.recipientCount}
                        </span>
                        <button
                          onClick={() => { setEditingId(u.id); setEditForm(updateToForm(u)); setEditLang('cs'); }}
                          className="text-slate-400 hover:text-brand-600 transition-colors"
                          title="Upravit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => { if (confirm('Smazat tuto aktualitu?')) deleteMutation.mutate(u.id); }}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          title="Smazat"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-line line-clamp-3">{u.content}</p>
                    {(u.titleEn || u.titleUk || u.titleDe) && (
                      <div className="flex gap-1.5 mt-2">
                        {u.titleEn && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">EN</span>}
                        {u.titleUk && <span className="text-xs bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded">UK</span>}
                        {u.titleDe && <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">DE</span>}
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-2">{formatDate(u.sentAt)}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
