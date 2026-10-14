import type { Year } from '../types';
import { useI18n } from '../i18n/context';

interface YearTabsProps {
  years: Year[];
  currentYear: Year;
  onYearChange: (year: Year) => void;
}

// The school years as divider tabs on the leaf below them
export const YearTabs = ({ years, currentYear, onYearChange }: YearTabsProps) => {
  const { t } = useI18n();

  const yearLabels: Record<Year, string> = {
    1: t('year1'),
    2: t('year2'),
    3: t('year3'),
    4: t('year4'),
  };

  return (
    <nav className="year-tabs" aria-label={t('currentYear')}>
      {years.map((year) => (
        <button
          key={year}
          onClick={() => onYearChange(year)}
          aria-current={currentYear === year ? 'page' : undefined}
          className="year-tab"
          style={{ '--tab-hue': `var(--year-${year})` } as React.CSSProperties}
        >
          {yearLabels[year]}
        </button>
      ))}
    </nav>
  );
};
