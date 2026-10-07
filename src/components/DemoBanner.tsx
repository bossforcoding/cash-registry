'use client'

import { isDemo } from '@/lib/supabase'
import { resetDemoData } from '@/lib/demoClient'

export default function DemoBanner() {
  if (!isDemo) return null
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-200 text-xs px-4 py-2 text-center">
      Demo: dati fittizi salvati solo nel tuo browser.{' '}
      <button
        className="underline underline-offset-2 hover:text-amber-100"
        onClick={() => { resetDemoData(); window.location.reload() }}
      >
        Ripristina dati
      </button>
    </div>
  )
}
