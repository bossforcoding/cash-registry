import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import { TransactionType } from './types'

export interface CategoryOption {
  id: string
  name: string
  type: string
  hex: string
  description: string
}

export function useCategories(type?: TransactionType) {
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('categories').select('*').order('name')
    if (type) q = q.eq('type', type)
    const { data } = await q
    setCategories(data ?? [])
    setLoading(false)
  }, [type])

  useEffect(() => { fetch() }, [fetch])

  return { categories, loading, reload: fetch }
}
