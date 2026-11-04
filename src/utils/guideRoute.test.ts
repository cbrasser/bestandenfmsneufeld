import { describe, expect, it } from 'vitest';
import { guideHash, parseGuideHash, sectionForDevice } from './guideRoute';

describe('parseGuideHash', () => {
  it('opens the guide without a chosen section at #app', () => {
    expect(parseGuideHash('#app')).toEqual({ section: null });
  });

  it('opens the guide at the section named in the hash', () => {
    expect(parseGuideHash('#app/android')).toEqual({ section: 'android' });
    expect(parseGuideHash('#app/iphone')).toEqual({ section: 'iphone' });
  });

  it('still opens the guide when the section is unknown', () => {
    expect(parseGuideHash('#app/windows')).toEqual({ section: null });
  });

  it('leaves other addresses to the rest of the site', () => {
    expect(parseGuideHash('')).toBeNull();
    expect(parseGuideHash('#')).toBeNull();
    expect(parseGuideHash('#admin')).toBeNull();
    expect(parseGuideHash('#application')).toBeNull();
  });
});

describe('guideHash', () => {
  it('builds the link the pop-up needs for each section', () => {
    expect(guideHash('android')).toBe('#app/android');
    expect(guideHash('iphone')).toBe('#app/iphone');
  });
});

describe('sectionForDevice', () => {
  const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36';
  const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
  const IPAD_AS_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15';
  const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36';

  it('picks the Android section on an Android phone', () => {
    expect(sectionForDevice(ANDROID, 5)).toBe('android');
  });

  it('picks the iPhone section on an iPhone', () => {
    expect(sectionForDevice(IPHONE, 5)).toBe('iphone');
  });

  it('picks the iPhone section on an iPad, which reports itself as a Mac with touch', () => {
    expect(sectionForDevice(IPAD_AS_MAC, 5)).toBe('iphone');
  });

  it('picks nothing on a computer', () => {
    expect(sectionForDevice(IPAD_AS_MAC, 0)).toBeNull();
    expect(sectionForDevice(WINDOWS, 0)).toBeNull();
  });
});
