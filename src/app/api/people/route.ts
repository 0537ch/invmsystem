import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { toNumber } from '@/lib/utils'


export async function GET() {
  try {
    const sql = getDb()

    const people = await sql<PersonRow[]>`
      SELECT
        p.id,
        p.name,
        p.email,
        p.created_at,
        i.id as invoice_id,
        i.invoice_num,
        i.price
      FROM persons p
      LEFT JOIN invoices i ON p.id = i.person_id
      ORDER BY p.name, i.invoice_num
    `

    const grouped = new Map<number, PersonWithInvoices>()

    people.forEach((row) => {
      if (!grouped.has(row.id)) {
        grouped.set(row.id, {
          id: row.id,
          name: row.name,
          email: row.email,
          created_at: row.created_at,
          invoices: [],
          total: 0
        })
      }

      const person = grouped.get(row.id)!

      if (row.invoice_id && row.invoice_num && row.price !== null) {
        const price = toNumber(row.price)
        person.invoices.push({
          id: row.invoice_id,
          invoice_num: row.invoice_num,
          price: price,
          person_id: row.id,
          created_at: row.created_at
        })
        person.total += price
      }
    })

    const result = Array.from(grouped.values()).sort((a, b) => b.total - a.total)

    return NextResponse.json({ people: result })
  } catch (error) {
    console.error('Error fetching people:', error)
    return NextResponse.json(
      { error: 'Failed to fetch people' },
      { status: 500 }
    )
  }
}

type PersonRow = {
  id: number
  name: string
  email: string
  created_at: Date
  invoice_id: number | null
  invoice_num: string | null
  price: number | null
}

type PersonWithInvoices = {
  id: number
  name: string
  email: string
  created_at: Date
  invoices: Array<{
    id: number
    invoice_num: string
    price: number
    person_id: number
    created_at: Date
  }>
  total: number
}
