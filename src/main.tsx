import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LanguageProvider } from '@/components/language-provider'
import { UnsupportedBrowser } from '@/components/unsupported-browser'
import './index.css'

const root = createRoot(document.getElementById('root')!)

const App =
  typeof globalThis.Temporal === 'undefined'
    ? UnsupportedBrowser
    : (await import('./App.tsx')).default

root.render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
)
