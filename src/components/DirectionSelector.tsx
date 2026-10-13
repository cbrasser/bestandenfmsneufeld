import type { Direction } from '../types';
import { useI18n } from '../i18n/context';

interface DirectionSelectorProps {
  directions: Direction[];
  selectedDirectionId?: string;
  onSelect: (directionId: string) => void;
}

export const DirectionSelector = ({
  directions,
  selectedDirectionId,
  onSelect,
}: DirectionSelectorProps) => {
  const { t, tSubject } = useI18n();
  if (directions.length === 0) return null;

  return (
    <div className="leaf subject">
      <h2 className="leaf-title">{t('selectDirection')}</h2>
      {!selectedDirectionId && <p className="lede text-sm">{t('selectDirectionYear3')}</p>}
      <div className="picker">
        {directions.map((direction) => {
          const isChecked = selectedDirectionId === direction.id;
          return (
            <button
              key={direction.id}
              onClick={() => onSelect(direction.id)}
              aria-pressed={isChecked}
              className={`picker-card ${isChecked ? 'is-checked' : ''}`}
            >
              <span className="picker-swatch" aria-hidden="true" />
              <span className="picker-text">
                <span className="picker-name">{tSubject(direction.name)}</span>
                <span className="picker-sub">
                  {direction.subjects.length} {t('subjects')}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
