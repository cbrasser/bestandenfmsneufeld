import { useI18n } from '../i18n/context';
import { Mail, Download } from 'lucide-react';

interface FooterProps {
  onExport: () => void;
}

export const Footer = ({ onExport }: FooterProps) => {
  const { t } = useI18n();

  return (
    <footer className="site-footer">
      <div className="page">
        {/* Data Storage Notice */}
        <div className="note footer-note">
          <p>{t('dataStorageNotice')}</p>
          <button onClick={onExport} className="btn btn-sm">
            <Download size={16} strokeWidth={2.5} aria-hidden="true" />
            {t('exportData')}
          </button>
        </div>

        {/* Disclaimer */}
        <p className="lede text-sm max-w-[75ch]">
          <strong className="text-ink">{t('disclaimer')}:</strong> {t('disclaimerFull')}
        </p>

        {/* Copyright and Contact */}
        <div className="footer-row">
          <span>{t('copyright')}</span>
          <a href="mailto:cbrasser@pm.me">
            <Mail size={16} strokeWidth={2.5} aria-hidden="true" />
            {t('contactEmail')}: cbrasser@pm.me
          </a>
        </div>
      </div>
    </footer>
  );
};
