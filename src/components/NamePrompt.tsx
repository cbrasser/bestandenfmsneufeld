import { useState } from 'react';
import { useI18n } from '../i18n/context';

interface NamePromptProps {
  onComplete: (name: string) => void;
}

/** Asks for the name on a device that got its data with a code. The name stays on this device. */
export const NamePrompt = ({ onComplete }: NamePromptProps) => {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onComplete(name.trim());
    else setError(true);
  };

  return (
    <main className="auth">
      <div className="leaf auth-card">
        <div className="grid gap-3">
          <h1 className="auth-title">{t('namePromptTitle')}</h1>
          <p className="lede">{t('namePromptDescription')}</p>
        </div>

        <form onSubmit={handleSubmit} className="form" noValidate>
          <div className="field">
            <label htmlFor="name-prompt" className="field-label">
              {t('yourName')}
            </label>
            <input
              id="name-prompt"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(false);
              }}
              placeholder={t('enterYourName')}
              aria-invalid={error ? true : undefined}
              className="input"
              required
            />
            {error && <p className="field-error">{t('pleaseEnterName')}</p>}
          </div>

          <button type="submit" className="btn btn-primary btn-block">
            {t('continue')}
          </button>
        </form>
      </div>
    </main>
  );
};
