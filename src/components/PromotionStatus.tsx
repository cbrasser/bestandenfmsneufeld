import type { ReactNode } from 'react';
import type { PromotionStatus as PromotionStatusType } from '../types';
import { Check, X, Minus } from 'lucide-react';
import { useI18n } from '../i18n/context';

interface PromotionStatusProps {
  status: PromotionStatusType;
}

// Grades run from 1 to 6
const GRADE_MIN = 1;
const GRADE_SPAN = 5;

const share = (value: number) => `${Math.min(Math.max(value, 0), 1) * 100}%`;
const fill = (value: number) => ({ '--share': share(value) }) as React.CSSProperties;

export const PromotionStatus = ({ status }: PromotionStatusProps) => {
  const { t } = useI18n();
  const { criteria, hasGrades } = status;
  const { failures, average, deficit } = criteria;

  return (
    <div className="leaf">
      <Criterion
        label={t('maximumFailures')}
        note={t('finalGradesBelow4')}
        value={`${failures.count} / ${failures.max}`}
        passed={failures.passed}
      >
        <div className="slots">
          {Array.from({ length: failures.max }, (_, i) => (
            <div key={i} className={`slot ${i < failures.count ? 'is-used' : ''}`} />
          ))}
        </div>
      </Criterion>

      <Criterion
        label={t('averageGrade')}
        note={`${t('minimum')}: ${average.min}`}
        value={hasGrades ? average.value.toFixed(2) : null}
        passed={average.passed}
      >
        <div className="meter meter-hue">
          <div className="meter-track">
            {hasGrades && (
              <div className="meter-fill" style={fill((average.value - GRADE_MIN) / GRADE_SPAN)} />
            )}
          </div>
          <div className="meter-mark" style={{ left: share((average.min - GRADE_MIN) / GRADE_SPAN) }} />
        </div>
      </Criterion>

      <Criterion
        label={t('totalDeficit')}
        note={`${t('maximum')}: ${deficit.max}`}
        value={deficit.value.toFixed(2)}
        passed={deficit.passed}
      >
        <div className="meter">
          <div className="meter-track">
            {deficit.value > 0 && (
              <div className="meter-fill" style={fill(deficit.value / deficit.max)} />
            )}
          </div>
        </div>
      </Criterion>
    </div>
  );
};

interface CriterionProps {
  label: string;
  note: string;
  value: string | null; // null means there is nothing to judge yet
  passed: boolean;
  children: ReactNode;
}

const Criterion = ({ label, note, value, passed, children }: CriterionProps) => {
  const pending = value === null;
  const Icon = pending ? Minus : passed ? Check : X;

  return (
    <div className={`criterion ${!pending && !passed ? 'is-failed' : ''}`}>
      <div className="criterion-head">
        <div>
          <div className="criterion-label">
            <Icon size={18} strokeWidth={3} aria-hidden="true" />
            {label}
          </div>
          <p className="criterion-note">{note}</p>
        </div>
        <span className="criterion-value">{value ?? '–'}</span>
      </div>
      {children}
    </div>
  );
};
