import { useRef, useEffect } from 'react';
import { Menu as MenuIcon, X, Globe } from 'lucide-react';
import { useI18n } from '../i18n/context';
import type { Language } from '../i18n/locales';

interface MenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Menu = ({ isOpen, onToggle }: MenuProps) => {
  const { language, setLanguage, t } = useI18n();
  const menuRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; label: string }[] = [
    { code: 'de', label: t('german') },
    { code: 'fr', label: t('french') },
    { code: 'en', label: t('english') },
    { code: 'it', label: t('italian') },
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
        className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onToggle} />
      )}

      {/* Menu Panel */}
      <div
        ref={menuRef}
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6">
          {/* Menu Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">{t('settings')}</h2>
            <button
              onClick={onToggle}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Language Selection */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">{t('language')}</h3>
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
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="font-medium">{lang.label}</div>
                  {language === lang.code && (
                    <div className="text-xs mt-1 text-blue-700">
                      {lang.code === 'de' && 'Standard'}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Future menu items can be added here */}
        </div>
      </div>
    </>
  );
};

