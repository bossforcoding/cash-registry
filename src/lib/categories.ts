import { TransactionType } from './types'

export interface CategoryInfo {
  name: string
  hex: string
}

export const EXPENSE_CATEGORIES: CategoryInfo[] = [
  { name: 'Casa',             hex: '#3B82F6' },
  { name: 'Trasporti',        hex: '#6366F1' },
  { name: 'Auto',             hex: '#8B5CF6' },
  { name: 'Benzina',          hex: '#A78BFA' },
  { name: 'Bollette',         hex: '#F59E0B' },
  { name: 'Sport',            hex: '#10B981' },
  { name: 'Spesa',            hex: '#84CC16' },
  { name: 'Cura personale',   hex: '#EC4899' },
  { name: 'Vestiti',          hex: '#F97316' },
  { name: 'Altro necessità',  hex: '#6B7280' },
  { name: 'Cibo fuori',       hex: '#EF4444' },
  { name: 'Intrattenimento',  hex: '#F43F5E' },
  { name: 'Vacanza',          hex: '#14B8A6' },
  { name: 'Vizi',             hex: '#78716C' },
  { name: 'Regali',           hex: '#D946EF' },
  { name: 'Altro extra',      hex: '#9CA3AF' },
]

export const INCOME_CATEGORIES: CategoryInfo[] = [
  { name: 'Stipendio',        hex: '#22C55E' },
  { name: 'Vendite',          hex: '#4ADE80' },
  { name: 'Rimborsi',         hex: '#86EFAC' },
  { name: 'Altre entrate',    hex: '#16A34A' },
]

export const INVESTMENT_CATEGORIES: CategoryInfo[] = [
  { name: 'Investimenti',     hex: '#7C3AED' },
  { name: 'ROI',              hex: '#C4B5FD' },
]

export const ALL_CATEGORIES = [
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
  ...INVESTMENT_CATEGORIES,
]

export function categoriesForType(type: TransactionType): CategoryInfo[] {
  if (type === 'spesa')        return EXPENSE_CATEGORIES
  if (type === 'entrata')      return INCOME_CATEGORIES
  if (type === 'investimento') return INVESTMENT_CATEGORIES
  return []
}

export function categoryColor(name: string): string {
  return ALL_CATEGORIES.find(c => c.name === name)?.hex ?? '#6B7280'
}

export const MESI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile',
  'Maggio', 'Giugno', 'Luglio', 'Agosto',
  'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]
