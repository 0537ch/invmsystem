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
    })
  }

  return sql
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
  type: 'image' | 'youtube' | 'iframe' | 'gdrive'
  url: string
  duration: number
  title: string | null
  image_source: 'url' | 'gdrive' | 'upload' | null
  position: number
  created_at: Date
  updated_at: Date
}
