'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useCategories, CategoryOption } from '@/lib/useCategories'
import { TransactionType } from '@/lib/types'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'

const COLORS = [
  '#3B82F6','#6366F1','#8B5CF6','#A78BFA','#EC4899','#F43F5E','#EF4444',
  '#F97316','#F59E0B','#84CC16','#10B981','#14B8A6','#22C55E','#4ADE80',
  '#16A34A','#D946EF','#7C3AED','#C4B5FD','#78716C','#6B7280','#9CA3AF',
]

const TYPE_TABS: { value: TransactionType; label: string }[] = [
  { value: 'spesa',        label: 'Spese' },
  { value: 'entrata',      label: 'Entrate' },
  { value: 'investimento', label: 'Investimenti' },
]

interface EditState { id: string; name: string; hex: string; description: string }

export default function CategoriePage() {
  const [activeType, setActiveType] = useState<TransactionType>('spesa')
  const { categories, reload } = useCategories(activeType)

  // Stato nuovo
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newHex, setNewHex] = useState(COLORS[0])
  const [newDesc, setNewDesc] = useState('')

  // Stato modifica
  const [editing, setEditing] = useState<EditState | null>(null)

  async function handleAdd() {
    if (!newName.trim()) return
    await supabase.from('categories').insert({ name: newName.trim(), type: activeType, hex: newHex, description: newDesc.trim() })
    setNewName('')
    setNewHex(COLORS[0])
    setNewDesc('')
    setAdding(false)
    reload()
  }

  async function handleSaveEdit() {
    if (!editing || !editing.name.trim()) return
    await supabase.from('categories').update({ name: editing.name.trim(), hex: editing.hex, description: editing.description.trim() }).eq('id', editing.id)
    setEditing(null)
    reload()
  }

  async function handleDelete(cat: CategoryOption) {
    if (!confirm(`Eliminare la categoria "${cat.name}"?\nLe transazioni esistenti non verranno modificate.`)) return
    await supabase.from('categories').delete().eq('id', cat.id)
    reload()
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-xl font-bold mb-5">Categorie</h1>

      {/* Tab tipo */}
      <div className="flex gap-2 mb-5">
        {TYPE_TABS.map(({ value, label }) => (
          <button key={value}
            onClick={() => { setActiveType(value); setAdding(false); setEditing(null) }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeType === value ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Lista categorie */}
      <div className="bg-slate-900 rounded-2xl overflow-hidden mb-4">
        {categories.map(cat => (
          <div key={cat.id} className="border-b border-slate-800 last:border-0">
            {editing?.id === cat.id ? (
              /* Form modifica inline */
              <div className="p-3 space-y-3">
                <input
                  value={editing.name}
                  onChange={e => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Nome categoria..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <input
                  value={editing.description}
                  onChange={e => setEditing({ ...editing, description: e.target.value })}
                  placeholder="Descrizione (es. cosa inserire qui)..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
                <ColorPicker value={editing.hex} onChange={hex => setEditing({ ...editing, hex })} />
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
                    <Check size={15} /> Salva
                  </button>
                  <button onClick={() => setEditing(null)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-400 transition-colors">
                    <X size={15} /> Annulla
                  </button>
                </div>
              </div>
            ) : (
              /* Riga normale */
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.hex }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{cat.name}</p>
                  {cat.description && (
                    <p className="text-xs text-slate-500 truncate">{cat.description}</p>
                  )}
                </div>
                <button onClick={() => setEditing({ id: cat.id, name: cat.name, hex: cat.hex, description: cat.description ?? '' })}
                  className="p-1.5 text-slate-600 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(cat)}
                  className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}

        {categories.length === 0 && !adding && (
          <p className="text-center text-slate-500 py-8 text-sm">Nessuna categoria</p>
        )}
      </div>

      {/* Form nuova categoria */}
      {adding ? (
        <div className="bg-slate-900 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-300">Nuova categoria</p>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nome categoria..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <input
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Descrizione (es. cosa inserire qui)..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <ColorPicker value={newHex} onChange={setNewHex} />
          <div className="flex gap-2">
            <button onClick={handleAdd}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium transition-colors">
              <Check size={15} /> Aggiungi
            </button>
            <button onClick={() => { setAdding(false); setNewName(''); setNewDesc('') }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm text-slate-400 transition-colors">
              <X size={15} /> Annulla
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => { setAdding(true); setEditing(null) }}
          className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-700 rounded-2xl text-sm text-slate-400 hover:text-slate-200 transition-colors">
          <Plus size={16} /> Aggiungi categoria
        </button>
      )}
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-2">Colore</p>
      <div className="flex flex-wrap gap-2">
        {COLORS.map(hex => (
          <button
            key={hex}
            type="button"
            onClick={() => onChange(hex)}
            className={`w-7 h-7 rounded-full transition-transform ${value === hex ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'}`}
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>
    </div>
  )
}
