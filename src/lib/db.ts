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

export type BannerStatus = 'live' | 'scheduled' | 'expired' | 'inactive'

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
  status?: BannerStatus
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

export function getBannerStatus(
  active: boolean,
  startDate: string | Date | null,
  endDate: string | Date | null
): BannerStatus {
  if (!active) {
    return 'inactive'
  }

  const today = new Date()
  const currentDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const formatDate = (date: string | Date | null): string | null => {
    if (!date) return null
    if (date instanceof Date) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }
    return String(date).split('T')[0]
  }

  const startDateStr = formatDate(startDate)
  const endDateStr = formatDate(endDate)

  const afterStart = !startDateStr || startDateStr <= currentDate
  const beforeEnd = !endDateStr || endDateStr >= currentDate

  if (afterStart && beforeEnd) {
    return 'live'
  }

  if (startDateStr && startDateStr > currentDate) {
    return 'scheduled'
  }

  if (endDateStr && endDateStr < currentDate) {
    return 'expired'
  }

  return 'inactive'
}
