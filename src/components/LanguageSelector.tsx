import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { Globe, ChevronDown } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = 'compact', className = '' }) => {
  const { language, setLanguage, languages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = languages.find((l) => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        id="btn-language-selector"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-medium transition-colors shadow-sm"
        aria-expanded={isOpen}
      >
        <span className="text-base leading-none">{currentOption.flag}</span>
        {variant === 'full' ? (
          <span className="font-semibold text-slate-100">{currentOption.label}</span>
        ) : (
          <span className="font-mono font-bold uppercase text-slate-200">{currentOption.code}</span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 py-1.5 overflow-hidden ring-1 ring-black/40">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 border-b border-slate-800 flex items-center gap-1">
            <Globe className="w-3 h-3 text-blue-400" />
            <span>IDIOMA / LANGUAGE</span>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {languages.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setLanguage(item.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                  item.code === language
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">{item.flag}</span>
                  <span>{item.label}</span>
                </span>
                <span className="text-[10px] uppercase font-mono opacity-80">{item.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
