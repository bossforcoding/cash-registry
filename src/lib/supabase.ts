import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { demoClient } from './demoClient'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Without Supabase credentials the app runs in demo mode, backed by
// fictional data stored in the browser.
export const isDemo = !supabaseUrl || !supabaseAnonKey

export const supabase: SupabaseClient = isDemo
  ? (demoClient as unknown as SupabaseClient)
  : createClient(supabaseUrl!, supabaseAnonKey!)
