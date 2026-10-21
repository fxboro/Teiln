import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  className?: string;
  showIcon?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ 
  className = '', 
  showIcon = true 
}) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div 
      className={`inline-flex items-center gap-0.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner ${className}`}
      role="group"
      aria-label="Language selection / Sprachauswahl"
    >
      {showIcon && (
        <span className="pl-1 pr-1 text-slate-400 hidden sm:inline-flex items-center" aria-hidden="true">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
        </span>
      )}
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
          language === 'en'
            ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/80 font-extrabold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        aria-pressed={language === 'en'}
        title="Switch to English"
        aria-label="English"
      >
        <span className="text-[11px] leading-none" role="img" aria-hidden="true">🇬🇧</span>
        <span>EN</span>
      </button>
      <button
        type="button"
        onClick={() => setLanguage('de')}
        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
          language === 'de'
            ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/80 font-extrabold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        aria-pressed={language === 'de'}
        title="Zu Deutsch wechseln"
        aria-label="Deutsch"
      >
        <span className="text-[11px] leading-none" role="img" aria-hidden="true">🇩🇪</span>
        <span>DE</span>
      </button>
    </div>
  );
};
