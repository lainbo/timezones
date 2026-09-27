import { LanguageSwitcher } from '@/components/language-switcher'
import { useI18n } from '@/lib/i18n'

export function UnsupportedBrowser() {
  const { t, languageStorageOk } = useI18n()
  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border bg-card p-8" role="alert">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-primary">{t.appName}</p>
          <LanguageSwitcher />
        </div>
        <h1 className="text-xl font-medium">{t.browserTitle}</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">{t.browserHint}</p>
        {!languageStorageOk && (
          <p className="mt-3 text-xs text-muted-foreground">{t.storageUnavailable}</p>
        )}
      </section>
    </main>
  )
}
