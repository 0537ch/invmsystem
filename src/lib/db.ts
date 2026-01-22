import postgres from 'postgres'

// Database connection singleton
let sql: postgres.Sql<Record<string, never>> | null = null

export function getDb() {
  if (!sql) {
    const url = process.env.DATABASE_URL

    if (!url) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    sql = postgres(url, {
      ssl: 'require', // Neon requires SSL
    })
  }

  return sql
}

// Types for our data
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
