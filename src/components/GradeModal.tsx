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
  const [invalid, setInvalid] = useState({ value: false, weight: false });

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
    setInvalid({ value: false, weight: false });
  }, [existingGrade, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(value);
    const numWeight = parseFloat(weight);

    const nextInvalid = {
      value: isNaN(numValue) || numValue < 1 || numValue > 6,
      weight: isNaN(numWeight) || numWeight <= 0,
    };
    setInvalid(nextInvalid);
    if (nextInvalid.value || nextInvalid.weight) return;

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
    <div className="scrim">
      <div className="leaf dialog" role="dialog" aria-modal="true" aria-labelledby="grade-modal-title">
        <div className="dialog-head">
          <h2 id="grade-modal-title" className="leaf-title">
            {existingGrade ? t('editGrade') : t('addGrade')}
          </h2>
          <button type="button" onClick={onClose} className="btn btn-quiet btn-icon" aria-label={t('close')}>
            <X size={18} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form" noValidate>
          {(invalid.value || invalid.weight) && (
            <p className="form-error" role="alert">
              {t('invalidValues')}
            </p>
          )}
          <div className="field-row">
            <div className="field">
              <label htmlFor="grade-value" className="field-label">
                {t('grade')}
              </label>
              <input
                id="grade-value"
                type="text"
                inputMode="decimal"
                value={value}
                onChange={handleValueChange}
                placeholder="4.5"
                aria-invalid={invalid.value ? true : undefined}
                className="input"
                autoFocus
                required
              />
              <span className="field-hint">{t('gradeRange')}</span>
            </div>

            <div className="field">
              <label htmlFor="grade-weight" className="field-label">
                {t('weight')}
              </label>
              <input
                id="grade-weight"
                type="number"
                step="0.1"
                min="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                aria-invalid={invalid.weight ? true : undefined}
                className="input"
                required
              />
              <span className="field-hint">{t('weightDescription')}</span>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <span className="field-label">{t('date')}</span>
              <DatePicker
                date={date}
                onDateChange={setDate}
                placeholder={t('datePlaceholder')}
                language={language}
              />
            </div>

            <div className="field">
              <label htmlFor="grade-semester" className="field-label">
                {t('semester')}
              </label>
              <select
                id="grade-semester"
                value={semester || ''}
                onChange={(e) => setSemester((e.target.value as Semester) || undefined)}
                className="select"
              >
                <option value="">{t('noSemester')}</option>
                <option value="Herbstsemester">{t('fallSemester')}</option>
                <option value="Frühlingssemester">{t('springSemester')}</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="grade-label" className="field-label">
              {t('label')}
            </label>
            <input
              id="grade-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('labelPlaceholder')}
              className="input"
            />
          </div>

          <div className="dialog-actions">
            <button type="button" onClick={onClose} className="btn btn-quiet">
              {t('cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
