import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const root = createRoot(document.getElementById('root')!)

if (typeof globalThis.Temporal === 'undefined') {
  root.render(
    <StrictMode>
      <main className="flex min-h-svh items-center justify-center px-6 py-12">
        <section className="w-full max-w-md rounded-2xl border bg-card p-8" role="alert">
          <p className="mb-5 text-sm font-medium text-primary">同刻 · 世界时间</p>
          <h1 className="text-xl font-medium">当前浏览器暂不支持</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            同刻需要浏览器原生支持 Temporal API。请升级浏览器，或使用支持此 API 的浏览器后重新打开。
          </p>
        </section>
      </main>
    </StrictMode>,
  )
} else {
  const { default: App } = await import('./App.tsx')
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
