import { useState, useEffect } from 'react';
import type { Grade } from '../types';
import { X } from 'lucide-react';
import { useI18n } from '../i18n/context';

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
  const { t } = useI18n();
  const [value, setValue] = useState('');
  const [weight, setWeight] = useState('1');
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (existingGrade) {
      setValue(existingGrade.value.toString());
      setWeight(existingGrade.weight.toString());
      setLabel(existingGrade.label || '');
    } else {
      setValue('');
      setWeight('1');
      setLabel('');
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

    // Round to 2 decimal places
    const roundedValue = Math.round(numValue * 100) / 100;
    const roundedWeight = Math.round(numWeight * 100) / 100;

    onSave({
      value: roundedValue,
      weight: roundedWeight,
      label: label.trim() || undefined,
    });

    onClose();
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Allow empty, numbers, and one decimal point
    if (input === '' || /^\d*\.?\d{0,2}$/.test(input)) {
      setValue(input);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {existingGrade ? t('editGrade') : t('addGrade')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('gradeRange')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('weight')}
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('weightDescription')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('label')}
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('labelPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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

