import type { ConflictPromptState } from '../sync/engine';
import type { GuideSection } from './guideRoute';
import { APP_POPUP_KEY, type KeyValueStorage } from './storage';

export const shouldShowAppPopup = ({
  conflictPrompt,
  dismissed,
  homeScreenInstall,
  otherDialogOpen,
}: {
  conflictPrompt: ConflictPromptState;
  dismissed: boolean;
  homeScreenInstall: boolean;
  otherDialogOpen: boolean;
}): boolean => conflictPrompt === 'none' && !dismissed && !homeScreenInstall && !otherDialogOpen;

/** The guides to offer: the device's own, or both on a computer. */
export const appPopupSections = (section: GuideSection | null): GuideSection[] =>
  section ? [section] : ['android', 'iphone'];

/**
 * Whether this is the website opened from an iPhone's home screen, where adding it there no longer
 * applies. `navigator.standalone` exists only on Apple's devices, so it counts on any of them: wrongly
 * skipping the pop-up costs less than telling a student to do what they already did.
 */
export const isIphoneHomeScreenInstall = (
  section: GuideSection | null,
  navigatorStandalone: unknown,
  displayModeStandalone: boolean
): boolean => navigatorStandalone === true || (section === 'iphone' && displayModeStandalone);

/**
 * Whether the student has closed the pop-up here. Browser storage makes that per device and address.
 * Without storage it holds until the page reloads, so that coming back from the guide doesn't bring
 * the pop-up back.
 */
export function createAppPopupDismissal(getStorage: () => KeyValueStorage) {
  let dismissedHere = false;

  return {
    isDismissed(): boolean {
      if (dismissedHere) return true;
      try {
        return getStorage().getItem(APP_POPUP_KEY) !== null;
      } catch {
        return false;
      }
    },
    dismiss(): void {
      dismissedHere = true;
      try {
        getStorage().setItem(APP_POPUP_KEY, new Date().toISOString());
      } catch {
        // Holds for this page; the pop-up may return on the next load
      }
    },
  };
}

/** This browser's dismissal. */
export const appPopupDismissal = createAppPopupDismissal(() => localStorage);
