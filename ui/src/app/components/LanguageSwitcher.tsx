'use client';

import { useState, useRef, useEffect } from 'react';
import Icon, { faGlobe, faChevronDown } from './Icon';

type Language = {
  code: string;
  label: string;
  flag: string;
};

const languages: Language[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'rw', label: 'Kinyarwanda', flag: '🇷🇼' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(languages[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load saved language from localStorage
    const savedLang = localStorage.getItem('tumanow_language');
    if (savedLang) {
      const lang = languages.find(l => l.code === savedLang);
      if (lang) setSelectedLanguage(lang);
    }
  }, []);

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
    setSelectedLanguage(language);
    localStorage.setItem('tumanow_language', language.code);
    setIsOpen(false);
    // TODO: Implement actual language switching logic
    // This could trigger a context update or router locale change
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

