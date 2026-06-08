import { useState, useEffect } from 'react';
import type { Grade, Semester } from '../types';
import { X } from 'lucide-react';
import { useI18n } from '../i18n/context';
import { DatePicker } from '@/components/ui/date-picker';

interface GradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (grade: Omit<Grade, 'id'>) => void;
  existingGrade?: Grade;
}

export const GradeModal = ({
  isOpen,
  onClose,
  onSave,
  existingGrade,
}: GradeModalProps) => {
  const { t, language } = useI18n();
  const [value, setValue] = useState('');
  const [weight, setWeight] = useState('1');
  const [label, setLabel] = useState('');
  const [semester, setSemester] = useState<Semester | undefined>(undefined);
  const [date, setDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (existingGrade) {
      setValue(existingGrade.value.toString());
      setWeight(existingGrade.weight.toString());
      setLabel(existingGrade.label || '');
      setSemester(existingGrade.semester);
      setDate(existingGrade.date ? new Date(existingGrade.date) : undefined);
    } else {
      setValue('');
      setWeight('1');
      setLabel('');
      setSemester(undefined);
      setDate(new Date());
    }
  }, [existingGrade, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(value);
    const numWeight = parseFloat(weight);

    if (
      isNaN(numValue) ||
      numValue < 1 ||
      numValue > 6 ||
      isNaN(numWeight) ||
      numWeight <= 0
    ) {
      alert(t('invalidValues'));
      return;
    }

    const roundedValue = Math.round(numValue * 100) / 100;
    const roundedWeight = Math.round(numWeight * 100) / 100;

    onSave({
      value: roundedValue,
      weight: roundedWeight,
      label: label.trim() || undefined,
      semester: semester,
      date: date ? date.toISOString().split('T')[0] : undefined,
    });

    onClose();
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    if (input === '' || /^\d*\.?\d{0,2}$/.test(input)) {
      setValue(input);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {existingGrade ? t('editGrade') : t('addGrade')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('grade')}
            </label>
            <input
              type="text"
              inputMode="decimal"
              min="1"
              max="6"
              value={value}
              onChange={handleValueChange}
              placeholder="e.g., 4.5"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('gradeRange')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('weight')}
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('weightDescription')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('date')}
            </label>
            <DatePicker
              date={date}
              onDateChange={setDate}
              placeholder={t('datePlaceholder')}
              language={language}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('semester')}
            </label>
            <select
              value={semester || ''}
              onChange={(e) => setSemester((e.target.value as Semester) || undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('noSemester')}</option>
              <option value="Herbstsemester">{t('fallSemester')}</option>
              <option value="Frühlingssemester">{t('springSemester')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('label')}
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('labelPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
