import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, Check, Code2, ExternalLink } from 'lucide-react';
import { api } from '../../lib/api';
import { MilitaryUnit, Activity } from '../../types';

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-slate-300 hover:border-brand-400 text-slate-600 hover:text-brand-700 transition-colors flex-shrink-0"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Zkopírováno' : 'Kopírovat'}
    </button>
  );
}

function CodeBlock({ label, code, lang = 'html' }: { label?: string; code: string; lang?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>}
      <div className="flex items-start gap-2">
        <pre className={`flex-1 bg-slate-900 text-sm p-4 rounded-xl overflow-x-auto whitespace-pre leading-relaxed ${lang === 'html' ? 'text-green-300' : 'text-sky-300'}`}>{code}</pre>
        <CopyButton code={code} />
      </div>
    </div>
  );
}

const IFRAME_STYLE = `border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.10);`;

function iframeHtml(params: string, title = 'Darovat — Česká stopa') {
  const origin = window.location.origin;
  const src = `${origin}/widget${params ? `?${params}` : ''}`;
  return `<iframe\n  src="${src}"\n  width="380"\n  height="560"\n  style="${IFRAME_STYLE}"\n  title="${title}"\n></iframe>`;
}

function iframeReact(params: string, title = 'Darovat — Česká stopa') {
  const origin = window.location.origin;
  const src = `${origin}/widget${params ? `?${params}` : ''}`;
  return `<iframe\n  src="${src}"\n  width={380}\n  height={560}\n  style={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,.1)' }}\n  title="${title}"\n/>`;
}

export default function WidgetGuidePage() {
  const [previewParams, setPreviewParams] = useState('');
  const [activeTab, setActiveTab] = useState<'html' | 'react'>('html');

  const { data: units } = useQuery<MilitaryUnit[]>({
    queryKey: ['military-units'],
    queryFn: () => api.get<MilitaryUnit[]>('/military-units').then(r => r.data),
  });

  const { data: activities } = useQuery<Activity[]>({
    queryKey: ['activities'],
    queryFn: () => api.get<Activity[]>('/activities').then(r => r.data),
  });

  const origin = window.location.origin;

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-10">
      <div className="flex items-start gap-4 mb-8">
        <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Code2 size={22} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Widget pro vývojáře</h1>
          <p className="text-slate-500 mt-1">
            Vložte formulář pro přijímání darů přímo na váš web — stačí jeden řádek HTML.
          </p>
        </div>
      </div>

      <div className="grid xl:grid-cols-[320px_400px_1fr] lg:grid-cols-[380px_1fr] gap-10 items-start">

        {/* Levý sloupec: parametry + živý náhled */}
        <div className="space-y-8">

          {/* Parametry */}
          <section>
            <h2 className="text-lg font-semibold mb-3">URL parametry</h2>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Parametr', 'Příklad'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {[
                    { param: 'unit', desc: 'Slug jednotky', ex: 'unit=arisovy-poletuchy' },
                    { param: 'activity', desc: 'Kód aktivity', ex: 'activity=2110' },
                    { param: 'amount', desc: 'Výše daru v Kč', ex: 'amount=500' },
                  ].map(r => (
                    <tr key={r.param} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-mono text-brand-700 font-medium">{r.param}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-500">{r.ex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-400 mt-2">Kombinace: <code className="bg-slate-100 px-1 py-0.5 rounded">?unit=slug&amount=500</code></p>
          </section>

          {/* Dostupné hodnoty */}
          {(units || activities) && (
            <section>
              <h2 className="text-lg font-semibold mb-3">Dostupné hodnoty</h2>
              <div className="space-y-4">
                {units && units.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Jednotky <code className="font-mono normal-case text-slate-400">unit=</code></p>
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <tbody className="divide-y divide-slate-50">
                          {units.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50">
                              <td className="px-3 py-2 text-slate-700">{u.name}</td>
                              <td className="px-3 py-2 font-mono text-brand-700">{u.slug}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {activities && activities.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Aktivity <code className="font-mono normal-case text-slate-400">activity=</code></p>
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <tbody className="divide-y divide-slate-50">
                          {activities.map(a => (
                            <tr key={a.id} className="hover:bg-slate-50">
                              <td className="px-3 py-2 font-mono text-brand-700 font-medium w-12">{a.code}</td>
                              <td className="px-3 py-2 text-slate-600">{a.name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Střední sloupec: živý náhled */}
        <div className="space-y-4">
          <section>
            <h2 className="text-lg font-semibold mb-3">Živý náhled</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => setPreviewParams('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${previewParams === '' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}
              >
                Obecný
              </button>
              {units?.slice(0, 3).map(u => (
                <button key={u.id}
                  onClick={() => setPreviewParams(`unit=${u.slug}`)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${previewParams === `unit=${u.slug}` ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}
                >
                  {u.name}
                </button>
              ))}
              {activities?.slice(0, 2).map(a => (
                <button key={a.id}
                  onClick={() => setPreviewParams(`activity=${a.code}`)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${previewParams === `activity=${a.code}` ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}
                >
                  {a.code}
                </button>
              ))}
              <button
                onClick={() => setPreviewParams('amount=1000')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${previewParams === 'amount=1000' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}
              >
                amount=1000
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              <code className="bg-slate-100 px-1 py-0.5 rounded">{origin}/widget{previewParams ? `?${previewParams}` : ''}</code>
            </p>
            <iframe
              key={previewParams}
              src={`${origin}/widget${previewParams ? `?${previewParams}` : ''}`}
              width={380}
              height={560}
              style={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}
              title="Náhled widgetu"
            />
          </section>
        </div>

        {/* Pravý sloupec: kódy */}
        <div className="space-y-8">

          {/* Základní embed */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Základní vložení</h2>
            <div className="flex gap-2 mb-3">
              {(['html', 'react'] as const).map(t => (
                <button key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${activeTab === t ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}
                >
                  {t === 'html' ? 'HTML' : 'React / Next.js'}
                </button>
              ))}
            </div>
            {activeTab === 'html' ? (
              <CodeBlock code={iframeHtml('')} lang="html" />
            ) : (
              <CodeBlock code={iframeReact('')} lang="jsx" />
            )}
          </section>

          {/* S parametry */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Příklady s parametry</h2>
            <div className="space-y-5">
              {units && units.length > 0 && (
                <CodeBlock
                  label={`Předvolená jednotka — ${units[0].name}`}
                  code={iframeHtml(`unit=${units[0].slug}`, `Darovat — ${units[0].name}`)}
                />
              )}
              {activities && activities.length > 0 && (
                <CodeBlock
                  label={`Předvolená aktivita — ${activities[0].code}`}
                  code={iframeHtml(`activity=${activities[0].code}`, activities[0].name)}
                />
              )}
              <CodeBlock
                label="Předvolená částka 500 Kč"
                code={iframeHtml('amount=500')}
              />
              {units && units.length > 0 && (
                <CodeBlock
                  label="Jednotka + částka 1000 Kč"
                  code={iframeHtml(`unit=${units[0].slug}&amount=1000`, `Darovat — ${units[0].name}`)}
                />
              )}
              {activities && activities.length > 0 && (
                <CodeBlock
                  label="Aktivita + částka 500 Kč"
                  code={iframeHtml(`activity=${activities[0].code}&amount=500`, activities[0].name)}
                />
              )}
            </div>
          </section>

          {/* Kompletní HTML stránka */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Kompletní HTML stránka</h2>
            <CodeBlock
              code={`<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Podpořte Českou stopu</title>
  <style>
    body { font-family: sans-serif; display: flex;
           flex-direction: column; align-items: center;
           padding: 2rem; background: #f8fafc; }
    h2 { margin-bottom: 1.5rem; color: #1e293b; }
  </style>
</head>
<body>
  <h2>Podpořte naši jednotku</h2>
  <iframe
    src="${origin}/widget?unit=vas-slug&amount=500"
    width="380"
    height="560"
    style="${IFRAME_STYLE}"
    title="Darovat — Česká stopa"
  ></iframe>
</body>
</html>`}
              lang="html"
            />
          </section>

          <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
            <ExternalLink size={16} className="text-slate-400 flex-shrink-0" />
            <span>
              Chcete darovat přímo? Použijte stránku{' '}
              <a href="/donate" className="text-brand-600 hover:underline font-medium">Darovat přímo</a>
              {' '}bez potřeby embeddingu.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
