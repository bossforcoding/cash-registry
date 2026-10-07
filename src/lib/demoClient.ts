// In-browser stand-in for the Supabase client, used when no Supabase
// credentials are configured. Data lives in localStorage and is seeded with
// fictional sample data, so the public demo never touches a real database.
// Only the subset of the query builder that the app uses is implemented.

type Row = Record<string, unknown>
type Tables = Record<string, Row[]>
type Result = { data: unknown; error: { message: string } | null; count?: number | null }

const STORAGE_KEY = 'cash-registry-demo-v1'

const CATEGORIES: [string, string, string, string][] = [
  ['Casa', 'spesa', '#3B82F6', 'manutenzione, mobili, necessità'],
  ['Trasporti', 'spesa', '#6366F1', 'treno, bus, pedaggi, parcheggi'],
  ['Auto', 'spesa', '#8B5CF6', 'assicurazione, bollo, tagliando, revisione, gomme'],
  ['Benzina', 'spesa', '#A78BFA', 'carburante'],
  ['Bollette', 'spesa', '#F59E0B', 'acqua, energia, gas, internet, telefono'],
  ['Sport', 'spesa', '#10B981', 'palestra, piscina'],
  ['Spesa', 'spesa', '#84CC16', 'spesa per cibo'],
  ['Cura personale', 'spesa', '#EC4899', 'parrucchiere, dentista, spese mediche'],
  ['Vestiti', 'spesa', '#F97316', 'abbigliamento, scarpe, accessori'],
  ['Altro necessità', 'spesa', '#6B7280', 'abbonamenti, cellulare, dispositivi'],
  ['Cibo fuori', 'spesa', '#EF4444', 'bar e ristoranti, aperitivi'],
  ['Intrattenimento', 'spesa', '#F43F5E', 'cinema, concerti, eventi'],
  ['Vacanza', 'spesa', '#14B8A6', 'viaggi, hotel'],
  ['Regali', 'spesa', '#D946EF', 'regali a familiari e amici'],
  ['Altro extra', 'spesa', '#9CA3AF', 'altro'],
  ['Stipendio', 'entrata', '#22C55E', ''],
  ['Vendite', 'entrata', '#4ADE80', ''],
  ['Rimborsi', 'entrata', '#86EFAC', ''],
  ['Altre entrate', 'entrata', '#16A34A', 'regali ricevuti, mance'],
  ['Investimenti', 'investimento', '#7C3AED', 'ETF, fondi'],
  ['ROI', 'investimento', '#C4B5FD', 'Return of Investment'],
]

const FIXED: [string, number, string, string][] = [
  ['Stipendio', 2000, 'Stipendio', 'entrata'],
  ['Affitto', 750, 'Casa', 'spesa'],
  ['Assicurazione casa', 25, 'Bollette', 'spesa'],
  ['Assicurazione auto', 90, 'Auto', 'spesa'],
  ['Internet', 30, 'Bollette', 'spesa'],
  ['Abbonamento trasporti', 40, 'Trasporti', 'spesa'],
  ['Abbonamento musica', 10, 'Altro necessità', 'spesa'],
  ['Palestra', 35, 'Sport', 'spesa'],
  ['Piano di accumulo ETF', 200, 'Investimenti', 'investimento'],
]

function uuid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// Small deterministic PRNG so every visitor starts from the same sample data.
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function seedTransactions(): Row[] {
  const rand = mulberry32(42)
  const between = (min: number, max: number) => Math.round((min + rand() * (max - min)) * 100) / 100
  const today = new Date()
  const rows: Row[] = []
  const add = (date: Date, amount: number, description: string, category: string, type: string) => {
    if (date > today) return
    rows.push({ id: uuid(), date: iso(date), amount, description, category, type, created_at: date.toISOString() })
  }

  // Current year and the whole previous one, so year-over-year views have data.
  const start = new Date(today.getFullYear() - 1, 0, 1)
  for (let m = new Date(start); m <= today; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) {
    const y = m.getFullYear()
    const mo = m.getMonth()
    const day = (d: number) => new Date(y, mo, d)

    add(day(27), 2000, 'Stipendio', 'Stipendio', 'entrata')
    add(day(1), 750, 'Affitto', 'Casa', 'spesa')
    add(day(5), 25, 'Assicurazione casa', 'Bollette', 'spesa')
    add(day(5), 90, 'Assicurazione auto', 'Auto', 'spesa')
    add(day(8), 30, 'Internet', 'Bollette', 'spesa')
    add(day(10), between(45, 95), 'Bolletta luce e gas', 'Bollette', 'spesa')
    add(day(2), 40, 'Abbonamento trasporti', 'Trasporti', 'spesa')
    add(day(3), 10, 'Abbonamento musica', 'Altro necessità', 'spesa')
    add(day(4), 35, 'Palestra', 'Sport', 'spesa')
    add(day(28), 200, 'Piano di accumulo ETF', 'Investimenti', 'investimento')

    for (const d of [3, 10, 17, 24]) add(day(d), between(45, 90), 'Spesa supermercato', 'Spesa', 'spesa')
    for (let i = 0; i < 2 + Math.floor(rand() * 3); i++) {
      add(day(1 + Math.floor(rand() * 27)), between(15, 55), rand() > 0.5 ? 'Cena fuori' : 'Aperitivo', 'Cibo fuori', 'spesa')
    }
    for (let i = 0; i < 2; i++) add(day(6 + i * 12), between(40, 65), 'Rifornimento', 'Benzina', 'spesa')
    if (rand() > 0.4) add(day(12 + Math.floor(rand() * 10)), between(20, 120), 'Abbigliamento', 'Vestiti', 'spesa')
    if (rand() > 0.5) add(day(14 + Math.floor(rand() * 10)), between(12, 40), 'Cinema', 'Intrattenimento', 'spesa')
    if (rand() > 0.7) add(day(9), between(30, 90), 'Visita medica', 'Cura personale', 'spesa')
    if (rand() > 0.75) add(day(20), between(30, 150), 'Vendita usato', 'Vendite', 'entrata')
    if (mo === 7) add(day(10), between(600, 900), 'Vacanza estiva', 'Vacanza', 'spesa')
    if (mo === 11) {
      add(day(15), between(150, 250), 'Regali di Natale', 'Regali', 'spesa')
      add(day(20), 2000, 'Tredicesima', 'Stipendio', 'entrata')
    }
    if (mo === 5) add(day(30), between(80, 160), 'Dividendi ETF', 'ROI', 'investimento')
  }
  return rows
}

function seed(): Tables {
  const now = new Date().toISOString()
  return {
    categories: CATEGORIES.map(([name, type, hex, description]) => ({ id: uuid(), name, type, hex, description, created_at: now })),
    fixed_expenses: FIXED.map(([description, amount, category, type]) => ({ id: uuid(), description, amount, category, type, note: '', created_at: now })),
    settings: [],
    transactions: seedTransactions(),
  }
}

let memory: Tables | null = null

function load(): Tables {
  if (memory) return memory
  if (typeof window === 'undefined') return seed()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return (memory = JSON.parse(raw))
  } catch {}
  memory = seed()
  save()
  return memory
}

function save() {
  try {
    if (memory) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
  } catch {}
}

export function resetDemoData() {
  memory = seed()
  save()
}

type Filter = (row: Row) => boolean

function compare(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a ?? '').localeCompare(String(b ?? ''))
}

function ilike(value: unknown, pattern: string): boolean {
  const re = new RegExp('^' + pattern.split('%').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$', 'i')
  return re.test(String(value ?? ''))
}

class QueryBuilder implements PromiseLike<Result> {
  private op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select'
  private columns: string[] | null = null
  private wantCount = false
  private payload: Row[] = []
  private patch: Row = {}
  private conflictKey = 'id'
  private filters: Filter[] = []
  private orders: { col: string; asc: boolean }[] = []
  private rangeFrom: number | null = null
  private rangeTo: number | null = null
  private isSingle = false

  constructor(private table: string) {}

  select(cols = '*', opts?: { count?: string }) {
    // After insert/update the app never reads rows back, so only plain selects matter.
    if (this.op === 'select') {
      this.columns = cols.trim() === '*' ? null : cols.split(',').map(c => c.trim())
      this.wantCount = opts?.count === 'exact'
    }
    return this
  }
  insert(values: Row | Row[]) {
    this.op = 'insert'
    this.payload = Array.isArray(values) ? values : [values]
    return this
  }
  upsert(values: Row | Row[], opts?: { onConflict?: string }) {
    this.op = 'upsert'
    this.payload = Array.isArray(values) ? values : [values]
    this.conflictKey = opts?.onConflict ?? 'id'
    return this
  }
  update(patch: Row) {
    this.op = 'update'
    this.patch = patch
    return this
  }
  delete() {
    this.op = 'delete'
    return this
  }

  eq(col: string, v: unknown) { this.filters.push(r => String(r[col]) === String(v)); return this }
  neq(col: string, v: unknown) { this.filters.push(r => String(r[col]) !== String(v)); return this }
  gt(col: string, v: unknown) { this.filters.push(r => compare(r[col], v) > 0); return this }
  gte(col: string, v: unknown) { this.filters.push(r => compare(r[col], v) >= 0); return this }
  lt(col: string, v: unknown) { this.filters.push(r => compare(r[col], v) < 0); return this }
  lte(col: string, v: unknown) { this.filters.push(r => compare(r[col], v) <= 0); return this }
  ilike(col: string, pattern: string) { this.filters.push(r => ilike(r[col], pattern)); return this }

  // Supports the PostgREST "col.op.value,col.op.value" syntax for eq and ilike.
  or(expr: string) {
    const parts = expr.split(',').map(p => {
      const [col, op, ...rest] = p.split('.')
      const value = rest.join('.')
      return (r: Row) => (op === 'ilike' ? ilike(r[col], value) : String(r[col]) === value)
    })
    this.filters.push(r => parts.some(f => f(r)))
    return this
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orders.push({ col, asc: opts?.ascending ?? true })
    return this
  }
  range(from: number, to: number) {
    this.rangeFrom = from
    this.rangeTo = to
    return this
  }
  single() {
    this.isSingle = true
    return this
  }

  private run(): Result {
    const db = load()
    const rows = (db[this.table] ??= [])
    const matches = (r: Row) => this.filters.every(f => f(r))

    if (this.op === 'insert') {
      const now = new Date().toISOString()
      const inserted = this.payload.map(v => ({ id: uuid(), created_at: now, ...v }))
      rows.push(...inserted)
      save()
      return { data: inserted, error: null }
    }
    if (this.op === 'upsert') {
      for (const v of this.payload) {
        const existing = rows.find(r => r[this.conflictKey] === v[this.conflictKey])
        if (existing) Object.assign(existing, v)
        else rows.push({ id: uuid(), created_at: new Date().toISOString(), ...v })
      }
      save()
      return { data: this.payload, error: null }
    }
    if (this.op === 'update') {
      const updated = rows.filter(matches)
      updated.forEach(r => Object.assign(r, this.patch))
      save()
      return { data: updated, error: null }
    }
    if (this.op === 'delete') {
      const kept = rows.filter(r => !matches(r))
      db[this.table] = kept
      save()
      return { data: null, error: null }
    }

    let result = rows.filter(matches)
    if (this.orders.length) {
      result = [...result].sort((a, b) => {
        for (const { col, asc } of this.orders) {
          const c = compare(a[col], b[col])
          if (c !== 0) return asc ? c : -c
        }
        return 0
      })
    }
    const count = result.length
    if (this.rangeFrom !== null && this.rangeTo !== null) result = result.slice(this.rangeFrom, this.rangeTo + 1)
    const cols = this.columns
    const projected = cols ? result.map(r => Object.fromEntries(cols.map(c => [c, r[c]]))) : result.map(r => ({ ...r }))

    if (this.isSingle) {
      return projected.length === 1
        ? { data: projected[0], error: null }
        : { data: null, error: { message: 'Row not found' } }
    }
    return { data: projected, error: null, count: this.wantCount ? count : null }
  }

  then<T1 = Result, T2 = never>(
    onfulfilled?: ((value: Result) => T1 | PromiseLike<T1>) | null,
    onrejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null,
  ): PromiseLike<T1 | T2> {
    return Promise.resolve().then(() => this.run()).then(onfulfilled, onrejected)
  }
}

export const demoClient = {
  from: (table: string) => new QueryBuilder(table),
}
