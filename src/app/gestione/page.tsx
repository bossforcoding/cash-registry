import Link from 'next/link'
import { Tag, Repeat } from 'lucide-react'

const sections = [
  {
    href: '/spese-fisse',
    icon: Repeat,
    title: 'Spese fisse',
    description: 'Gestisci le voci ricorrenti e applicale a un mese con un tap',
    color: 'text-brand',
    bg: 'bg-brand/10',
  },
  {
    href: '/categorie',
    icon: Tag,
    title: 'Categorie',
    description: 'Aggiungi, rinomina o elimina le categorie di spese ed entrate',
    color: 'text-inv',
    bg: 'bg-inv/10',
  },
]

export default function GestionePage() {
  return (
    <div className="px-4 pt-6">
      <div className="grid gap-3 md:grid-cols-2">
        {sections.map(({ href, icon: Icon, title, description, color, bg }) => (
          <Link key={href} href={href}
            className="flex items-center gap-4 card rounded-2xl p-4 hover:bg-surface-2 transition-colors">
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={24} className={color} />
            </div>
            <div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-fg-3 mt-0.5">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
