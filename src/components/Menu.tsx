import { useRef, useEffect, type ReactNode } from 'react';
import { Menu as MenuIcon, X, Sun, Moon, Monitor, Upload, Download, RotateCcw } from 'lucide-react';
import { useI18n } from '../i18n/context';
import { useTheme } from '../contexts/ThemeContext';
import type { Language } from '../i18n/locales';

interface MenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
  cloudSlot?: ReactNode;
}

export const Menu = ({ isOpen, onToggle, onExport, onImport, onReset, cloudSlot }: MenuProps) => {
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
        className="btn btn-icon"
        aria-label={t('menu')}
        aria-expanded={isOpen}
      >
        <MenuIcon size={20} strokeWidth={2.5} aria-hidden="true" />
      </button>

      {/* Menu Overlay */}
      {isOpen && <div className="menu-scrim" onClick={onToggle} />}

      {/* Menu Panel */}
      <div ref={menuRef} className={`menu-panel ${isOpen ? 'is-open' : ''}`} inert={!isOpen}>
        <div className="dialog-head">
          <h2 className="leaf-title">{t('settings')}</h2>
          <button onClick={onToggle} className="btn btn-quiet btn-icon" aria-label={t('close')}>
            <X size={18} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        {/* Theme Selection */}
        <section className="menu-group">
          <h3 className="group-title">{t('theme')}</h3>
          <div className="segmented segmented-block">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              return (
                <button
                  key={themeOption.value}
                  onClick={() => setTheme(themeOption.value)}
                  aria-pressed={theme === themeOption.value}
                >
                  <Icon size={16} strokeWidth={2.5} aria-hidden="true" />
                  {themeOption.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Language Selection */}
        <section className="menu-group">
          <h3 className="group-title">
            <label htmlFor="menu-language">{t('language')}</label>
          </h3>
          <select
            id="menu-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="select"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </section>

        {/* Cloud Sync */}
        {cloudSlot}

        {/* Data Management */}
        <section className="menu-group">
          <h3 className="group-title">{t('data')}</h3>
          <div className="stack">
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
              className="btn btn-block btn-start"
            >
              <Upload size={16} strokeWidth={2.5} aria-hidden="true" />
              {t('import')}
            </button>
            <button onClick={onExport} className="btn btn-block btn-start">
              <Download size={16} strokeWidth={2.5} aria-hidden="true" />
              {t('export')}
            </button>
            <button onClick={onReset} className="btn btn-block btn-start">
              <RotateCcw size={16} strokeWidth={2.5} aria-hidden="true" />
              {t('reset')}
            </button>
          </div>
        </section>
      </div>
    </>
  );
};
