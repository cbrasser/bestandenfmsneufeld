import type { GymProfile as GymProfileType, Year } from '../types';
import {
  artsOptions,
  ergaenzungsfaecher,
  isGymProfileComplete,
  isLanguageSpf,
  schwerpunktfaecher,
  thirdLanguages,
  effectiveThirdLanguage,
} from '../config/gymnasium';
import { useI18n } from '../i18n/context';

interface GymProfileProps {
  year: Year;
  profile: GymProfileType;
  onChange: (profile: GymProfileType) => void;
}

// The subjects a Gymnasium student chooses; everything else follows from the year
export const GymProfile = ({ year, profile, onChange }: GymProfileProps) => {
  const { t, tSubject } = useI18n();
  const spfIsLanguage = isLanguageSpf(profile.spf);

  const fields: {
    key: keyof GymProfileType;
    label: string;
    options: { value: string; label: string }[];
    value?: string;
    hint?: string;
    disabled?: boolean;
  }[] = [
    {
      key: 'spf',
      label: t('gymSpf'),
      options: schwerpunktfaecher.map((s) => ({ value: s.id, label: tSubject(s.name) })),
    },
    {
      key: 'thirdLanguage',
      label: t('gymThirdLanguage'),
      options: thirdLanguages.map((l) => ({ value: l, label: tSubject(l) })),
      value: effectiveThirdLanguage(profile),
      hint: spfIsLanguage ? t('gymSpfLanguageHint') : undefined,
      disabled: spfIsLanguage,
    },
    {
      key: 'arts',
      label: t('gymArts'),
      options: artsOptions.map((a) => ({ value: a, label: tSubject(a) })),
    },
    {
      key: 'ef',
      label: t('gymEf'),
      options: ergaenzungsfaecher.map((e) => ({ value: e.id, label: tSubject(e.name) })),
      hint: t('gymEfHint'),
    },
  ];

  return (
    <div className="leaf subject">
      <h2 className="leaf-title">{t('gymProfile')}</h2>
      {!isGymProfileComplete(year, profile) && <p className="lede text-sm">{t('gymProfileIncomplete')}</p>}
      <div className="form">
        {fields.map(({ key, label, options, value, hint, disabled }) => (
          <div key={key} className="field">
            <label htmlFor={`gym-${key}`} className="field-label">
              {label}
            </label>
            <select
              id={`gym-${key}`}
              value={value ?? profile[key] ?? ''}
              disabled={disabled}
              onChange={(e) => onChange({ ...profile, [key]: e.target.value || undefined })}
              className="select"
            >
              <option value="">{t('gymChoose')}</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {hint && <span className="field-hint">{hint}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};
