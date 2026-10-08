'use client'
import { Transaction } from '@/lib/types'
import { categoryColor } from '@/lib/categories'
import { Trash2, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import Link from 'next/link'

interface Props {
  transaction: Transaction
  onDelete?: (id: string) => void
  showEdit?: boolean
}

export default function TransactionCard({ transaction, onDelete, showEdit }: Props) {
  const { id, date, amount, description, category, type } = transaction
  const isSpesa = type === 'spesa' || (type === 'investimento' && category !== 'ROI')
  const isEntrata = type === 'entrata' || (type === 'investimento' && category === 'ROI')
  const isInvestimento = type === 'investimento'
  const color = categoryColor(category)

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-line last:border-0">
      <div
        className="w-2 h-10 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{description}</p>
        <p className="text-xs text-fg-2 mt-0.5">
          {format(new Date(date), 'd MMM', { locale: it })} · {category}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <span className={`text-sm font-semibold tabular-nums mr-1 ${
          isInvestimento ? 'text-inv' : isEntrata ? 'text-pos' : 'text-neg'
        }`}>
          {isSpesa ? '-' : '+'}{amount.toFixed(2)}€
        </span>
        {showEdit && (
          <Link
            href={`/modifica?id=${id}`}
            className="p-1.5 rounded-lg text-fg-4 hover:text-brand hover:bg-surface-2 transition-colors"
          >
            <Pencil size={14} />
          </Link>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(id)}
            className="p-1.5 rounded-lg text-fg-4 hover:text-neg hover:bg-surface-2 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
