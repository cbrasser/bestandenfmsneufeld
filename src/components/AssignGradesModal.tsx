import { useState, useEffect } from 'react';
import type { CombinedSubject } from '../types';
import { X } from 'lucide-react';
import { useI18n } from '../i18n/context';

const DISCARD = '__discard__';

interface AssignGradesModalProps {
  subject?: CombinedSubject;
  onClose: () => void;
  // gradeId -> id of the Teilfach it goes to, or null to delete the grade
  onSave: (assignments: Record<string, string | null>) => void;
}

export const AssignGradesModal = ({
  subject,
  onClose,
  onSave,
}: AssignGradesModalProps) => {
  const { t, tSubject } = useI18n();
  const [choices, setChoices] = useState<Record<string, string>>({});

  useEffect(() => {
    setChoices({});
  }, [subject?.id]);

  if (!subject?.unassignedGrades?.length) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assignments: Record<string, string | null> = {};
    Object.entries(choices).forEach(([gradeId, choice]) => {
      if (choice) assignments[gradeId] = choice === DISCARD ? null : choice;
    });
    onSave(assignments);
    onClose();
  };

  return (
    <div className="scrim">
      <div className="leaf dialog" role="dialog" aria-modal="true" aria-labelledby="assign-modal-title">
        <div className="dialog-head">
          <h2 id="assign-modal-title" className="leaf-title">
            {t('assignGrades')}
          </h2>
          <button type="button" onClick={onClose} className="btn btn-quiet btn-icon" aria-label={t('close')}>
            <X size={18} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
        <p className="lede text-sm">{t('assignGradesDescription')}</p>

        <form onSubmit={handleSubmit} className="form">
          {subject.unassignedGrades.map((grade) => (
            <div key={grade.id} className="field">
              <label htmlFor={`assign-${grade.id}`} className="field-label">
                <span className="text-base font-extrabold text-ink">{grade.value.toFixed(2)}</span>
                {grade.weight !== 1 && <> ×{grade.weight}</>}
                {[
                  grade.label,
                  grade.date && new Date(grade.date).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                ].filter(Boolean).map((part) => ` · ${part}`)}
              </label>
              <select
                id={`assign-${grade.id}`}
                value={choices[grade.id] ?? ''}
                onChange={(e) => setChoices({ ...choices, [grade.id]: e.target.value })}
                className="select"
              >
                <option value="">{t('assignGradeLater')}</option>
                {subject.subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {tSubject(sub.name)}
                  </option>
                ))}
                <option value={DISCARD}>{t('assignGradeDiscard')}</option>
              </select>
            </div>
          ))}

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
