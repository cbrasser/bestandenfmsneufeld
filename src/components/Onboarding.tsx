import { useState } from 'react';
import type { Division, StudentInfo } from '../types';
import { useI18n } from '../i18n/context';
import { Construction } from 'lucide-react';

interface OnboardingProps {
  onComplete: (info: StudentInfo) => void;
}

export const Onboarding = ({ onComplete }: OnboardingProps) => {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [division, setDivision] = useState<Division | ''>('');
  const [errors, setErrors] = useState({ name: false, division: false });

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('welcome')}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('onboardingDescription')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('yourName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors({ ...errors, name: false });
              }}
              placeholder={t('enterYourName')}
              className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              }`}
              required
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1">{t('pleaseEnterName')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('division')}
            </label>
            <div className="space-y-2">
              {(['FMS', 'Gymnasium'] as Division[]).map((div) => {
                const isDisabled = div === 'Gymnasium';
                return (
                  <label
                    key={div}
                    className={`flex items-center p-4 border-2 rounded-lg transition-colors ${
                      isDisabled
                        ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-60'
                        : division === div
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 cursor-pointer'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer'
                    }`}
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
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className={`font-medium ${isDisabled ? 'text-gray-500 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100'}`}>
                        {div}
                        {isDisabled && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-600">
                            <Construction className="w-3 h-3" />
                            {t('underConstruction')}
                          </span>
                        )}
                      </div>
                      {div === 'FMS' && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Fachmittelschule
                        </div>
                      )}
                    </div>
                    {division === div && !isDisabled && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
            {errors.division && (
              <p className="text-xs text-red-600 mt-1">{t('pleaseSelectDivision')}</p>
            )}
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              <strong>{t('disclaimer')}:</strong> {t('disclaimerFull')}
            </p>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            {t('continue')}
          </button>
        </form>
      </div>
    </div>
  );
};

