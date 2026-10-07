'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useCategories } from '@/lib/useCategories'
import { TransactionType } from '@/lib/types'
import { MESI, categoryColor } from '@/lib/categories'
import { Plus, Pencil, Trash2, Check, X, ChevronLeft, ChevronRight, Repeat, CheckSquare, Square, AlertCircle } from 'lucide-react'

interface FixedExpense {
  id: string
  description: string
  amount: number
  category: string
  type: TransactionType
  note: string
}

const TYPE_COLOR: Record<TransactionType, string> = {
  spesa:        'text-red-400',
  entrata:      'text-green-400',
  investimento: 'text-purple-400',
}
const TYPE_LABEL: Record<TransactionType, string> = {
  spesa: 'Spesa', entrata: 'Entrata', investimento: 'Investimento',
}
const TYPES: TransactionType[] = ['spesa', 'entrata', 'investimento']

interface FormState { description: string; amount: string; category: string; type: TransactionType; note: string }
const EMPTY_FORM: FormState = { description: '', amount: '', category: '', type: 'spesa', note: '' }

export default function SpeseFissePage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear]   = useState(now.getFullYear())
  const [items, setItems] = useState<FixedExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [monthTransactions, setMonthTransactions] = useState<{ description: string; amount: number; category: string; type: string }[]>([])

  // Note globali — DB come source of truth, localStorage come cache immediata
  const NOTES_KEY = 'spese-fisse-notes'
  const [notes, setNotes] = useState(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem(NOTES_KEY) ?? ''
  })

  useEffect(() => {
    supabase.from('settings').select('value').eq('key', NOTES_KEY).single()
      .then(({ data }) => {
        if (data?.value !== undefined) {
          setNotes(data.value)
          localStorage.setItem(NOTES_KEY, data.value)
        }
      })
  }, [])

  function handleNotesChange(val: string) {
    setNotes(val)
    localStorage.setItem(NOTES_KEY, val)
    supabase.from('settings').upsert({ key: NOTES_KEY, value: val }, { onConflict: 'key' }).then()
  }

  // Form aggiunta
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  // Modifica inline
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM)

  // Categorie dal tipo selezionato (per form)
  const { categories: addCats }  = useCategories(form.type)
  const { categories: editCats } = useCategories(editForm.type)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('fixed_expenses').select('*').order('type').order('description')
    setItems((data ?? []) as FixedExpense[])
    setLoading(false)
  }, [])

  const fetchMonthTransactions = useCallback(async () => {
    const mm = String(month + 1).padStart(2, '0')
    const start = `${year}-${mm}-01`
    const end = month === 11 ? `${year + 1}-01-01` : `${year}-${String(month + 2).padStart(2, '0')}-01`
    const { data } = await supabase
      .from('transactions')
      .select('description, category, type')
      .gte('date', start)
      .lt('date', end)
    setMonthTransactions((data ?? []) as { description: string; amount: number; category: string; type: string }[])
  }, [month, year])

  function isApplied(item: FixedExpense): boolean {
    return monthTransactions.some(t =>
      t.description.toLowerCase() === item.description.toLowerCase() &&
      t.category.toLowerCase() === item.category.toLowerCase() &&
      t.type.toLowerCase() === item.type.toLowerCase()
    )
  }

  useEffect(() => { fetchItems() }, [fetchItems])
  useEffect(() => { fetchMonthTransactions() }, [fetchMonthTransactions])

  async function handleApply(subset?: FixedExpense[]) {
    const targets = subset ?? items
    const label = `${MESI[month]} ${year}`
    if (!confirm(`Inserire ${targets.length} voci fisse in ${label}?\n\nAssicurati di non averle già inserite per questo mese.`)) return
    setApplying(true)
    const date = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const records = targets.map(fe => ({
      date, amount: fe.amount, description: fe.description,
      category: fe.category, type: fe.type,
    }))
    await supabase.from('transactions').insert(records)
    setApplying(false)
    setApplied(true)
    setSelectionMode(false)
    setSelectedIds(new Set())
    fetchMonthTransactions()
    setTimeout(() => setApplied(false), 3000)
  }

  function toggleSelection(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function exitSelectionMode() {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  async function handleAdd() {
    if (!form.description.trim() || !form.amount || !form.category) return
    const amount = parseFloat(form.amount.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) return
    await supabase.from('fixed_expenses').insert({
      description: form.description.trim(), amount, category: form.category, type: form.type, note: form.note.trim(),
    })
    setForm(EMPTY_FORM)
    setAdding(false)
    fetchItems()
  }

  async function handleSaveEdit() {
    if (!editId || !editForm.description.trim() || !editForm.amount || !editForm.category) return
    const amount = parseFloat(editForm.amount.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) return
    await supabase.from('fixed_expenses').update({
      description: editForm.description.trim(), amount, category: editForm.category, type: editForm.type, note: editForm.note.trim(),
    }).eq('id', editId)
    setEditId(null)
    fetchItems()
  }

  async function handleDelete(id: string, desc: string) {
    if (!confirm(`Eliminare "${desc}" dalle voci fisse?`)) return
    await supabase.from('fixed_expenses').delete().eq('id', id)
    fetchItems()
  }

  // Totali per tipo
  const totSpese = items.filter(i => i.type === 'spesa').reduce((s, i) => s + i.amount, 0)
  const totEntrate = items.filter(i => i.type === 'entrata').reduce((s, i) => s + i.amount, 0)
  const totInv = items.filter(i => i.type === 'investimento').reduce((s, i) => s + i.amount, 0)
  const netto = totEntrate - totSpese - totInv

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-xl font-bold mb-5">Spese fisse</h1>

      {/* Selettore mese per applicazione */}
      <div className="bg-slate-900 rounded-2xl p-4 mb-4">
        <p className="text-xs text-slate-500 mb-3">Applica voci al mese:</p>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1)}
            className="p-2 rounded-full hover:bg-slate-800 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="font-semibold">{MESI[month]} {year}</span>
          <button onClick={() => month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1)}
            className="p-2 rounded-full hover:bg-slate-800 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>

        {applied ? (
          <div className="flex items-center justify-center gap-2 py-3 bg-green-500/10 rounded-xl text-green-400 text-sm font-medium">
            <Check size={16} /> Voci inserite in {MESI[month]}!
          </div>
        ) : selectionMode ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleApply(items.filter(i => selectedIds.has(i.id)))}
              disabled={applying || selectedIds.size === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors">
              <Repeat size={16} />
              {applying ? 'Inserimento...' : `Applica ${selectedIds.size} selezionate`}
            </button>
            <button onClick={exitSelectionMode}
              className="px-4 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 transition-colors">
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => handleApply()} disabled={applying || items.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors">
              <Repeat size={16} />
              {applying ? 'Inserimento...' : `Tutte (${items.length})`}
            </button>
            <button onClick={() => { setSelectionMode(true); setSelectedIds(new Set()) }}
              disabled={items.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-xl text-sm font-semibold text-slate-300 transition-colors">
              <CheckSquare size={16} />
              Seleziona alcune
            </button>
          </div>
        )}
      </div>

      {/* Riepilogo totali */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-900 rounded-xl p-3">
          <p className="text-xs text-slate-500">Entrate fisse</p>
          <p className="text-base font-bold text-green-400 tabular-nums">+{totEntrate.toFixed(2)}€</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-3">
          <p className="text-xs text-slate-500">Spese fisse</p>
          <p className="text-base font-bold text-red-400 tabular-nums">-{totSpese.toFixed(2)}€</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-3">
          <p className="text-xs text-slate-500">Investimenti fissi</p>
          <p className="text-base font-bold text-purple-400 tabular-nums">-{totInv.toFixed(2)}€</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-3">
          <p className="text-xs text-slate-500">Netto mensile</p>
          <p className={`text-base font-bold tabular-nums ${netto >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
            {netto >= 0 ? '+' : ''}{netto.toFixed(2)}€
          </p>
        </div>
      </div>

      {/* Note / checklist */}
      <div className="bg-slate-900 rounded-2xl p-4 mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Note</p>
        <textarea
          value={notes}
          onChange={e => handleNotesChange(e.target.value)}
          placeholder={"- Controllare scadenza abbonamento\n- Verificare addebito bolletta\n- ..."}
          rows={5}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
        />
      </div>

      {/* Warning mese non applicato */}
      {!loading && items.length > 0 && items.every(i => !isApplied(i)) && (
        <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/30 rounded-2xl px-4 py-3 mb-4">
          <AlertCircle size={18} className="text-orange-400 flex-shrink-0" />
          <p className="text-sm text-orange-300">
            Non hai ancora inserito le spese fisse per <span className="font-semibold">{MESI[month]} {year}</span>!
          </p>
        </div>
      )}

      {/* Lista */}
      <div className="bg-slate-900 rounded-2xl overflow-hidden mb-4">
        {loading ? (
          <p className="text-center text-slate-500 py-8 text-sm">Caricamento...</p>
        ) : items.length === 0 ? (
          <p className="text-center text-slate-500 py-8 text-sm">Nessuna voce fissa</p>
        ) : (
          items.map(item => (
            <div key={item.id} className="border-b border-slate-800 last:border-0">
              {editId === item.id ? (
                <ItemForm
                  form={editForm}
                  categories={editCats}
                  onChange={setEditForm}
                  onSave={handleSaveEdit}
                  onCancel={() => setEditId(null)}
                />
              ) : selectionMode ? (
                <button
                  onClick={() => toggleSelection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${selectedIds.has(item.id) ? 'bg-blue-600/10' : 'hover:bg-slate-800'}`}>
                  {selectedIds.has(item.id)
                    ? <CheckSquare size={18} className="text-blue-400 flex-shrink-0" />
                    : <Square size={18} className="text-slate-600 flex-shrink-0" />}
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: categoryColor(item.category) }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.description}</p>
                    <p className="text-xs text-slate-500 truncate">{item.note || item.category}</p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${TYPE_COLOR[item.type]}`}>
                    {item.type === 'entrata' ? '+' : '-'}{item.amount.toFixed(2)}€
                  </span>
                  {!isApplied(item) && <AlertCircle size={14} className="text-orange-400 flex-shrink-0" />}
                </button>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: categoryColor(item.category) }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.description}</p>
                    <p className="text-xs text-slate-500 truncate">{item.note || item.category}</p>
                  </div>
                  {!isApplied(item) && <AlertCircle size={14} className="text-orange-400 flex-shrink-0" />}
                  <span className={`text-sm font-semibold tabular-nums mr-1 ${TYPE_COLOR[item.type]}`}>
                    {item.type === 'entrata' ? '+' : '-'}{item.amount.toFixed(2)}€
                  </span>
                  <button onClick={() => { setEditId(item.id); setEditForm({ description: item.description, amount: String(item.amount), category: item.category, type: item.type, note: item.note ?? '' }) }}
                    className="p-1.5 text-slate-600 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(item.id, item.description)}
                    className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Form aggiunta */}
      {adding ? (
        <div className="bg-slate-900 rounded-2xl p-4">
          <p className="text-sm font-semibold text-slate-300 mb-3">Nuova voce fissa</p>
          <ItemForm
            form={form}
            categories={addCats}
            onChange={setForm}
            onSave={handleAdd}
            onCancel={() => { setAdding(false); setForm(EMPTY_FORM) }}
          />
        </div>
      ) : (
        <button onClick={() => { setAdding(true); setEditId(null) }}
          className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-700 rounded-2xl text-sm text-slate-400 hover:text-slate-200 transition-colors">
          <Plus size={16} /> Aggiungi voce fissa
        </button>
      )}
    </div>
  )
}

function ItemForm({ form, categories, onChange, onSave, onCancel }: {
  form: FormState
  categories: { id: string; name: string; hex: string }[]
  onChange: (f: FormState) => void
  onSave: () => void
  onCancel: () => void
}) {
  const TYPES: TransactionType[] = ['spesa', 'entrata', 'investimento']
  const TYPE_STYLE: Record<TransactionType, string> = {
    spesa: 'bg-red-500/20 text-red-400 border-red-500/50',
    entrata: 'bg-green-500/20 text-green-400 border-green-500/50',
    investimento: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  }
  const TYPE_LABEL: Record<TransactionType, string> = {
    spesa: 'Spesa', entrata: 'Entrata', investimento: 'Investimento',
  }

  return (
    <div className="space-y-3 p-3">
      {/* Tipo */}
      <div className="grid grid-cols-3 gap-2">
        {TYPES.map(t => (
          <button key={t} type="button"
            onClick={() => onChange({ ...form, type: t, category: '' })}
            className={`py-2 rounded-xl text-xs font-medium border transition-all ${
              form.type === t ? TYPE_STYLE[t] : 'border-slate-700 text-slate-500 bg-slate-900'
            }`}>
            {TYPE_LABEL[t]}
          </button>
        ))}
      </div>
      {/* Descrizione */}
      <input value={form.description} onChange={e => onChange({ ...form, description: e.target.value })}
        placeholder="Descrizione..."
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        autoFocus
      />
      {/* Importo */}
      <input type="number" inputMode="decimal" step="0.01" min="0"
        value={form.amount} onChange={e => onChange({ ...form, amount: e.target.value })}
        placeholder="Importo €"
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
      />
      {/* Note */}
      <input value={form.note} onChange={e => onChange({ ...form, note: e.target.value })}
        placeholder="Note (opzionale)..."
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
      />
      {/* Categoria */}
      <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto">
        {categories.map(c => (
          <button key={c.id} type="button" onClick={() => onChange({ ...form, category: c.name })}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs border transition-all text-left ${
              form.category === c.name ? 'border-2 bg-slate-800' : 'border-slate-700 bg-slate-900'
            }`}
            style={form.category === c.name ? { borderColor: c.hex } : {}}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.hex }} />
            <span className="truncate">{c.name}</span>
          </button>
        ))}
      </div>
      {/* Azioni */}
      <div className="flex gap-2">
        <button onClick={onSave}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium transition-colors">
          <Check size={14} /> Salva
        </button>
        <button onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm text-slate-400 transition-colors">
          <X size={14} /> Annulla
        </button>
      </div>
    </div>
  )
}
