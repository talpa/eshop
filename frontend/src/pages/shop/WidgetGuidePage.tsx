import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, Check, Code2, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
      {copied ? '✓' : <Copy size={12} />}
    </button>
  );
}

function CodeBlock({ label, code, lang = 'html' }: { label?: string; code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-1.5">
      {label && <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>}
      <div className="flex items-start gap-2">
        <pre className={`flex-1 bg-slate-900 text-sm p-4 rounded-xl overflow-x-auto whitespace-pre leading-relaxed ${lang === 'html' ? 'text-green-300' : 'text-sky-300'}`}>{code}</pre>
        <button
          onClick={() => navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-slate-300 hover:border-brand-400 text-slate-600 hover:text-brand-700 transition-colors flex-shrink-0"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? '✓' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

const IFRAME_STYLE = `border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.10);`;

function iframeHtml(path: string, params: string, title = 'Darovat — Česká stopa') {
  const origin = window.location.origin;
  const src = `${origin}${path}${params ? `?${params}` : ''}`;
  return `<iframe\n  src="${src}"\n  width="380"\n  height="560"\n  style="${IFRAME_STYLE}"\n  title="${title}"\n></iframe>`;
}

function iframeReact(path: string, params: string, title = 'Darovat — Česká stopa') {
  const origin = window.location.origin;
  const src = `${origin}${path}${params ? `?${params}` : ''}`;
  return `<iframe\n  src="${src}"\n  width={380}\n  height={560}\n  style={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,.1)' }}\n  title="${title}"\n/>`;
}

type WidgetRoute = '/widget' | '/widget/unit' | '/widget/activity';

export default function WidgetGuidePage() {
  const [previewRoute, setPreviewRoute] = useState<WidgetRoute>('/widget');
  const [previewParams, setPreviewParams] = useState('');
  const [activeTab, setActiveTab] = useState<'html' | 'react'>('html');
  const { t } = useTranslation();

  const { data: units } = useQuery<MilitaryUnit[]>({
    queryKey: ['military-units'],
    queryFn: () => api.get<MilitaryUnit[]>('/military-units').then(r => r.data),
  });

  const { data: activities } = useQuery<Activity[]>({
    queryKey: ['activities'],
    queryFn: () => api.get<Activity[]>('/activities').then(r => r.data),
  });

  const origin = window.location.origin;
  const previewSrc = `${origin}${previewRoute}${previewParams ? `?${previewParams}` : ''}`;

  const paramRows = [
    { param: 'unit', for: '/unit', descKey: 'widgetGuide.params.rows.unit' },
    { param: 'default-unit', for: '/unit', descKey: 'widgetGuide.params.rows.defaultUnit' },
    { param: 'activity', for: '/activity', descKey: 'widgetGuide.params.rows.activity' },
    { param: 'default-activity', for: '/activity', descKey: 'widgetGuide.params.rows.defaultActivity' },
    { param: 'amount', for: t('common.loading') === 'Loading...' ? 'all' : 'vše', descKey: 'widgetGuide.params.rows.amount' },
    { param: 'title', for: t('common.loading') === 'Loading...' ? 'all' : 'vše', descKey: 'widgetGuide.params.rows.title' },
    { param: 'lang', for: t('common.loading') === 'Loading...' ? 'all' : 'vše', descKey: 'widgetGuide.params.rows.lang' },
  ] as const;

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-10">
      <div className="flex items-start gap-4 mb-8">
        <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Code2 size={22} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{t('widgetGuide.title')}</h1>
          <p className="text-slate-500 mt-1">{t('widgetGuide.subtitle')}</p>
        </div>
      </div>

      {/* Widget variants */}
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {[
          { route: '/widget' as WidgetRoute, title: '/widget', descKey: 'widgetGuide.variants.general', color: 'border-slate-300' },
          { route: '/widget/unit' as WidgetRoute, title: '/widget/unit', descKey: 'widgetGuide.variants.unit', color: 'border-brand-400' },
          { route: '/widget/activity' as WidgetRoute, title: '/widget/activity', descKey: 'widgetGuide.variants.activity', color: 'border-brand-400' },
        ].map(v => (
          <div key={v.route} className={`bg-white border-2 ${v.color} rounded-xl p-5`}>
            <code className="text-sm font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded">{v.route}</code>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">{t(v.descKey)}</p>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-[320px_400px_1fr] lg:grid-cols-[380px_1fr] gap-10 items-start">

        {/* Left: params + values */}
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-3">{t('widgetGuide.params.title')}</h2>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {[t('widgetGuide.params.colParam'), t('widgetGuide.params.colFor'), t('widgetGuide.params.colDesc')].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {[
                    { param: 'unit', for: '/unit', desc: t('widgetGuide.params.rows.unit') },
                    { param: 'default-unit', for: '/unit', desc: t('widgetGuide.params.rows.defaultUnit') },
                    { param: 'activity', for: '/activity', desc: t('widgetGuide.params.rows.activity') },
                    { param: 'default-activity', for: '/activity', desc: t('widgetGuide.params.rows.defaultActivity') },
                    { param: 'amount', for: 'vše', desc: t('widgetGuide.params.rows.amount') },
                    { param: 'title', for: 'vše', desc: t('widgetGuide.params.rows.title') },
                    { param: 'lang', for: 'vše', desc: t('widgetGuide.params.rows.lang') },
                  ].map(r => (
                    <tr key={r.param} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-mono text-brand-700 font-medium">{r.param}</td>
                      <td className="px-3 py-2.5 font-mono text-slate-400">{r.for}</td>
                      <td className="px-3 py-2.5 text-slate-600">{r.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {(units || activities) && (
            <section>
              <h2 className="text-lg font-semibold mb-3">{t('widgetGuide.values.title')}</h2>
              <div className="space-y-4">
                {units && units.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('widgetGuide.values.units')} <code className="font-mono normal-case text-slate-400">unit=</code></p>
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
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('widgetGuide.values.activities')} <code className="font-mono normal-case text-slate-400">activity=</code></p>
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

        {/* Middle: live preview */}
        <div className="space-y-4">
          <section>
            <h2 className="text-lg font-semibold mb-3">{t('widgetGuide.preview.title')}</h2>

            <div className="flex gap-1.5 mb-3 flex-wrap">
              {(['/widget', '/widget/unit', '/widget/activity'] as WidgetRoute[]).map(r => (
                <button key={r}
                  onClick={() => { setPreviewRoute(r); setPreviewParams(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${previewRoute === r ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              <button
                onClick={() => setPreviewParams('')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${previewParams === '' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}
              >
                {t('widgetGuide.preview.noParams')}
              </button>
              {previewRoute !== '/widget/activity' && units?.slice(0, 2).map(u => (
                <button key={u.id}
                  onClick={() => setPreviewParams(`unit=${u.slug}`)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${previewParams === `unit=${u.slug}` ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}
                >
                  {u.slug}
                </button>
              ))}
              {previewRoute !== '/widget/unit' && activities?.slice(0, 2).map(a => (
                <button key={a.id}
                  onClick={() => setPreviewParams(`activity=${a.code}`)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${previewParams === `activity=${a.code}` ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}
                >
                  {a.code}
                </button>
              ))}
              <button
                onClick={() => setPreviewParams('amount=1000')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${previewParams === 'amount=1000' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}
              >
                amount=1000
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4 break-all">
              <code className="bg-slate-100 px-1 py-0.5 rounded">{previewSrc}</code>
            </p>
            <iframe
              key={previewSrc}
              src={previewSrc}
              width={380}
              height={560}
              style={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}
              title={t('widgetGuide.preview.title')}
            />
          </section>
        </div>

        {/* Right: code examples */}
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-3">{t('widgetGuide.embed.title')}</h2>
            <div className="flex gap-2 mb-3">
              {(['html', 'react'] as const).map(tab => (
                <button key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${activeTab === tab ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}
                >
                  {tab === 'html' ? 'HTML' : 'React / Next.js'}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              <CodeBlock label={t('widgetGuide.embed.labelGeneral')} code={activeTab === 'html' ? iframeHtml('/widget', '') : iframeReact('/widget', '')} lang={activeTab === 'html' ? 'html' : 'jsx'} />
              <CodeBlock label={t('widgetGuide.embed.labelUnit')} code={activeTab === 'html' ? iframeHtml('/widget/unit', '') : iframeReact('/widget/unit', '')} lang={activeTab === 'html' ? 'html' : 'jsx'} />
              <CodeBlock label={t('widgetGuide.embed.labelActivity')} code={activeTab === 'html' ? iframeHtml('/widget/activity', '') : iframeReact('/widget/activity', '')} lang={activeTab === 'html' ? 'html' : 'jsx'} />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">{t('widgetGuide.examples.title')}</h2>
            <div className="space-y-5">
              {units && units.length > 0 && (
                <CodeBlock
                  label={t('widgetGuide.examples.fixedUnit', { name: units[0].name })}
                  code={iframeHtml('/widget/unit', `unit=${units[0].slug}`, `Darovat — ${units[0].name}`)}
                />
              )}
              {units && units.length > 0 && (
                <CodeBlock
                  label={t('widgetGuide.examples.defaultUnit', { name: units[0].name })}
                  code={iframeHtml('/widget/unit', `default-unit=${units[0].slug}`, `Darovat — ${units[0].name}`)}
                />
              )}
              {units && units.length > 0 && (
                <CodeBlock
                  label={t('widgetGuide.examples.fixedUnitAmount', { name: units[0].name })}
                  code={iframeHtml('/widget/unit', `unit=${units[0].slug}&amount=1000`, `Darovat — ${units[0].name}`)}
                />
              )}
              {activities && activities.length > 0 && (
                <CodeBlock
                  label={t('widgetGuide.examples.fixedActivity', { code: activities[0].code, name: activities[0].name })}
                  code={iframeHtml('/widget/activity', `activity=${activities[0].code}`, activities[0].name)}
                />
              )}
              {activities && activities.length > 0 && (
                <CodeBlock
                  label={t('widgetGuide.examples.defaultActivity', { code: activities[0].code })}
                  code={iframeHtml('/widget/activity', `default-activity=${activities[0].code}`)}
                />
              )}
              {activities && activities.length > 0 && (
                <CodeBlock
                  label={t('widgetGuide.examples.fixedActivityAmount', { code: activities[0].code })}
                  code={iframeHtml('/widget/activity', `activity=${activities[0].code}&amount=500`, activities[0].name)}
                />
              )}
              <CodeBlock
                label={t('widgetGuide.examples.customTitle')}
                code={iframeHtml('/widget/unit', `title=Podpořte+naši+jednotku`)}
              />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">{t('widgetGuide.fullPage.title')}</h2>
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
    src="${origin}/widget/unit?unit=vas-slug&amount=500"
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
              {t('widgetGuide.donateDirectly')}{' '}
              <a href="/donate" className="text-brand-600 hover:underline font-medium">{t('widgetGuide.donatePage')}</a>
              {' '}{t('widgetGuide.donateWithoutEmbed')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
