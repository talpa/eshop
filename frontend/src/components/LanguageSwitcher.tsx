import { useTranslation } from 'react-i18next';
import { LANGUAGES, setLanguage, LangCode } from '../i18n';

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation();
  const current = i18n.language as LangCode;

  return (
    <div className={`flex items-center gap-0.5 ${compact ? '' : 'gap-1'}`}>
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLanguage(code)}
          className={`text-xs font-semibold px-1.5 py-0.5 rounded transition-colors ${
            current === code
              ? 'bg-ua-yellow text-brand-900'
              : 'text-brand-300 hover:text-white'
          }`}
          title={LANGUAGES.find(l => l.code === code)?.name}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
