import type { CombinedSubject } from '../types';
import { calculateFinalGrade, combinedSubjectHasGrades } from '../utils/promotion';
import { Plus } from 'lucide-react';
import { SubjectGrades } from './SubjectCard';
import { useI18n } from '../i18n/context';

interface CombinedSubjectCardProps {
  subject: CombinedSubject;
  onAddGrade: (subjectId: string) => void;
  onEditGrade: (subjectId: string, gradeId: string) => void;
  onDeleteGrade: (subjectId: string, gradeId: string) => void;
  onOralGradeChange: (subjectId: string, oralGrade: number | undefined) => void;
}

// A Fach made of Teilfächer: one leaf, each Teilfach a titled group inside it
export const CombinedSubjectCard = ({
  subject,
  onAddGrade,
  onEditGrade,
  onDeleteGrade,
  onOralGradeChange,
}: CombinedSubjectCardProps) => {
  const { t, tSubject } = useI18n();
  const finalGrade = calculateFinalGrade(subject);

  return (
    <article className="leaf subject">
      <div className="subject-head">
        <h3 className="subject-title">{tSubject(subject.name)}</h3>
        {combinedSubjectHasGrades(subject) && (
          <div className="final">
            <span className="final-label">{t('finalGrade')}</span>
            <span className={`final-value ${finalGrade < 4 ? 'is-below' : ''}`}>
              {finalGrade.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {subject.subjects.map((sub) => {
        const name = tSubject(sub.name);
        const grade = calculateFinalGrade(sub);
        return (
          <section key={sub.id} className="part">
            <div className="part-head">
              <h4 className="part-title">{name}</h4>
              {sub.grades.length > 0 && (
                <span className={`part-value ${grade < 4 ? 'is-below' : ''}`}>
                  {grade === 0 ? '–' : grade.toFixed(1)}
                </span>
              )}
              <button
                onClick={() => onAddGrade(sub.id)}
                className="btn btn-icon"
                aria-label={`${t('addGrade')}: ${name}`}
              >
                <Plus size={18} strokeWidth={3} aria-hidden="true" />
              </button>
            </div>
            <SubjectGrades
              subject={sub}
              onEditGrade={(gradeId) => onEditGrade(sub.id, gradeId)}
              onDeleteGrade={(gradeId) => onDeleteGrade(sub.id, gradeId)}
              onOralGradeChange={(oralGrade) => onOralGradeChange(sub.id, oralGrade)}
            />
          </section>
        );
      })}
    </article>
  );
};
