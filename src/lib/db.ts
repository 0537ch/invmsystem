import postgres from 'postgres'

let sql: postgres.Sql<Record<string, never>> | null = null

export function getDb() {
  if (!sql) {
    const url = process.env.DATABASE_URL

    if (!url) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    sql = postgres(url, {
      ssl: 'require',
      prepare: false,  // Disable prepared statements to avoid caching issues
    })
  }

  return sql
}

export function resetDbConnection() {
  if (sql) {
    sql.end({ timeout: 5 })
    sql = null
  }
}

export type Person = {
  id: number
  name: string
  email: string
  created_at: Date
}

export type Invoice = {
  id: number
  invoice_num: string
  price: number
  person_id: number
  created_at: Date
}

export type PersonWithInvoices = Person & {
  invoices: Invoice[]
  total: number
}

export type Banner = {
  id: number
  type: 'image' | 'youtube' | 'video' | 'iframe' | 'gdrive'
  url: string
  duration: number
  title: string | null
  description: string | null
  active: boolean
  image_source: 'url' | 'gdrive' | 'upload' | null
  position: number
  created_at: Date
  updated_at: Date
  start_date: string | Date | null
  end_date: string | Date | null
  locations?: Location[]
}

export type Location = {
  id: number
  name: string
  slug: string
  created_at: Date
}

export type User = {
  id: number
  username: string
  name: string | null
  active: boolean
  created_at: Date
}
