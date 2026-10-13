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

export const SubjectCard = ({
  subject,
  onAddGrade,
  onEditGrade,
  onDeleteGrade,
  onOralGradeChange,
}: SubjectCardProps) => {
  const { t, tSubject } = useI18n();
  const finalGrade = calculateFinalGrade(subject);
  const hasGrades = subject.grades.length > 0;
  const name = tSubject(subject.name);

  return (
    <article className="leaf subject">
      <div className="subject-head">
        <h3 className="subject-title">{name}</h3>
        {hasGrades && (
          <div className="final">
            <span className="final-label">{t('finalGrade')}</span>
            <span className={`final-value ${finalGrade < 4 ? 'is-below' : ''}`}>
              {finalGrade === 0 ? '–' : finalGrade.toFixed(1)}
            </span>
          </div>
        )}
        <button onClick={onAddGrade} className="btn btn-icon" aria-label={`${t('addGrade')}: ${name}`}>
          <Plus size={18} strokeWidth={3} aria-hidden="true" />
        </button>
      </div>

      <SubjectGrades
        subject={subject}
        onEditGrade={onEditGrade}
        onDeleteGrade={onDeleteGrade}
        onOralGradeChange={onOralGradeChange}
      />
    </article>
  );
};

type SubjectGradesProps = Omit<SubjectCardProps, 'onAddGrade'>;

// The grades of one subject and its oral adjustment; shared by a Fach and a Teilfach
export const SubjectGrades = ({
  subject,
  onEditGrade,
  onDeleteGrade,
  onOralGradeChange,
}: SubjectGradesProps) => {
  const { t } = useI18n();
  const oralId = `oral-${subject.id}`;

  if (subject.grades.length === 0) {
    return <p className="muted text-sm">{t('noGradesYet')}</p>;
  }

  return (
    <>
      <div className="rows">
        {subject.grades.map((grade) => (
          <SwipeableGradeItem
            key={grade.id}
            grade={grade}
            onEdit={() => onEditGrade(grade.id)}
            onDelete={() => onDeleteGrade(grade.id)}
          />
        ))}
      </div>

      <div className="oral">
        <div className="oral-text">
          <label htmlFor={oralId} className="oral-label">
            {t('oralGrade')}
          </label>
          <span className="field-hint">{t('oralGradeDescription')}</span>
        </div>
        <input
          id={oralId}
          type="number"
          step="0.01"
          value={subject.oralGrade ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            onOralGradeChange(value === '' ? undefined : parseFloat(value));
          }}
          placeholder="±0.00"
          className="input"
        />
      </div>
    </>
  );
};
