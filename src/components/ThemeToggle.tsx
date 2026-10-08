'use client'
import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'
import { applyTheme, Theme } from '@/lib/theme'

// The theme lives in the class on <html> (set before paint), so read it from there.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}
const getTheme = (): Theme => document.documentElement.classList.contains('dark') ? 'dark' : 'light'

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => null)

  return (
    <button
      onClick={() => applyTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={theme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
      title={theme === 'dark' ? 'Tema chiaro' : 'Tema scuro'}
      className="card w-10 h-10 rounded-xl flex items-center justify-center text-fg-2 hover:text-fg transition-colors"
    >
      {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  )
}
