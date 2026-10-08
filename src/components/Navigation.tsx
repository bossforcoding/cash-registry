'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Plus, List, BarChart2, Settings2 } from 'lucide-react'

const items = [
  { href: '/',            label: 'Home',     icon: Home },
  { href: '/transazioni', label: 'Lista',    icon: List },
  { href: '/aggiungi',    label: 'Aggiungi', icon: Plus },
  { href: '/statistiche', label: 'Stats',    icon: BarChart2 },
  { href: '/gestione',    label: 'Gestione', icon: Settings2 },
]

export default function Navigation() {
  const pathname = usePathname()
  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 flex justify-center px-3"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 10px)' }}
    >
      <nav className="flex w-full max-w-[480px] h-[62px] items-center rounded-[26px] border border-line-strong bg-surface/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === '/gestione'
            ? pathname.startsWith('/gestione') || pathname.startsWith('/categorie') || pathname.startsWith('/spese-fisse')
            : pathname === href
          if (href === '/aggiungi') {
            return (
              <Link key={href} href={href} aria-label={label} className="flex-1 flex justify-center">
                <span className={`w-11 h-11 rounded-2xl flex items-center justify-center bg-brand text-white shadow-lg shadow-brand/30 transition-transform active:scale-95 ${active ? 'ring-2 ring-brand/40 ring-offset-2 ring-offset-surface' : ''}`}>
                  <Icon size={22} strokeWidth={2.4} />
                </span>
              </Link>
            )
          }
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 transition-colors ${
                active ? 'text-brand' : 'text-fg-3 hover:text-fg'
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.3 : 1.8} />
              <span className="text-[9px] font-semibold tracking-wide">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
