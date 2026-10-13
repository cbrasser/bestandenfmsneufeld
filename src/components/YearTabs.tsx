import type { Year } from '../types';
import { useI18n } from '../i18n/context';

interface YearTabsProps {
  currentYear: Year;
  onYearChange: (year: Year) => void;
}

const YEARS: Year[] = [1, 2, 3];

// The school years as divider tabs on the leaf below them
export const YearTabs = ({ currentYear, onYearChange }: YearTabsProps) => {
  const { t } = useI18n();

  const yearLabels: Record<Year, string> = {
    1: t('year1'),
    2: t('year2'),
    3: t('year3'),
  };

  return (
    <nav className="year-tabs" aria-label={t('currentYear')}>
      {YEARS.map((year) => (
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
