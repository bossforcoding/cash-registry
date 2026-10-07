'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { TransactionType } from '@/lib/types'
import { useCategories } from '@/lib/useCategories'
import { CheckCircle2, ArrowLeft } from 'lucide-react'

const TYPE_LABELS: { value: TransactionType; label: string; color: string }[] = [
  { value: 'spesa',        label: 'Spesa',        color: 'bg-red-500/20 text-red-400 border-red-500/50' },
  { value: 'entrata',      label: 'Entrata',      color: 'bg-green-500/20 text-green-400 border-green-500/50' },
  { value: 'investimento', label: 'Investimento', color: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
]

export default function ModificaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [type, setType] = useState<TransactionType>('spesa')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [loadingData, setLoadingData] = useState(true)

  const { categories } = useCategories(type)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('transactions').select('*').eq('id', id).single()
      if (data) {
        setType(data.type)
        setAmount(String(data.amount))
        setDescription(data.description)
        setCategory(data.category)
        setDate(data.date)
      }
      setLoadingData(false)
    }
    load()
  }, [id])

  function handleTypeChange(t: TransactionType) {
    setType(t)
    setCategory('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || !description || !category || !date) {
      setError('Compila tutti i campi')
      return
    }
    const parsed = parseFloat(amount.replace(',', '.'))
    if (isNaN(parsed) || parsed <= 0) {
      setError('Importo non valido')
      return
    }

    setSaving(true)
    setError('')
    const { error: dbErr } = await supabase
      .from('transactions')
      .update({ date, amount: parsed, description: description.trim(), category, type })
      .eq('id', id)

    if (dbErr) {
      setError('Errore: ' + dbErr.message)
      setSaving(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.back(), 1200)
  }

  if (loadingData) {
    return <div className="flex items-center justify-center min-h-[60vh] text-slate-500 text-sm">Caricamento...</div>
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <CheckCircle2 size={64} className="text-green-400" />
        <p className="text-lg font-semibold">Modificato!</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-slate-800 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Modifica transazione</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Tipo</label>
          <div className="grid grid-cols-3 gap-2">
            {TYPE_LABELS.map(({ value, label, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleTypeChange(value)}
                className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  type === value ? color : 'border-slate-700 text-slate-500 bg-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Importo (€)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-2xl font-bold text-center focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Descrizione</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Categoria</label>
          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
            {categories.map(({ name, hex }) => (
              <button
                key={name}
                type="button"
                onClick={() => setCategory(name)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition-all text-left ${
                  category === name ? 'border-2 bg-slate-800' : 'border-slate-700 bg-slate-900'
                }`}
                style={category === name ? { borderColor: hex } : {}}
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: hex }} />
                <span className="truncate">{name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Data</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl transition-colors text-base"
        >
          {saving ? 'Salvataggio...' : 'Salva modifiche'}
        </button>
      </form>
    </div>
  )
}
