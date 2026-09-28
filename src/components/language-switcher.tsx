import { useRef } from 'react'
import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useI18n, type Locale } from '@/lib/i18n'

const languages: { locale: Locale; name: string }[] = [
  { locale: 'en', name: 'English' },
  { locale: 'zh-CN', name: '简体中文' },
]

export function LanguageSwitcher() {
  const { locale, t, setLocale } = useI18n()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const selectedByPointer = useRef(false)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          size="icon"
          aria-label={t.language}
          title={t.language}
          className="size-8 shrink-0 border-border bg-transparent shadow-none"
        >
          <Languages className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onCloseAutoFocus={(event) => {
          if (!selectedByPointer.current) return
          selectedByPointer.current = false
          // Radix 关闭菜单后用脚本聚焦按钮，Chrome 会因此显示键盘焦点框；鼠标选择时去掉焦点框。
          event.preventDefault()
          triggerRef.current?.focus({ focusVisible: false })
        }}
      >
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(value) => setLocale(value as Locale)}
        >
          {languages.map(({ locale, name }) => (
            <DropdownMenuRadioItem
              key={locale}
              value={locale}
              lang={locale}
              onPointerUp={() => {
                selectedByPointer.current = true
              }}
            >
              {name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
