// The app guide lives at /#app; /#app/android and /#app/iphone open one section
export type GuideSection = 'android' | 'iphone';

export const guideHash = (section: GuideSection) => `#app/${section}`;

export const parseGuideHash = (hash: string): { section: GuideSection | null } | null => {
  if (hash === '#app') return { section: null };
  if (!hash.startsWith('#app/')) return null;
  const section = hash.slice('#app/'.length);
  return { section: section === 'android' || section === 'iphone' ? section : null };
};

// Which section fits this device; null on a computer, where both are equally likely
export const sectionForDevice = (userAgent: string, maxTouchPoints: number): GuideSection | null => {
  if (/android/i.test(userAgent)) return 'android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iphone';
  if (/macintosh/i.test(userAgent) && maxTouchPoints > 1) return 'iphone';
  return null;
};
