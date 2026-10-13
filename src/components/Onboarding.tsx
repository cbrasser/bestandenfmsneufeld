import { useState } from 'react';
import type { Division, StudentData, StudentInfo } from '../types';
import { useI18n } from '../i18n/context';
import { Construction, KeyRound, Loader2 } from 'lucide-react';
import { cloudSync, normalizeCode, setStoredCode } from '../utils/cloudSync';

interface OnboardingProps {
  onComplete: (info: StudentInfo) => void;
  onLoadFromCode: (data: StudentData) => void;
}

export const Onboarding = ({ onComplete, onLoadFromCode }: OnboardingProps) => {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [division, setDivision] = useState<Division | ''>('');
  const [errors, setErrors] = useState({ name: false, division: false });

  // Code-Login
  const [showCode, setShowCode] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeBusy, setCodeBusy] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const handleCodeLogin = async () => {
    const canonical = normalizeCode(codeInput);
    if (canonical.length < 12) {
      setCodeError(t('cloudInvalidCode'));
      return;
    }
    setCodeBusy(true);
    setCodeError(null);
    try {
      const remote = await cloudSync.load(canonical);
      if (!remote) {
        setCodeError(t('cloudUnknownCode'));
        return;
      }
      setStoredCode(canonical);
      onLoadFromCode(remote);
    } catch {
      setCodeError(t('cloudLoadError'));
    } finally {
      setCodeBusy(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = {
      name: !name.trim(),
      division: !division,
    };
    
    setErrors(newErrors);
    
    if (!newErrors.name && !newErrors.division && division && division !== 'Gymnasium') {
      onComplete({
        name: name.trim(),
        division: division as Division,
      });
    }
  };

  return (
    <main className="auth">
      <div className="leaf auth-card">
        <div className="grid gap-3">
          <h1 className="auth-title">{t('welcome')}</h1>
          <p className="lede">{t('onboardingDescription')}</p>
        </div>

        <form onSubmit={handleSubmit} className="form" noValidate>
          <div className="field">
            <label htmlFor="onboarding-name" className="field-label">
              {t('yourName')}
            </label>
            <input
              id="onboarding-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors({ ...errors, name: false });
              }}
              placeholder={t('enterYourName')}
              aria-invalid={errors.name ? true : undefined}
              className="input"
              required
            />
            {errors.name && <p className="field-error">{t('pleaseEnterName')}</p>}
          </div>

          <fieldset className="field">
            <legend className="field-label mb-1">{t('division')}</legend>
            <div className="picker" style={{ '--hue': 'var(--year-1)' } as React.CSSProperties}>
              {(['FMS', 'Gymnasium'] as Division[]).map((div) => {
                const isDisabled = div === 'Gymnasium';
                const isChecked = division === div && !isDisabled;
                return (
                  <label
                    key={div}
                    className={`picker-card ${isChecked ? 'is-checked' : ''} ${isDisabled ? 'is-disabled' : ''}`}
                  >
                    <input
                      type="radio"
                      name="division"
                      value={div}
                      checked={division === div}
                      onChange={(e) => {
                        if (!isDisabled) {
                          setDivision(e.target.value as Division);
                          setErrors({ ...errors, division: false });
                        }
                      }}
                      disabled={isDisabled}
                      className="visually-hidden"
                    />
                    <span className="picker-swatch" aria-hidden="true" />
                    <span className="picker-text">
                      <span className="picker-name">{div}</span>
                      {div === 'FMS' && <span className="picker-sub">Fachmittelschule</span>}
                    </span>
                    {isDisabled && (
                      <span className="chip chip-muted">
                        <Construction size={12} strokeWidth={2.5} aria-hidden="true" />
                        {t('underConstruction')}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            {errors.division && <p className="field-error">{t('pleaseSelectDivision')}</p>}
          </fieldset>

          <p className="note">
            <strong>{t('disclaimer')}:</strong> {t('disclaimerFull')}
          </p>

          <button type="submit" className="btn btn-primary btn-block">
            {t('continue')}
          </button>
        </form>

        {/* Code-Login */}
        {cloudSync.isConfigured && (
          <>
            <hr className="rule" />
            {!showCode ? (
              <button type="button" onClick={() => setShowCode(true)} className="btn btn-quiet btn-block btn-wrap">
                <KeyRound size={16} strokeWidth={2.5} aria-hidden="true" />
                {t('cloudHaveCode')}
              </button>
            ) : (
              <div className="form">
                <div className="field">
                  <label htmlFor="onboarding-code" className="field-label">
                    {t('cloudLoginWithCode')}
                  </label>
                  <input
                    id="onboarding-code"
                    type="text"
                    value={codeInput}
                    onChange={(e) => {
                      setCodeInput(e.target.value);
                      setCodeError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCodeLogin();
                    }}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    aria-invalid={codeError ? true : undefined}
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    className="input code"
                  />
                  {codeError && <p className="field-error">{codeError}</p>}
                </div>
                <button type="button" onClick={handleCodeLogin} disabled={codeBusy} className="btn btn-block">
                  {codeBusy && <Loader2 size={16} strokeWidth={2.5} className="animate-spin" aria-hidden="true" />}
                  {t('cloudLogin')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};
