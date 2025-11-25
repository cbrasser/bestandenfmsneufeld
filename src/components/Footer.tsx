import { useI18n } from '../i18n/context';
import { Mail } from 'lucide-react';

export const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          {/* Disclaimer */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              <strong>{t('disclaimer')}:</strong> {t('disclaimerFull')}
            </p>
          </div>

          {/* Copyright and Contact */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs">
              {t('copyright')}
            </p>
            <a
              href="mailto:cbrasser@pm.me"
              className="flex items-center gap-1 text-xs hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Mail className="w-3 h-3" />
              {t('contactEmail')}: cbrasser@pm.me
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

