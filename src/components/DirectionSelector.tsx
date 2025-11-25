import type { Direction } from '../types';
import { useI18n } from '../i18n/context';

interface DirectionSelectorProps {
  directions: Direction[];
  selectedDirectionId?: string;
  onSelect: (directionId: string) => void;
}

export const DirectionSelector = ({
  directions,
  selectedDirectionId,
  onSelect,
}: DirectionSelectorProps) => {
  const { t } = useI18n();
  if (directions.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {t('selectDirection')}
      </label>
      <div className="space-y-2">
        {directions.map((direction) => (
          <button
            key={direction.id}
            onClick={() => onSelect(direction.id)}
            className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
              selectedDirectionId === direction.id
                ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="font-medium">{direction.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {direction.subjects.length} {t('subjects')}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

