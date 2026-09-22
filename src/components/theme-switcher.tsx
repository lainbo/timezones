import { useEffect, useState, type MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? '#141a17' : '#f6f6f2')
}

export function ThemeSwitcher() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const followSystem = () => {
      if (document.documentElement.dataset.theme !== 'system') return
      applyTheme(media.matches)
      setDark(media.matches)
    }
    followSystem()
    media.addEventListener('change', followSystem)
    return () => media.removeEventListener('change', followSystem)
  }, [])

  async function toggleTheme(event: MouseEvent<HTMLButtonElement>) {
    const nextDark = !dark
    const update = () => {
      const theme = nextDark ? 'dark' : 'light'
      document.documentElement.dataset.theme = theme
      applyTheme(nextDark)
      setDark(nextDark)
      try {
        localStorage.setItem('same-moment.theme', theme)
      } catch {
        // 存储被禁用时，主题仍在当前页面生效。
      }
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      update()
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

    setSwitching(true)
    const transition = document.startViewTransition(() => flushSync(update))
    try {
      await transition.ready
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        {
          duration: 500,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      )
      await transition.finished
    } catch {
      // 页面隐藏时，浏览器可能跳过过渡动画。
    } finally {
      setSwitching(false)
    }
  }

  const label = dark ? '切换到浅色模式' : '切换到深色模式'

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={label}
      title={label}
      disabled={switching}
      onClick={toggleTheme}
      className="size-8 shrink-0 border-border bg-transparent shadow-none disabled:opacity-100"
    >
      {dark ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </Button>
  )
}
