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
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 z-50">
      <div className="max-w-2xl mx-auto flex">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === '/gestione'
            ? pathname.startsWith('/gestione') || pathname.startsWith('/categorie') || pathname.startsWith('/spese-fisse')
            : pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors ${
                active ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
