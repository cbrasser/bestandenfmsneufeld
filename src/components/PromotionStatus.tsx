import type { PromotionStatus as PromotionStatusType } from '../types';
import { CheckCircle, XCircle } from 'lucide-react';
import { useI18n } from '../i18n/context';

interface PromotionStatusProps {
  status: PromotionStatusType;
}

export const PromotionStatus = ({ status }: PromotionStatusProps) => {
  const { t } = useI18n();
  const { criteria } = status;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div
        className={`flex items-center gap-2 mb-4 pb-4 border-b ${
          status.isPassing
            ? 'text-green-600 border-green-200'
            : 'text-red-600 border-red-200'
        }`}
      >
        {status.isPassing ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <XCircle className="w-5 h-5" />
        )}
        <h2 className="text-lg font-semibold">
          {status.isPassing ? t('passing') : t('notPassing')}
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
          value={criteria.average.value.toFixed(1)}
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
  value: string;
  description: string;
}

const CriterionItem = ({
  label,
  passed,
  value,
  description,
}: CriterionItemProps) => {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {passed ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600" />
          )}
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <p className="text-xs text-gray-500 ml-6">{description}</p>
      </div>
      <span
        className={`text-sm font-semibold ${
          passed ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {value}
      </span>
    </div>
  );
};

