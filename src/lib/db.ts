import postgres from 'postgres'
import type { BannerStatus, Location } from '@/types'

let sql: postgres.Sql<Record<string, never>> | null = null

export function getDb() {
    if (!sql) {
      const url = process.env.DATABASE_URL
      if (!url) {
        throw new Error('DATABASE_URL environment variable is not set')
      }
      sql = postgres(url, {
        prepare: false,
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
