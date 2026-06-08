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
  onOralGradeChange: (oralGrade: number | undefined) => void;
}

export const CombinedSubjectCard = ({
  subject,
  onAddGrade,
  onEditGrade,
  onDeleteGrade,
  onOralGradeChange,
}: SubjectCardProps) => {
  const { t, tSubject } = useI18n();
  const finalGrade = calculateFinalGrade(subject);
  const hasGrades = subject.grades.length > 0;
  const isPassing = finalGrade >= 4 || !hasGrades;

  return (
    <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {tSubject(subject.name)}
        </h4>
        <div className="flex items-center gap-2">
          {hasGrades && (
            <span
              className={`text-sm font-semibold ${
                isPassing ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {finalGrade === 0 ? '-' : finalGrade.toFixed(1)}
            </span>
          )}
          <button
            onClick={onAddGrade}
            className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors"
            aria-label="Add grade"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {hasGrades ? (
        <>
          <div className="mt-2 pt-2 mb-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-600 dark:text-gray-400">
                {t('oralGrade')}
              </label>
              <input
                type="number"
                step="0.01"
                value={subject.oralGrade ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  onOralGradeChange(value === '' ? undefined : parseFloat(value));
                }}
                placeholder="±0.00"
                className="w-20 px-2 py-1 text-xs text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('oralGradeDescription')}
            </p>
          </div>

          <div className="space-y-0">
            {subject.grades.map((grade, index) => (
              <div key={grade.id}>
                {index > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1.5"></div>
                )}
                <SwipeableGradeItem
                  grade={grade}
                  onEdit={() => onEditGrade(grade.id)}
                  onDelete={() => onDeleteGrade(grade.id)}
                />
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-1.5">
          {t('noGradesYet')}
        </p>
      )}
    </div>
  );
};

