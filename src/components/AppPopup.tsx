import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '../i18n/context';
import { guideText } from '../i18n/guide';
import { useConflictPromptState } from '../sync/useCloudSync';
import { appPopupDismissal, appPopupSections, isIphoneHomeScreenInstall, shouldShowAppPopup } from '../utils/appPopup';
import { guideHash, sectionForDevice } from '../utils/guideRoute';

const deviceSection = sectionForDevice(navigator.userAgent, navigator.maxTouchPoints);

const homeScreenInstall = () =>
  isIphoneHomeScreenInstall(
    deviceSection,
    (navigator as Navigator & { standalone?: boolean }).standalone,
    window.matchMedia('(display-mode: standalone)').matches
  );

/** Tells a student once that the app exists. It yields to anything that matters more. */
export const AppPopup = ({ otherDialogOpen }: { otherDialogOpen: boolean }) => {
  const conflictPrompt = useConflictPromptState();
  const [dismissed, setDismissed] = useState(appPopupDismissal.isDismissed);

  const show = shouldShowAppPopup({
    conflictPrompt,
    dismissed,
    homeScreenInstall: homeScreenInstall(),
    otherDialogOpen,
  });
  if (!show) return null;

  return (
    <AppPopupDialog
      onDismiss={() => {
        appPopupDismissal.dismiss();
        setDismissed(true);
      }}
    />
  );
};

const AppPopupDialog = ({ onDismiss }: { onDismiss: () => void }) => {
  const { language, t } = useI18n();
  const dialog = useRef<HTMLDivElement>(null);
  const popup = guideText[language].popup;
  const sections = appPopupSections(deviceSection);
  const onPhone = sections.length === 1;

  useEffect(() => dialog.current?.focus(), []);

  return (
    <div className="scrim">
      <div
        ref={dialog}
        tabIndex={-1}
        className="leaf dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-popup-title"
        aria-describedby="app-popup-description"
      >
        <div className="dialog-head">
          <h2 id="app-popup-title" className="leaf-title">
            {popup.title}
          </h2>
          <button type="button" onClick={onDismiss} className="btn btn-quiet btn-icon" aria-label={t('close')}>
            <X size={18} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
        <p id="app-popup-description" className="lede text-sm">
          {popup.body}
        </p>
        <div className={`dialog-actions ${onPhone ? '' : 'app-popup-choices'}`}>
          {onPhone && (
            <button type="button" onClick={onDismiss} className="btn btn-quiet">
              {t('close')}
            </button>
          )}
          {sections.map((section) => (
            // Opening a guide counts as seen: the pop-up has done its job
            <a
              key={section}
              href={guideHash(section)}
              onClick={onDismiss}
              className={`btn ${onPhone ? 'btn-primary' : ''}`}
            >
              {popup.guideFor[section]}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
