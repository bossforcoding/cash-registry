'use client'
import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Transaction, TransactionType } from '@/lib/types'
import { ALL_CATEGORIES, categoriesForType, MESI } from '@/lib/categories'
import TransactionCard from '@/components/TransactionCard'
import { Search, X } from 'lucide-react'

const PAGE_SIZE = 30

const TYPE_LABELS: Record<TransactionType | 'tutti', string> = {
  tutti: 'Tutti', spesa: 'Spese', entrata: 'Entrate', investimento: 'Investimenti'
}

const NOW = new Date()
const CURRENT_YEAR = NOW.getFullYear()
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 2019 }, (_, i) => CURRENT_YEAR - i)

interface Totals { entrate: number; spese: number; investimenti: number }

function TransazioniContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filterYear, setFilterYear] = useState(
    searchParams.get('year') ? parseInt(searchParams.get('year')!) : CURRENT_YEAR
  )
  const [filterMonth, setFilterMonth] = useState(
    searchParams.get('month') ? parseInt(searchParams.get('month')!) : NOW.getMonth() + 1
  )
  const [filterType, setFilterType] = useState<TransactionType | 'tutti'>(
    (searchParams.get('type') as TransactionType | 'tutti') ?? 'tutti'
  )
  const [filterCategory, setFilterCategory] = useState(searchParams.get('category') ?? '')
  const [search, setSearch]           = useState(searchParams.get('search') ?? '')
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') ?? '')
  const [minAmount, setMinAmount]     = useState(searchParams.get('min') ?? '')
  const [maxAmount, setMaxAmount]     = useState(searchParams.get('max') ?? '')
  const [debouncedMin, setDebouncedMin] = useState(searchParams.get('min') ?? '')
  const [debouncedMax, setDebouncedMax] = useState(searchParams.get('max') ?? '')

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalCount, setTotalCount]   = useState(0)
  const [totals, setTotals]           = useState<Totals>({ entrate: 0, spese: 0, investimenti: 0 })
  const [page, setPage]               = useState(0)
  const [hasMore, setHasMore]         = useState(false)
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedMin(minAmount); setDebouncedMax(maxAmount) }, 500)
    return () => clearTimeout(t)
  }, [minAmount, maxAmount])

  const didMount = useRef(false)
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return }
    const params = new URLSearchParams()
    params.set('year', String(filterYear))
    if (filterMonth > 0)          params.set('month', String(filterMonth))
    if (filterType !== 'tutti')   params.set('type', filterType)
    if (filterCategory)           params.set('category', filterCategory)
    if (debouncedSearch.trim())   params.set('search', debouncedSearch.trim())
    if (debouncedMin)             params.set('min', debouncedMin)
    if (debouncedMax)             params.set('max', debouncedMax)
    router.replace(`/transazioni?${params.toString()}`, { scroll: false })
  }, [filterYear, filterMonth, filterType, filterCategory, debouncedSearch, debouncedMin, debouncedMax, router])

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    if (!append) setLoading(true)
    else setLoadingMore(true)

    const from = pageNum * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase.from('transactions').select('*', { count: 'exact' })
    if (filterMonth > 0) {
      const start = `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`
      const endDate = new Date(filterYear, filterMonth, 1)
      const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-01`
      q = q.gte('date', start).lt('date', end)
    } else {
      q = q.gte('date', `${filterYear}-01-01`).lte('date', `${filterYear}-12-31`)
    }
    if (debouncedSearch.trim()) q = q.or(`description.ilike.%${debouncedSearch.trim()}%,category.ilike.%${debouncedSearch.trim()}%`)
    if (filterType !== 'tutti') q = q.eq('type', filterType)
    if (filterCategory)         q = q.eq('category', filterCategory)
    if (debouncedMin)           q = q.gte('amount', parseFloat(debouncedMin))
    if (debouncedMax)           q = q.lte('amount', parseFloat(debouncedMax))

    const { data, count } = await q.order('date', { ascending: false }).range(from, to)
    const fetched = data ?? []
    setTransactions(prev => append ? [...prev, ...fetched] : fetched)
    setTotalCount(count ?? 0)
    setHasMore(from + fetched.length < (count ?? 0))
    setPage(pageNum)
    if (!append) setLoading(false)
    else setLoadingMore(false)
  }, [filterYear, filterMonth, debouncedSearch, filterType, filterCategory, debouncedMin, debouncedMax])

  const fetchTotals = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase.from('transactions').select('type, amount')
    if (filterMonth > 0) {
      const start = `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`
      const endDate = new Date(filterYear, filterMonth, 1)
      const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-01`
      q = q.gte('date', start).lt('date', end)
    } else {
      q = q.gte('date', `${filterYear}-01-01`).lte('date', `${filterYear}-12-31`)
    }
    if (debouncedSearch.trim()) q = q.or(`description.ilike.%${debouncedSearch.trim()}%,category.ilike.%${debouncedSearch.trim()}%`)
    if (filterType !== 'tutti') q = q.eq('type', filterType)
    if (filterCategory)         q = q.eq('category', filterCategory)
    if (debouncedMin)           q = q.gte('amount', parseFloat(debouncedMin))
    if (debouncedMax)           q = q.lte('amount', parseFloat(debouncedMax))
    const { data } = await q
    const t: Totals = { entrate: 0, spese: 0, investimenti: 0 }
    for (const r of data ?? []) {
      if (r.type === 'entrata')           t.entrate      += r.amount
      else if (r.type === 'spesa')        t.spese        += r.amount
      else                                t.investimenti += r.amount
    }
    setTotals(t)
  }, [filterYear, filterMonth, debouncedSearch, filterType, filterCategory, debouncedMin, debouncedMax])

  useEffect(() => { fetchPage(0, false) }, [fetchPage])
  useEffect(() => { fetchTotals() }, [fetchTotals])

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questa transazione?')) return
    await supabase.from('transactions').delete().eq('id', id)
    setTransactions(prev => prev.filter(t => t.id !== id))
    setTotalCount(c => c - 1)
  }

  const categoryOptions = filterType === 'tutti'
    ? ALL_CATEGORIES
    : categoriesForType(filterType as TransactionType)

  const netto = totals.entrate - totals.spese

  return (
    <div className="pt-4">
      {/* Mese + Anno */}
      <div className="px-4 mb-3 flex gap-2">
        <select value={filterMonth}
          onChange={e => { setFilterMonth(parseInt(e.target.value)); setPage(0) }}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors appearance-none">
          <option value={0}>Tutti i mesi</option>
          {MESI.map((nome, i) => <option key={i + 1} value={i + 1}>{nome}</option>)}
        </select>
        <select value={filterYear}
          onChange={e => { setFilterYear(parseInt(e.target.value)); setPage(0) }}
          className="w-28 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors appearance-none">
          {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Ricerca */}
      <div className="px-4 mb-3">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 focus-within:border-blue-500 transition-colors">
          <Search size={16} className="text-slate-500 flex-shrink-0" />
          <input type="text" value={search}
            onChange={e => { setSearch(e.target.value); setFilterCategory('') }}
            placeholder="Cerca descrizione o categoria..."
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none" />
          {search && (
            <button onClick={() => { setSearch(''); setFilterCategory('') }}
              className="text-slate-500 hover:text-slate-300 transition-colors">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Filtro importo */}
      <div className="px-4 mb-3 flex gap-2">
        <input type="number" inputMode="decimal" placeholder="Min €"
          value={minAmount} onChange={e => setMinAmount(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
        <input type="number" inputMode="decimal" placeholder="Max €"
          value={maxAmount} onChange={e => setMaxAmount(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
        {(minAmount || maxAmount) && (
          <button onClick={() => { setMinAmount(''); setMaxAmount('') }}
            className="px-3 text-slate-500 hover:text-slate-300 bg-slate-900 border border-slate-700 rounded-xl transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filtro tipo */}
      <div className="flex gap-2 px-4 mb-2 overflow-x-auto pb-1">
        {(Object.keys(TYPE_LABELS) as (TransactionType | 'tutti')[]).map(t => (
          <button key={t} onClick={() => { setFilterType(t); setFilterCategory('') }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filterType === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}>
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Filtro categoria */}
      <div className="flex gap-2 px-4 mb-3 overflow-x-auto pb-1">
        {categoryOptions.map(({ name, hex }) => {
          const active = filterCategory === name
          return (
            <button key={name} onClick={() => setFilterCategory(active ? '' : name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${
                active ? 'text-white border-transparent' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              style={active ? { backgroundColor: hex, borderColor: hex } : {}}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: active ? 'white' : hex }} />
              {name}
            </button>
          )
        })}
      </div>

      {/* Totali filtrati */}
      {!loading && totalCount > 0 && (
        <div className="mx-4 mb-3 bg-slate-900 rounded-xl px-4 py-2.5 flex items-center gap-3 text-xs">
          <span className="text-green-400 tabular-nums">+{totals.entrate.toFixed(0)}€</span>
          <span className="text-slate-700">|</span>
          <span className="text-red-400 tabular-nums">−{totals.spese.toFixed(0)}€</span>
          <span className="text-slate-700">|</span>
          <span className={`tabular-nums font-medium ${netto >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
            {netto >= 0 ? '+' : ''}{netto.toFixed(0)}€ netto
          </span>
          <span className="ml-auto text-slate-500">{totalCount} voci</span>
        </div>
      )}

      {/* Lista */}
      <div className="mx-4">
        <div className="bg-slate-900 rounded-2xl overflow-hidden">
          {loading ? (
            <p className="text-center text-slate-500 py-10 text-sm">Caricamento...</p>
          ) : transactions.length === 0 ? (
            <p className="text-center text-slate-500 py-10 text-sm">Nessuna transazione trovata</p>
          ) : (
            <>
              {transactions.map(t => (
                <TransactionCard key={t.id} transaction={t} onDelete={handleDelete} showEdit />
              ))}
              {hasMore && (
                <button onClick={() => fetchPage(page + 1, true)} disabled={loadingMore}
                  className="w-full py-4 text-sm text-blue-400 hover:text-blue-300 disabled:text-slate-600 transition-colors border-t border-slate-800">
                  {loadingMore ? 'Caricamento...' : `Mostra altri (${totalCount - transactions.length} rimasti)`}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TransazioniPage() {
  return (
    <Suspense>
      <TransazioniContent />
    </Suspense>
  )
}
