'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Transaction } from '@/lib/types'
import { MESI, categoryColor } from '@/lib/categories'
import { useRouter } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 2019 }, (_, i) => CURRENT_YEAR - i)

interface MonthlyRow {
  idx: number; mese: string
  entrate: number; spese: number; roi: number; invCosts: number
}

function buildMonthly(txs: Transaction[]): MonthlyRow[] {
  const map: Record<number, MonthlyRow> = {}
  for (let i = 0; i < 12; i++)
    map[i] = { idx: i, mese: MESI[i].substring(0, 3), entrate: 0, spese: 0, roi: 0, invCosts: 0 }
  for (const t of txs) {
    const m = new Date(t.date + 'T00:00:00').getMonth()
    if (t.type === 'entrata')           map[m].entrate  += t.amount
    else if (t.type === 'spesa')        map[m].spese    += t.amount
    else if (t.type === 'investimento') {
      if (t.category === 'ROI')         map[m].roi      += t.amount
      else                              map[m].invCosts += t.amount
    }
  }
  return Array.from({ length: 12 }, (_, i) => ({
    ...map[i],
    spese:    parseFloat(map[i].spese.toFixed(2)),
    entrate:  parseFloat(map[i].entrate.toFixed(2)),
    roi:      parseFloat(map[i].roi.toFixed(2)),
    invCosts: parseFloat(map[i].invCosts.toFixed(2)),
  }))
}

// Entrate = entrate + ROI, Spese = spese + investimenti
function display(monthly: MonthlyRow[]) {
  const entrate  = monthly.reduce((s, d) => s + d.entrate + d.roi, 0)
  const spese    = monthly.reduce((s, d) => s + d.spese + d.invCosts, 0)
  return { entrate, spese, risparmio: entrate - spese }
}

function pct(curr: number, prev: number) {
  if (prev === 0) return null
  return ((curr - prev) / Math.abs(prev)) * 100
}

export default function Dashboard() {
  const now = new Date()
  const router = useRouter()
  const [year, setYear] = useState(now.getFullYear())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [prevTransactions, setPrevTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: curr }, { data: prev }] = await Promise.all([
      supabase.from('transactions').select('*').gte('date', `${year}-01-01`).lte('date', `${year}-12-31`),
      supabase.from('transactions').select('*').gte('date', `${year - 1}-01-01`).lte('date', `${year - 1}-12-31`),
    ])
    setTransactions(curr ?? [])
    setPrevTransactions(prev ?? [])
    setLoading(false)
  }, [year])

  useEffect(() => { fetchData() }, [fetchData])

  const monthly     = buildMonthly(transactions)
  const prevMonthly = buildMonthly(prevTransactions)
  const tot         = display(monthly)
  const prevTot     = display(prevMonthly)

  // Grafico mensile: entrate + ROI vs spese + invCosts
  const chartMonthly = monthly.map(d => ({
    mese:    d.mese,
    entrate: parseFloat((d.entrate + d.roi).toFixed(2)),
    spese:   parseFloat((d.spese + d.invCosts).toFixed(2)),
  }))

  // Spese per categoria: spesa + investimenti (non-ROI)
  const catSpeseMap = transactions
    .filter(t => t.type === 'spesa')
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.amount
      return acc
    }, {})
  const catData = Object.entries(catSpeseMap)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)), color: categoryColor(name) }))
    .sort((a, b) => b.value - a.value)

  // Entrate per categoria: entrata + ROI
  const catEntrateMap = transactions
    .filter(t => t.type === 'entrata' || (t.type === 'investimento' && t.category === 'ROI'))
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.amount
      return acc
    }, {})
  const catEntrateData = Object.entries(catEntrateMap)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)), color: categoryColor(name) }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="px-4 pt-5 pb-4">
      <div className="flex items-center justify-between gap-3 mb-5">
        <select
          value={year}
          onChange={e => setYear(parseInt(e.target.value))}
          aria-label="Anno"
          className="select-base card rounded-xl pl-4 py-2.5 text-lg font-bold focus:outline-none focus:border-brand transition-colors"
        >
          {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <ThemeToggle />
      </div>

      {loading ? (
        <p className="text-center text-fg-3 py-16 text-sm animate-pulse">Caricamento...</p>
      ) : (
        <>
          {/* Totali anno */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatCard label="Entrate"   amount={tot.entrate}   color="text-pos"  icon={<TrendingUp size={14} />}
              delta={pct(tot.entrate, prevTot.entrate)} />
            <StatCard label="Spese"     amount={tot.spese}     color="text-neg"    icon={<TrendingDown size={14} />}
              delta={pct(tot.spese, prevTot.spese)} invertDelta />
            <StatCard label="Risparmio" amount={tot.risparmio} icon={<Wallet size={14} />}
              color={tot.risparmio >= 0 ? 'text-brand' : 'text-warn'}
              delta={pct(tot.risparmio, prevTot.risparmio)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          {/* Entrate vs Spese */}
          <div className="card rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-fg mb-3">Entrate vs Spese</h3>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={chartMonthly} margin={{ top: 0, right: 0, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line-strong)" />
                <XAxis dataKey="mese" tick={{ fontSize: 9, fill: 'var(--fg-3)' }} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--fg-3)' }} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line-strong)', color: 'var(--fg)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`${Number(v).toFixed(0)}€`, '']} />
                <Bar dataKey="entrate" name="Entrate" fill="var(--pos)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="spese"   name="Spese"   fill="var(--neg)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Breakdown mensile */}
          <div className="card rounded-2xl overflow-hidden lg:row-span-2">
            <div className="grid grid-cols-5 px-3 py-2 border-b border-line">
              <span className="text-xs text-fg-3">Mese</span>
              <span className="text-xs text-fg-3 text-right">Entr.</span>
              <span className="text-xs text-fg-3 text-right">Spese</span>
              <span className="text-xs text-fg-3 text-right">ROI</span>
              <span className="text-xs text-fg-3 text-right">Netto</span>
            </div>
            {monthly.map((d) => {
              const netRoi  = d.roi - d.invCosts
              const netto   = d.entrate + netRoi - d.spese
              const prevD   = prevMonthly[d.idx]
              const prevNetto = (prevD.entrate + prevD.roi - prevD.invCosts) - prevD.spese
              const delta   = pct(netto, prevNetto)
              const hasData = d.entrate > 0 || d.spese > 0 || d.roi > 0 || d.invCosts > 0
              return (
                <button key={d.idx}
                  onClick={() => router.push(`/statistiche?month=${d.idx}&year=${year}`)}
                  className={`w-full grid grid-cols-5 px-3 py-2.5 border-b border-line last:border-0 text-left transition-colors ${hasData ? 'hover:bg-surface-2' : 'opacity-40 cursor-default'}`}>
                  <span className="text-xs">{MESI[d.idx].substring(0, 3)}</span>
                  <span className="text-xs text-right tabular-nums text-pos">
                    {d.entrate > 0 ? `+${d.entrate.toFixed(0)}€` : '—'}
                  </span>
                  <span className="text-xs text-right tabular-nums text-neg">
                    {d.spese > 0 ? `-${d.spese.toFixed(0)}€` : '—'}
                  </span>
                  <span className="text-xs text-right tabular-nums text-inv">
                    {(d.roi > 0 || d.invCosts > 0) ? `${netRoi >= 0 ? '+' : ''}${netRoi.toFixed(0)}€` : '—'}
                  </span>
                  <div className="flex flex-col items-end">
                    <span className={`text-xs tabular-nums font-medium ${netto >= 0 ? 'text-brand' : 'text-warn'}`}>
                      {hasData ? `${netto >= 0 ? '+' : ''}${netto.toFixed(0)}€` : '—'}
                    </span>
                    {delta != null && hasData && (
                      <span className={`text-[9px] tabular-nums ${delta >= 0 ? 'text-pos' : 'text-neg'}`}>
                        {delta >= 0 ? '▲' : '▼'}{Math.abs(delta).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Spese per categoria */}
          {catData.length > 0 && (
            <div className="card rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-fg mb-1">Spese per categoria</h3>
              <p className="text-xs text-fg-3 mb-3">Totale {year} — {tot.spese.toFixed(0)}€</p>
              <ResponsiveContainer width="100%" height={catData.length * 34 + 10}>
                <BarChart data={catData} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--fg-3)' }} tickFormatter={v => `${v}€`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--fg-2)' }} width={115} />
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line-strong)', color: 'var(--fg)', borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [`${Number(v).toFixed(2)}€`, '']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} minPointSize={3}
                    label={{ position: 'right', fontSize: 10, fill: 'var(--fg-3)', formatter: (v: unknown) => `${Number(v).toFixed(0)}€` }}>
                    {catData.map((_, i) => <Cell key={i} fill={catData[i].color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Entrate per categoria */}
          {catEntrateData.length > 0 && (
            <div className="card rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-fg mb-1">Entrate per categoria</h3>
              <p className="text-xs text-fg-3 mb-3">Totale {year} — {tot.entrate.toFixed(0)}€</p>
              <ResponsiveContainer width="100%" height={catEntrateData.length * 34 + 10}>
                <BarChart data={catEntrateData} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--fg-3)' }} tickFormatter={v => `${v}€`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--fg-2)' }} width={115} />
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line-strong)', color: 'var(--fg)', borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [`${Number(v).toFixed(2)}€`, '']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} minPointSize={3}
                    label={{ position: 'right', fontSize: 10, fill: 'var(--fg-3)', formatter: (v: unknown) => `${Number(v).toFixed(0)}€` }}>
                    {catEntrateData.map((_, i) => <Cell key={i} fill={catEntrateData[i].color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, amount, color, icon, delta, invertDelta }: {
  label: string; amount: number; color: string; icon: React.ReactNode
  delta?: number | null; invertDelta?: boolean
}) {
  const deltaPositive = delta != null ? (invertDelta ? delta < 0 : delta >= 0) : false
  return (
    <div className="card rounded-2xl p-3 md:p-4">
      <div className={`flex items-center gap-1.5 mb-1.5 ${color}`}>
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-lg md:text-2xl font-bold tabular-nums tracking-tight ${color}`}>
        {amount >= 0 ? '' : '-'}{Math.abs(amount).toFixed(0)}€
      </p>
      {delta != null && (
        <p className={`text-[11px] tabular-nums mt-0.5 ${deltaPositive ? 'text-pos' : 'text-neg'}`}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(0)}% <span className="hidden sm:inline">vs anno prec.</span>
        </p>
      )}
    </div>
  )
}
