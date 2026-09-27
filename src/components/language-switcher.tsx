import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'

export function LanguageSwitcher() {
  const { locale, t, setLocale } = useI18n()
  const next = locale === 'en' ? 'zh-CN' : 'en'
  return (
    <Button
      variant="outline"
      className="h-8 shrink-0 gap-1.5 border-border bg-transparent px-2 text-xs shadow-none"
      aria-label={t.switchLanguage}
      title={t.switchLanguage}
      onClick={() => setLocale(next)}
    >
      <Languages className="size-4" />
      <span lang={next}>{next === 'zh-CN' ? '中文' : 'English'}</span>
    </Button>
  )
}
