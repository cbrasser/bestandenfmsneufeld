import { afterEach, describe, expect, it, vi } from 'vitest';
import { dateFromStorage, dateToStorage } from './gradeDate';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe.each(['Europe/Zurich', 'America/New_York', 'Pacific/Auckland', 'UTC'])('a grade date in %s', (timeZone) => {
  it('stores the day that was picked', () => {
    vi.stubEnv('TZ', timeZone);
    // The calendar hands over local midnight.
    expect(dateToStorage(new Date(2026, 10, 12))).toBe('2026-11-12');
  });

  it('stores today, even just after midnight or just before', () => {
    vi.stubEnv('TZ', timeZone);
    expect(dateToStorage(new Date(2026, 10, 12, 0, 30))).toBe('2026-11-12');
    expect(dateToStorage(new Date(2026, 10, 12, 23, 30))).toBe('2026-11-12');
  });

  it('opens a stored date on the same day', () => {
    vi.stubEnv('TZ', timeZone);
    const opened = dateFromStorage('2026-11-12');
    expect([opened?.getFullYear(), opened?.getMonth(), opened?.getDate()]).toEqual([2026, 10, 12]);
  });

  it('keeps the day when a grade is opened and saved again', () => {
    vi.stubEnv('TZ', timeZone);
    expect(dateToStorage(dateFromStorage('2026-03-29')!)).toBe('2026-03-29');
  });
});

describe('dateFromStorage', () => {
  it('leaves a grade without a date without one', () => {
    expect(dateFromStorage(undefined)).toBeUndefined();
    expect(dateFromStorage('')).toBeUndefined();
  });

  it('treats text that is not a date as no date', () => {
    expect(dateFromStorage('not a date')).toBeUndefined();
  });

  it('still reads a full timestamp from an imported file', () => {
    vi.stubEnv('TZ', 'Europe/Zurich');
    const opened = dateFromStorage('2026-11-12T10:00:00.000Z');
    expect([opened?.getFullYear(), opened?.getMonth(), opened?.getDate()]).toEqual([2026, 10, 12]);
  });
});
