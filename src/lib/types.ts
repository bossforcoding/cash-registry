export type TransactionType = 'spesa' | 'entrata' | 'investimento'

export interface Transaction {
  id: string
  date: string
  amount: number
  description: string
  category: string
  type: TransactionType
  created_at: string
}

export interface MonthlySummary {
  spese: number
  entrate: number
  investimenti: number
  risparmio: number
}

export interface CategoryTotal {
  category: string
  total: number
  color: string
}
