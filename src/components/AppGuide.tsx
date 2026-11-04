import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Copy, ExternalLink } from 'lucide-react';
import { useI18n } from '../i18n/context';
import { guideText } from '../i18n/guide';
import type { GuideGroup, GuideStep } from '../i18n/guide';
import type { Language } from '../i18n/locales';
import { guideHash, sectionForDevice } from '../utils/guideRoute';
import type { GuideSection } from '../utils/guideRoute';

const SECTIONS: { id: GuideSection; label: string }[] = [
  { id: 'android', label: 'Android' },
  { id: 'iphone', label: 'iPhone' },
];

// **Double stars** in the guide's text mark what the student taps or reads on screen
const Marked = ({ text }: { text: string }) => (
  <>{text.split('**').map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}</>
);

const CopyValue = ({ value }: { value: string }) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // The value stays selectable on the page
    }
  };

  return (
    <div className="guide-copy">
      <span className="guide-copy-value select-all">{value}</span>
      <button onClick={handleCopy} className="btn btn-sm">
        {copied ? (
          <Check size={16} strokeWidth={3} aria-hidden="true" />
        ) : (
          <Copy size={16} strokeWidth={2.5} aria-hidden="true" />
        )}
        {copied ? t('cloudCopied') : t('cloudCopy')}
      </button>
    </div>
  );
};

const Step = ({ step }: { step: GuideStep }) => (
  <li className="guide-step">
    <p><Marked text={step.text} /></p>
    {step.copy && <CopyValue value={step.copy} />}
    {step.link && (
      <a href={step.link.href} className={`btn ${step.link.primary ? 'btn-primary' : ''}`}>
        {!step.link.primary && <ExternalLink size={16} strokeWidth={2.5} aria-hidden="true" />}
        {step.link.label}
      </a>
    )}
  </li>
);

const Group = ({ group }: { group: GuideGroup }) => (
  <section className="guide-group">
    {group.title && <h3 className="group-title">{group.title}</h3>}
    {group.intro && <p className="guide-group-intro">{group.intro}</p>}
    <ol className="guide-steps">
      {group.steps.map((step) => (
        <Step key={step.text} step={step} />
      ))}
    </ol>
    {group.note && <p className="note">{group.note}</p>}
  </section>
);

export const AppGuide = ({ section }: { section: GuideSection | null }) => {
  const { language, setLanguage, t } = useI18n();
  const text = guideText[language];
  const shown = section ?? sectionForDevice(navigator.userAgent, navigator.maxTouchPoints) ?? 'android';
  const content = text.sections[shown];

  // Coming from a long page of grades, the guide still starts at its top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const languages: { code: Language; label: string }[] = [
    { code: 'de', label: t('german') },
    { code: 'fr', label: t('french') },
    { code: 'en', label: t('english') },
    { code: 'it', label: t('italian') },
  ];

  return (
    <div className="app">
      <header className="page app-bar">
        <span className="wordmark">{t('gradeTracker')}</span>
        <a href="#" className="btn">
          <ArrowLeft size={16} strokeWidth={2.5} aria-hidden="true" />
          {text.backToGrades}
        </a>
      </header>

      <main className="page">
        <div className="page-head">
          <div className="page-head-text">
            <h1 className="display">{text.title}</h1>
            <p className="guide-text">{text.lede}</p>
          </div>
        </div>

        <div className="guide">
          <div className="guide-controls">
            <div className="segmented">
              {SECTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => {
                    window.location.hash = guideHash(id);
                  }}
                  aria-pressed={shown === id}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              aria-label={t('language')}
              className="select guide-language"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <p className="guide-text">{content.intro}</p>
          {content.warning && <p className="note guide-warning">{content.warning}</p>}

          {content.leaves.map((leaf) => (
            <article key={leaf.id} className="leaf guide-leaf">
              <div className="guide-leaf-head">
                <h2 className="leaf-title">{leaf.title}</h2>
                <p className="lede">{leaf.intro}</p>
              </div>
              {leaf.groups.map((group) => (
                <Group key={group.steps[0].text} group={group} />
              ))}
            </article>
          ))}
        </div>
      </main>
    </div>
  );
};
