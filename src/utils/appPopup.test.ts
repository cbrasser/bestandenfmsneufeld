import { describe, expect, it } from 'vitest';
import { appPopupSections, createAppPopupDismissal, isAppleHomeScreenInstall, shouldShowAppPopup } from './appPopup';
import type { KeyValueStorage } from './storage';

describe('shouldShowAppPopup', () => {
  const clear = { conflictPrompt: 'none', dismissed: false, homeScreenInstall: false, otherDialogOpen: false } as const;

  it('shows when nothing stands in its way', () => {
    expect(shouldShowAppPopup(clear)).toBe(true);
  });

  it('waits while a conflict prompt may still come, and gives way to one that is up', () => {
    expect(shouldShowAppPopup({ ...clear, conflictPrompt: 'pending' })).toBe(false);
    expect(shouldShowAppPopup({ ...clear, conflictPrompt: 'showing' })).toBe(false);
  });

  it('stays away once dismissed', () => {
    expect(shouldShowAppPopup({ ...clear, dismissed: true })).toBe(false);
  });

  it('stays away in an iPhone home-screen install', () => {
    expect(shouldShowAppPopup({ ...clear, homeScreenInstall: true })).toBe(false);
  });

  it('does not interrupt another dialog or the menu', () => {
    expect(shouldShowAppPopup({ ...clear, otherDialogOpen: true })).toBe(false);
  });
});

describe('appPopupSections', () => {
  it('offers the one guide that fits a phone', () => {
    expect(appPopupSections('android')).toEqual(['android']);
    expect(appPopupSections('iphone')).toEqual(['iphone']);
  });

  it('offers both on a computer', () => {
    expect(appPopupSections(null)).toEqual(['android', 'iphone']);
  });
});

describe('isAppleHomeScreenInstall', () => {
  it('is true on an iPhone opened from the home screen', () => {
    expect(isAppleHomeScreenInstall('iphone', true, true)).toBe(true);
  });

  it('trusts either signal on an iPhone, as neither is guaranteed', () => {
    expect(isAppleHomeScreenInstall('iphone', true, false)).toBe(true);
    expect(isAppleHomeScreenInstall('iphone', undefined, true)).toBe(true);
  });

  it('is false in Safari on an iPhone', () => {
    expect(isAppleHomeScreenInstall('iphone', false, false)).toBe(false);
  });

  it('errs towards staying away when only Apple\'s own signal is set on a device not recognised as one', () => {
    expect(isAppleHomeScreenInstall(null, true, false)).toBe(true);
  });

  it('is false in an Android home-screen install, whose student the app is meant for', () => {
    expect(isAppleHomeScreenInstall('android', undefined, true)).toBe(false);
  });

  it('is false in an installed site on a computer', () => {
    expect(isAppleHomeScreenInstall(null, undefined, true)).toBe(false);
  });
});

describe('createAppPopupDismissal', () => {
  const memoryStorage = (): KeyValueStorage => {
    const items = new Map<string, string>();
    return {
      getItem: (key) => items.get(key) ?? null,
      setItem: (key, value) => void items.set(key, value),
      removeItem: (key) => void items.delete(key),
    };
  };
  const unavailable = (): KeyValueStorage => {
    throw new Error('Storage is blocked');
  };

  it('starts out not dismissed', () => {
    expect(createAppPopupDismissal(memoryStorage).isDismissed()).toBe(false);
  });

  it('remembers a dismissal across page loads', () => {
    const storage = memoryStorage();
    createAppPopupDismissal(() => storage).dismiss();
    expect(createAppPopupDismissal(() => storage).isDismissed()).toBe(true);
  });

  it('still stays dismissed until the page reloads when storage is unavailable', () => {
    const dismissal = createAppPopupDismissal(unavailable);
    expect(dismissal.isDismissed()).toBe(false);
    expect(() => dismissal.dismiss()).not.toThrow();
    expect(dismissal.isDismissed()).toBe(true);
  });

  it('still stays dismissed when storage is full', () => {
    const dismissal = createAppPopupDismissal(() => ({
      ...memoryStorage(),
      setItem: () => {
        throw new Error('Quota exceeded');
      },
    }));
    dismissal.dismiss();
    expect(dismissal.isDismissed()).toBe(true);
  });
});
