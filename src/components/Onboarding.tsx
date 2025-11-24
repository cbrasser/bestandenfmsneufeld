import { useState } from 'react';
import type { Division, StudentInfo } from '../types';
import { useI18n } from '../i18n/context';

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
    
    if (!newErrors.name && !newErrors.division && division) {
      onComplete({
        name: name.trim(),
        division: division as Division,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('welcome')}
          </h1>
          <p className="text-sm text-gray-600">
            {t('onboardingDescription')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1">{t('pleaseEnterName')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('division')}
            </label>
            <div className="space-y-2">
              {(['FMS', 'Gymnasium'] as Division[]).map((div) => (
                <label
                  key={div}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    division === div
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="division"
                    value={div}
                    checked={division === div}
                    onChange={(e) => {
                      setDivision(e.target.value as Division);
                      setErrors({ ...errors, division: false });
                    }}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{div}</div>
                    {div === 'FMS' && (
                      <div className="text-xs text-gray-500 mt-1">
                        Fachmittelschule
                      </div>
                    )}
                  </div>
                  {division === div && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  )}
                </label>
              ))}
            </div>
            {errors.division && (
              <p className="text-xs text-red-600 mt-1">{t('pleaseSelectDivision')}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {t('continue')}
          </button>
        </form>
      </div>
    </div>
  );
};

