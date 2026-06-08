import { useI18n } from '../i18n/context';
import { Mail, Download } from 'lucide-react';

interface FooterProps {
  onExport: () => void;
}

export const Footer = ({ onExport }: FooterProps) => {
  const { t } = useI18n();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          {/* Data Storage Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-800 dark:text-blue-200 mb-3">
              {t('dataStorageNotice')}
            </p>
            <button
              onClick={onExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              {t('exportData')}
            </button>
          </div>

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

