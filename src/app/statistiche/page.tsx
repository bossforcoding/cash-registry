'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Transaction } from '@/lib/types'
import { categoryColor, MESI } from '@/lib/categories'
import MonthSelector from '@/components/MonthSelector'
import TransactionCard from '@/components/TransactionCard'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis,
} from 'recharts'
import { TrendingDown, TrendingUp, Wallet, ChevronDown, ChevronUp } from 'lucide-react'

function StatisticheMensili() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const now = new Date()

  const initMonth = searchParams.get('month') !== null ? parseInt(searchParams.get('month')!) : now.getMonth()
  const initYear  = searchParams.get('year')  !== null ? parseInt(searchParams.get('year')!)  : now.getFullYear()

  const [month, setMonth] = useState(initMonth)
  const [year, setYear]   = useState(initYear)

  useEffect(() => {
    router.replace(`/statistiche?month=${month}&year=${year}`, { scroll: false })
  }, [month, year, router])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading]           = useState(true)

  // Trend categoria
  const [selectedCat, setSelectedCat]   = useState<string | null>(null)
  const [catTrend, setCatTrend]         = useState<{ mese: string; importo: number }[]>([])
  const [loadingTrend, setLoadingTrend] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = new Date(year, month + 1, 0).getDate()
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`
    const { data } = await supabase
      .from('transactions').select('*')
      .gte('date', from).lte('date', to)
      .order('date', { ascending: false })
    setTransactions(data ?? [])
    setLoading(false)
  }, [month, year])

  useEffect(() => { fetchData() }, [fetchData])

  // Reset trend when month/year changes
  useEffect(() => {
    setSelectedCat(null)
    setCatTrend([])
  }, [month, year])

  async function loadCategoryTrend(catName: string) {
    if (selectedCat === catName) {
      setSelectedCat(null)
      setCatTrend([])
      return
    }
    setSelectedCat(catName)
    setLoadingTrend(true)
    const { data } = await supabase
      .from('transactions').select('date, amount')
      .eq('type', 'spesa').eq('category', catName)
      .gte('date', `${year}-01-01`).lte('date', `${year}-12-31`)
    const monthMap: Record<number, number> = {}
    for (let i = 0; i < 12; i++) monthMap[i] = 0
    for (const t of data ?? []) {
      const m = new Date(t.date + 'T00:00:00').getMonth()
      monthMap[m] += t.amount
    }
    setCatTrend(Array.from({ length: 12 }, (_, i) => ({
      mese: MESI[i].substring(0, 3),
      importo: parseFloat(monthMap[i].toFixed(2)),
    })))
    setLoadingTrend(false)
  }

  // investimenti non-ROI → spese, ROI → entrate
  const speseEx    = transactions.filter(t => t.type === 'spesa' || (t.type === 'investimento' && t.category !== 'ROI'))
  const entrateEx  = transactions.filter(t => t.type === 'entrata' || (t.type === 'investimento' && t.category === 'ROI'))
  const totSpese   = speseEx.reduce((s, t) => s + t.amount, 0)
  const totEntrate = entrateEx.reduce((s, t) => s + t.amount, 0)
  const risparmio  = totEntrate - totSpese

  const byCategory = transactions.filter(t => t.type === 'spesa').reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount
    return acc
  }, {})
  const pieData = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)), color: categoryColor(name) }))
    .sort((a, b) => b.value - a.value)

  const selectedCatColor = pieData.find(p => p.name === selectedCat)?.color ?? '#64748b'

  return (
    <div className="px-4 pt-4 pb-4">
      <h1 className="text-xl font-bold mb-4">Statistiche</h1>

      <MonthSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y) }} />

      {loading ? (
        <p className="text-center text-slate-500 py-10 text-sm">Caricamento...</p>
      ) : (
        <>
          {/* Schede riassuntive */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <SummaryCard label="Entrate"   amount={totEntrate}  color="text-green-400" icon={<TrendingUp size={14} />} />
            <SummaryCard label="Spese"     amount={totSpese}    color="text-red-400"   icon={<TrendingDown size={14} />} />
            <SummaryCard label="Risparmio" amount={risparmio}   color={risparmio >= 0 ? 'text-blue-400' : 'text-orange-400'} icon={<Wallet size={14} />} />
          </div>

          {/* Torta + trend categoria */}
          <div className="bg-slate-900 rounded-2xl p-4 mb-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-1">
              Spese — {totSpese.toFixed(2)}€
            </h3>
            {pieData.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center">Nessuna spesa</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85}
                      dataKey="value" strokeWidth={0}>
                      {pieData.map((_, i) => <Cell key={i} fill={pieData[i].color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${Number(v).toFixed(2)}€`, '']}
                      contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>

                <p className="text-[10px] text-slate-500 mb-2">Tocca una categoria per vedere il trend annuale</p>

                <div className="space-y-1">
                  {pieData.map(({ name, value, color }) => {
                    const isSelected = selectedCat === name
                    return (
                      <div key={name}>
                        <button onClick={() => loadCategoryTrend(name)}
                          className={`w-full flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors text-left ${isSelected ? 'bg-slate-800' : 'hover:bg-slate-800/50'}`}>
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-sm flex-1 text-slate-300">{name}</span>
                          <span className="text-sm font-medium tabular-nums">{value.toFixed(2)}€</span>
                          <span className="text-xs text-slate-500 w-8 text-right">
                            {totSpese > 0 ? ((value / totSpese) * 100).toFixed(0) : 0}%
                          </span>
                          {isSelected
                            ? <ChevronUp size={14} className="text-slate-400 flex-shrink-0" />
                            : <ChevronDown size={14} className="text-slate-600 flex-shrink-0" />}
                        </button>

                        {isSelected && (
                          <div className="mt-2 mb-1 px-1">
                            {loadingTrend ? (
                              <p className="text-slate-500 text-xs text-center py-4">Caricamento...</p>
                            ) : (
                              <>
                                <p className="text-xs text-slate-500 mb-2">
                                  {name} — trend {year}
                                </p>
                                <ResponsiveContainer width="100%" height={130}>
                                  <BarChart data={catTrend} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                                    <XAxis dataKey="mese" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                                    <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
                                    <Tooltip
                                      contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }}
                                      formatter={(v) => [`${Number(v).toFixed(2)}€`, '']} />
                                    <Bar dataKey="importo" fill={selectedCatColor} radius={[3, 3, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Transazioni del mese */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-2">
              Transazioni — {transactions.length} voci
            </h3>
            <div className="bg-slate-900 rounded-2xl overflow-hidden">
              {transactions.length === 0 ? (
                <p className="text-center text-slate-500 py-8 text-sm">
                  Nessuna transazione in {MESI[month]}
                </p>
              ) : (
                transactions.map(t => (
                  <TransactionCard key={t.id} transaction={t} showEdit />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function StatistichePage() {
  return (
    <Suspense>
      <StatisticheMensili />
    </Suspense>
  )
}

function SummaryCard({ label, amount, color, icon }: {
  label: string; amount: number; color: string; icon: React.ReactNode
}) {
  return (
    <div className="bg-slate-900 rounded-2xl p-3">
      <div className={`flex items-center gap-1 mb-1 ${color}`}>
        {icon}
        <span className="text-xs font-medium truncate">{label}</span>
      </div>
      <p className={`text-base font-bold tabular-nums ${color}`}>
        {Math.abs(amount).toFixed(0)}€
      </p>
    </div>
  )
}
