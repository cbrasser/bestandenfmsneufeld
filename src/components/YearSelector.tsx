import type { Year } from '../types';
import { useI18n } from '../i18n/context';

interface YearSelectorProps {
  currentYear: Year;
  onYearChange: (year: Year) => void;
}

export const YearSelector = ({
  currentYear,
  onYearChange,
}: YearSelectorProps) => {
  const { t } = useI18n();
  
  const yearLabels: Record<Year, string> = {
    1: t('year1'),
    2: t('year2'),
    3: t('year3'),
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t('currentYear')}
      </label>
      <div className="flex gap-2">
        {([1, 2, 3] as Year[]).map((year) => (
          <button
            key={year}
            onClick={() => onYearChange(year)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentYear === year
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {yearLabels[year]}
          </button>
        ))}
      </div>
    </div>
  );
};

