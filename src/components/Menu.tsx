import { useRef, useEffect } from 'react';
import { Menu as MenuIcon, X, Globe, HardDrive, Sun, Moon, Monitor, Calendar } from 'lucide-react';
import { useI18n } from '../i18n/context';
import { useTheme } from '../contexts/ThemeContext';
import type { Language } from '../i18n/locales';
import type { Year } from '../types';

interface MenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
  currentYear: Year;
  onYearChange: (year: Year) => void;
}

export const Menu = ({ isOpen, onToggle, onExport, onImport, onReset, currentYear, onYearChange }: MenuProps) => {
  const { language, setLanguage, t } = useI18n();
  const { theme, setTheme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const languages: { code: Language; label: string }[] = [
    { code: 'de', label: t('german') },
    { code: 'fr', label: t('french') },
    { code: 'en', label: t('english') },
    { code: 'it', label: t('italian') },
  ];

  const yearLabels: Record<Year, string> = {
    1: t('year1'),
    2: t('year2'),
    3: t('year3'),
  };

  const themes: { value: 'light' | 'dark' | 'system'; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: t('themeLight'), icon: Sun },
    { value: 'dark', label: t('themeDark'), icon: Moon },
    { value: 'system', label: t('themeSystem'), icon: Monitor },
  ];

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        if (isOpen) {
          onToggle();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  useEffect(() => {
    // Prevent body scroll when menu is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Menu Button */}
      <button
        onClick={onToggle}
        className="p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        aria-label={t('menu')}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MenuIcon className="w-6 h-6" />
        )}
      </button>

      {/* Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-40" onClick={onToggle} />
      )}

      {/* Menu Panel */}
      <div
        ref={menuRef}
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } overflow-y-auto`}
      >
        <div className="p-6">
          {/* Menu Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('settings')}</h2>
            <button
              onClick={onToggle}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Year Selection */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('currentYear')}</h3>
            </div>
            <div className="flex gap-2">
              {([1, 2, 3] as Year[]).map((year) => {
                const isDisabled = year !== 1;
                return (
                  <button
                    key={year}
                    onClick={() => {
                      if (!isDisabled) {
                        onYearChange(year);
                        onToggle();
                      }
                    }}
                    disabled={isDisabled}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isDisabled
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : currentYear === year
                        ? 'bg-blue-600 dark:bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {yearLabels[year]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Selection */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('theme')}</h3>
            </div>
            <div className="space-y-2">
              {themes.map((themeOption) => {
                const Icon = themeOption.icon;
                return (
                  <button
                    key={themeOption.value}
                    onClick={() => setTheme(themeOption.value)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors flex items-center gap-3 ${
                      theme === themeOption.value
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <div className="font-medium">{themeOption.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language Selection */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('language')}</h3>
            </div>
            <div className="space-y-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                    language === lang.code
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="font-medium">{lang.label}</div>
                  {language === lang.code && (
                    <div className="text-xs mt-1 text-blue-700 dark:text-blue-300">
                      {lang.code === 'de' && 'Standard'}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Data Management */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <HardDrive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('data')}</h3>
            </div>
            <div className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onImport(file);
                    // Reset input so the same file can be selected again
                    e.target.value = '';
                  }
                }}
              />
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                className="w-full text-left px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
              >
                <div className="font-medium">{t('import')}</div>
              </button>
              <button
                onClick={onExport}
                className="w-full text-left px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
              >
                <div className="font-medium">{t('export')}</div>
              </button>
              <button
                onClick={onReset}
                className="w-full text-left px-4 py-3 rounded-lg border-2 border-red-200 dark:border-red-900 hover:border-red-300 dark:hover:border-red-700 text-red-700 dark:text-red-400 transition-colors"
              >
                <div className="font-medium">{t('reset')}</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

