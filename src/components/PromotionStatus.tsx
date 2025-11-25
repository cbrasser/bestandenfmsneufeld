import type { PromotionStatus as PromotionStatusType } from '../types';
import { CheckCircle, XCircle, Minus } from 'lucide-react';
import { useI18n } from '../i18n/context';

interface PromotionStatusProps {
  status: PromotionStatusType;
}

export const PromotionStatus = ({ status }: PromotionStatusProps) => {
  const { t } = useI18n();
  const { criteria, hasGrades } = status;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
      <div
        className={`flex items-center gap-2 mb-4 pb-4 border-b ${
          !hasGrades
            ? 'text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
            : status.isPassing
            ? 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
            : 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
        }`}
      >
        {!hasGrades ? (
          <Minus className="w-5 h-5" />
        ) : status.isPassing ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <XCircle className="w-5 h-5" />
        )}
        <h2 className="text-lg font-semibold">
          {!hasGrades ? t('noGradesYetStatus') : status.isPassing ? t('passing') : t('notPassing')}
        </h2>
      </div>

      <div className="space-y-3">
        <CriterionItem
          label={t('maximumFailures')}
          passed={criteria.failures.passed}
          value={`${criteria.failures.count} / ${criteria.failures.max}`}
          description={t('finalGradesBelow4')}
        />
        <CriterionItem
          label={t('averageGrade')}
          passed={criteria.average.passed}
          value={hasGrades ? criteria.average.value.toFixed(1) : null}
          description={`${t('minimum')}: ${criteria.average.min}`}
        />
        <CriterionItem
          label={t('totalDeficit')}
          passed={criteria.deficit.passed}
          value={criteria.deficit.value.toFixed(2)}
          description={`${t('maximum')}: ${criteria.deficit.max}`}
        />
      </div>
    </div>
  );
};

interface CriterionItemProps {
  label: string;
  passed: boolean;
  value: string | null; // null means show icon instead
  description: string;
}

const CriterionItem = ({
  label,
  passed,
  value,
  description,
}: CriterionItemProps) => {
  const showIcon = value === null;
  
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {showIcon ? (
            <Minus className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          ) : passed ? (
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">{description}</p>
      </div>
      {showIcon ? (
        <Minus className="w-5 h-5 text-gray-400 dark:text-gray-500" />
      ) : (
        <span
          className={`text-sm font-semibold ${
            passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}
        >
          {value}
        </span>
      )}
    </div>
  );
};

