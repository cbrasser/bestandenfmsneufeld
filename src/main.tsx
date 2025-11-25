import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './i18n/context.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import { Analytics } from '@vercel/analytics/react'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <App />
        <Analytics />
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
)
