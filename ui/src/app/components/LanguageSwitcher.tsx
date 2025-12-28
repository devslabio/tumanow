'use client';

import { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import Icon, { faGlobe, faChevronDown } from './Icon';

type Language = {
  code: 'en' | 'rw' | 'fr';
  label: string;
  flag: string;
};

const languages: Language[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'rw', label: 'Kinyarwanda', flag: '🇷🇼' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedLanguage = languages.find(l => l.code === locale) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageChange = (language: Language) => {
    setLocale(language.code);
    setIsOpen(false);
    // Reload page to apply translations
    window.location.reload();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Select language"
      >
        <Icon icon={faGlobe} size="sm" />
        <span className="text-sm font-semibold hidden sm:inline">{selectedLanguage.label}</span>
        <Icon icon={faChevronDown} size="xs" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language)}
              className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-3 ${
                selectedLanguage.code === language.code
                  ? 'bg-primary-50 text-primary font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{language.flag}</span>
              <span>{language.label}</span>
              {selectedLanguage.code === language.code && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

