'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { MESI } from '@/lib/categories'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MonthRow {
  mese: string
  spese: number
  entrate: number
  netInv: number   // ROI - costi investimento
  risparmio: number
}

function fmt(n: number) {
  if (n === 0) return '—'
  return (n < 0 ? '-' : '') + Math.abs(n).toFixed(0) + '€'
}

export default function BilancioPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [rows, setRows] = useState<MonthRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`)

    const map: Record<number, { spese: number; entrate: number; roi: number; invCosts: number }> = {}
    for (let i = 0; i < 12; i++) map[i] = { spese: 0, entrate: 0, roi: 0, invCosts: 0 }

    for (const t of data ?? []) {
      const m = new Date(t.date).getMonth()
      if (t.type === 'spesa')             map[m].spese    += t.amount
      else if (t.type === 'entrata')      map[m].entrate  += t.amount
      else if (t.type === 'investimento') {
        if (t.category === 'ROI')         map[m].roi      += t.amount
        else                              map[m].invCosts += t.amount
      }
    }

    setRows(MESI.map((mese, i) => {
      const netInv = map[i].roi - map[i].invCosts
      return {
        mese,
        spese:    map[i].spese,
        entrate:  map[i].entrate,
        netInv,
        risparmio: map[i].entrate - map[i].spese + netInv,
      }
    }))
    setLoading(false)
  }, [year])

  useEffect(() => { fetchData() }, [fetchData])

  const totals = rows.reduce(
    (acc, r) => ({
      spese:    acc.spese    + r.spese,
      entrate:  acc.entrate  + r.entrate,
      netInv:   acc.netInv   + r.netInv,
      risparmio: acc.risparmio + r.risparmio,
    }),
    { spese: 0, entrate: 0, netInv: 0, risparmio: 0 }
  )

  return (
    <div className="px-4 pt-4">
      <h1 className="text-xl font-bold mb-4">Bilancio annuale</h1>

      <div className="flex items-center justify-between mb-4 bg-slate-900 rounded-2xl px-4 py-3">
        <button onClick={() => setYear(y => y - 1)} className="p-1 hover:text-white text-slate-400 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <span className="font-semibold">{year}</span>
        <button onClick={() => setYear(y => y + 1)} className="p-1 hover:text-white text-slate-400 transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      {loading ? (
        <p className="text-center text-slate-500 py-10 text-sm">Caricamento...</p>
      ) : (
        <div className="bg-slate-900 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-5 px-3 py-2 text-xs font-semibold text-slate-500 border-b border-slate-800">
            <span>Mese</span>
            <span className="text-right">Entrate</span>
            <span className="text-right">Spese</span>
            <span className="text-right">Invest.</span>
            <span className="text-right">Risp.</span>
          </div>

          {rows.map((r, i) => {
            const hasData = r.spese > 0 || r.entrate > 0 || r.netInv !== 0
            return (
              <div
                key={r.mese}
                className={`grid grid-cols-5 px-3 py-2.5 text-xs border-b border-slate-800 last:border-0 ${
                  !hasData ? 'opacity-40' : ''
                } ${i === now.getMonth() && year === now.getFullYear() ? 'bg-slate-800/50' : ''}`}
              >
                <span className="font-medium text-slate-300">{r.mese.substring(0, 3)}</span>
                <span className="text-right text-green-400 tabular-nums">
                  {r.entrate > 0 ? r.entrate.toFixed(0) + '€' : '—'}
                </span>
                <span className="text-right text-red-400 tabular-nums">
                  {r.spese > 0 ? r.spese.toFixed(0) + '€' : '—'}
                </span>
                <span className={`text-right tabular-nums ${r.netInv >= 0 ? 'text-purple-400' : 'text-orange-400'}`}>
                  {hasData ? fmt(r.netInv) : '—'}
                </span>
                <span className={`text-right font-semibold tabular-nums ${
                  r.risparmio > 0 ? 'text-blue-400' : r.risparmio < 0 ? 'text-orange-400' : 'text-slate-500'
                }`}>
                  {hasData ? fmt(r.risparmio) : '—'}
                </span>
              </div>
            )
          })}

          <div className="grid grid-cols-5 px-3 py-3 text-xs font-bold border-t-2 border-slate-700 bg-slate-800/50">
            <span className="text-slate-300">TOT</span>
            <span className="text-right text-green-400 tabular-nums">{totals.entrate.toFixed(0)}€</span>
            <span className="text-right text-red-400 tabular-nums">{totals.spese.toFixed(0)}€</span>
            <span className={`text-right tabular-nums ${totals.netInv >= 0 ? 'text-purple-400' : 'text-orange-400'}`}>
              {fmt(totals.netInv)}
            </span>
            <span className={`text-right tabular-nums ${totals.risparmio >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
              {fmt(totals.risparmio)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
