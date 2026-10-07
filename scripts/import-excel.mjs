/**
 * Importa i dati storici dall'Excel su Supabase.
 * Uso: node scripts/import-excel.mjs <file.xlsx>
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { config } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const EXCEL_PATH = process.argv[2]
if (!EXCEL_PATH) {
  console.error('Usage: node scripts/import-excel.mjs <path-to-file.xlsx>')
  process.exit(1)
}

function toISODate(val) {
  if (!val) return null
  if (val instanceof Date) {
    // Usa la data locale (Excel non ha fuso orario, è sempre mezzanotte locale)
    const y = val.getFullYear()
    const m = String(val.getMonth() + 1).padStart(2, '0')
    const d = String(val.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  if (typeof val === 'string') return val.substring(0, 10)
  return null
}

async function importSheet(wb, sheetName, type) {
  const ws = wb.Sheets[sheetName]
  if (!ws) { console.warn(`  Foglio "${sheetName}" non trovato`); return }

  // raw:true per avere Date e numeri nativi
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, cellDates: true })
  const records = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length < 6) continue

    const date = toISODate(row[0])
    const amount = typeof row[3] === 'number' ? parseFloat(row[3].toFixed(2)) : null
    const description = String(row[4] ?? '').trim()
    const category = String(row[5] ?? '').trim()

    if (!date || !amount || amount <= 0 || !description || !category) continue

    records.push({ date, amount, description, category, type })
  }

  console.log(`  ${sheetName}: ${records.length} record trovati`)
  if (records.length === 0) return

  const BATCH = 500
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH)
    const { error } = await supabase.from('transactions').insert(batch)
    if (error) {
      console.error(`  ✗ Errore:`, error.message)
    } else {
      console.log(`  ✓ Inseriti ${Math.min(i + BATCH, records.length)} / ${records.length}`)
    }
  }
}

async function main() {
  console.log('Lettura Excel...')
  const buf = readFileSync(EXCEL_PATH)
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: true })

  console.log('\nImportazione SPESE...')
  await importSheet(wb, 'ELENCO SPESE', 'spesa')

  console.log('\nImportazione ENTRATE...')
  await importSheet(wb, 'ELENCO ENTRATE', 'entrata')

  console.log('\nImportazione INVESTIMENTI...')
  await importSheet(wb, 'ELENCO INVESTIMENTI', 'investimento')

  console.log('\nFatto!')
}

main().catch(err => { console.error(err); process.exit(1) })
