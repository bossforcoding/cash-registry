'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MESI } from '@/lib/categories'

interface Props {
  month: number
  year: number
  onChange: (month: number, year: number) => void
}

export default function MonthSelector({ month, year, onChange }: Props) {
  function prev() {
    if (month === 0) onChange(11, year - 1)
    else onChange(month - 1, year)
  }
  function next() {
    if (month === 11) onChange(0, year + 1)
    else onChange(month + 1, year)
  }
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <button onClick={prev} className="p-2 rounded-full hover:bg-surface-2 transition-colors">
        <ChevronLeft size={20} />
      </button>
      <h2 className="text-lg font-semibold">{MESI[month]} {year}</h2>
      <button onClick={next} className="p-2 rounded-full hover:bg-surface-2 transition-colors">
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
