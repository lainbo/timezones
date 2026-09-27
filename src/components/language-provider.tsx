import { useEffect, useState, type ReactNode } from 'react'
import { I18nContext, languageKey, messages, readLocale, type Locale } from '@/lib/i18n'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState(readLocale)
  const [languageStorageOk, setLanguageStorageOk] = useState(true)
  const t = messages[locale]

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = t.pageTitle
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.description)
  }, [locale, t])

  function setLocale(next: Locale) {
    setLocaleState(next)
    try {
      localStorage.setItem(languageKey, next)
      setLanguageStorageOk(true)
    } catch {
      setLanguageStorageOk(false)
    }
  }

  return (
    <I18nContext.Provider value={{ locale, t, setLocale, languageStorageOk }}>
      {children}
    </I18nContext.Provider>
  )
}
