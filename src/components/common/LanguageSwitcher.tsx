import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/i18n';

/**
 * Segmented EN / PT / ES language toggle. Persists the choice (i18next
 * localStorage detector) so it sticks across sessions and devices-per-origin.
 */
const LanguageSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const { i18n, t } = useTranslation();
  const current = (i18n.resolvedLanguage || i18n.language || 'en').slice(0, 2);

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <Languages className="h-3.5 w-3.5" />
        {t('language.label')}
      </div>
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
        {SUPPORTED_LANGUAGES.map((lng) => {
          const active = current === lng.code;
          return (
            <button
              key={lng.code}
              onClick={() => i18n.changeLanguage(lng.code)}
              className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 active:bg-slate-200/60'
              }`}
              aria-pressed={active}
            >
              {lng.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
