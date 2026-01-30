import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { Location } from '@/lib/db'

export async function GET() {
  try {
    const sql = getDb()

    const locations = await sql<Location[]>`
      SELECT * FROM locations
      ORDER BY name ASC
    `

    return NextResponse.json({ locations })
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const sql = getDb()
    const body = await request.json()

    const { name, slug } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields: name and slug' },
        { status: 400 }
      )
    }

    const [location] = await sql<Location[]>`
      INSERT INTO locations (name, slug)
      VALUES (${name}, ${slug})
      RETURNING *
    `

    return NextResponse.json({ location }, { status: 201 })
  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    )
  }
}
