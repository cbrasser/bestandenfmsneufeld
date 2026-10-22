import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/bricolage-grotesque/wght.css'
import '@fontsource-variable/manrope/wght.css'
import './index.css'
import Root from './Root.tsx'
import { I18nProvider } from './i18n/context.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import { Analytics } from '@vercel/analytics/react'

// Paint the saved theme and year's hue from the first frame, before React has loaded the data
try {
  const theme = localStorage.getItem('theme') ?? 'system';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && prefersDark));

  const saved = JSON.parse(localStorage.getItem('student-data') ?? 'null');
  if (saved?.studentInfo) {
    document.documentElement.dataset.year = String(saved.currentYear);
  }
} catch {
  // unreadable storage: the page starts on the neutral ground
}

// The browser chrome takes the page's ground: it follows the year and the theme
const syncThemeColor = () => {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;visibility:hidden;background:var(--page)';
  document.body.appendChild(probe);
  const ground = getComputedStyle(probe).backgroundColor;
  probe.remove();

  // The dark ground is a colour mix; paint it once to read it back as plain rgb
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', `rgb(${r}, ${g}, ${b})`);
};
new MutationObserver(syncThemeColor).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['class', 'data-year'],
});
syncThemeColor();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <Root />
        <Analytics />
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
)
