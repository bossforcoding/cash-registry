'use client'

import { isDemo } from '@/lib/supabase'
import { resetDemoData } from '@/lib/demoClient'

export default function DemoBanner() {
  if (!isDemo) return null
  return (
    <div className="bg-warn/10 border-b border-warn/30 text-warn text-xs px-4 py-2 text-center">
      Demo: dati fittizi salvati solo nel tuo browser.{' '}
      <button
        className="underline underline-offset-2 hover:opacity-80"
        onClick={() => { resetDemoData(); window.location.reload() }}
      >
        Ripristina dati
      </button>
    </div>
  )
}
