import type { Subject } from '../types';
import { calculateFinalGrade } from '../utils/promotion';
import { Plus } from 'lucide-react';
import { SwipeableGradeItem } from './SwipeableGradeItem';
import { useI18n } from '../i18n/context';

interface SubjectCardProps {
  subject: Subject;
  onAddGrade: () => void;
  onEditGrade: (gradeId: string) => void;
  onDeleteGrade: (gradeId: string) => void;
}

export const SubjectCard = ({
  subject,
  onAddGrade,
  onEditGrade,
  onDeleteGrade,
}: SubjectCardProps) => {
  const { t } = useI18n();
  const finalGrade = calculateFinalGrade(subject);
  const hasGrades = subject.grades.length > 0;
  const isPassing = finalGrade >= 4 || !hasGrades;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
          {subject.name}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onAddGrade}
            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
            aria-label="Add grade"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {hasGrades ? (
        <>
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('finalGrade')}</span>
              <span
                className={`text-lg font-bold ${
                  isPassing ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {finalGrade === 0 ? '-' : finalGrade.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {subject.grades.map((grade) => (
              <SwipeableGradeItem
                key={grade.id}
                grade={grade}
                onEdit={() => onEditGrade(grade.id)}
                onDelete={() => onDeleteGrade(grade.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">
          {t('noGradesYet')}
        </p>
      )}
    </div>
  );
};

