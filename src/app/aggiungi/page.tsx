'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { TransactionType } from '@/lib/types'
import { useCategories } from '@/lib/useCategories'
import { CheckCircle2 } from 'lucide-react'

const TYPES: { value: TransactionType; label: string; color: string }[] = [
  { value: 'spesa',        label: 'Spesa',        color: 'bg-neg/12 text-neg border-neg/50' },
  { value: 'entrata',      label: 'Entrata',      color: 'bg-pos/12 text-pos border-pos/50' },
  { value: 'investimento', label: 'Investimento', color: 'bg-inv/12 text-inv border-inv/50' },
]

export default function AggiungiPage() {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]

  const [type, setType] = useState<TransactionType>('spesa')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(today)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const { categories } = useCategories(type)

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
    const { error: dbErr } = await supabase.from('transactions').insert({
      date,
      amount: parsed,
      description: description.trim(),
      category,
      type,
    })

    if (dbErr) {
      setError('Errore nel salvataggio: ' + dbErr.message)
      setSaving(false)
      return
    }

    setSuccess(true)
    setSaving(false)
    setTimeout(() => {
      setSuccess(false)
      setAmount('')
      setDescription('')
      setCategory('')
      setDate(today)
    }, 1500)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <CheckCircle2 size={64} className="text-pos" />
        <p className="text-lg font-semibold">Salvato!</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tipo */}
        <div>
          <label className="text-xs text-fg-2 uppercase tracking-wider mb-2 block">Tipo</label>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map(({ value, label, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleTypeChange(value)}
                className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  type === value ? color : 'border-line-strong text-fg-3 bg-surface'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Importo */}
        <div>
          <label className="text-xs text-fg-2 uppercase tracking-wider mb-2 block">Importo (€)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-surface border border-line-strong rounded-xl px-4 py-3 text-2xl font-bold text-center focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        {/* Descrizione */}
        <div>
          <label className="text-xs text-fg-2 uppercase tracking-wider mb-2 block">Descrizione</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="es. Tigros, Cinema..."
            className="w-full bg-surface border border-line-strong rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        {/* Categoria */}
        <div>
          <label className="text-xs text-fg-2 uppercase tracking-wider mb-2 block">Categoria</label>
          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
            {categories.map(({ name, hex }) => (
              <button
                key={name}
                type="button"
                onClick={() => setCategory(name)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition-all text-left ${
                  category === name
                    ? 'border-2 bg-surface-2'
                    : 'border-line-strong bg-surface'
                }`}
                style={category === name ? { borderColor: hex } : {}}
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: hex }} />
                <span className="truncate">{name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Data */}
        <div>
          <label className="text-xs text-fg-2 uppercase tracking-wider mb-2 block">Data</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-surface border border-line-strong rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        {error && <p className="text-neg text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-brand hover:bg-brand/90 text-white disabled:opacity-50 text-white font-semibold py-4 rounded-2xl transition-colors text-base"
        >
          {saving ? 'Salvataggio...' : 'Salva'}
        </button>
      </form>
    </div>
  )
}
