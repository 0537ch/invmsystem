import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { Banner } from '@/lib/db'

// GET all banners
export async function GET() {
  try {
    const sql = getDb()

    const banners = await sql<Banner[]>`
      SELECT * FROM banners
      ORDER BY position ASC
    `

    return NextResponse.json({ banners })
  } catch (error) {
    console.error('Error fetching banners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch banners' },
      { status: 500 }
    )
  }
}

// POST create new banner
export async function POST(request: Request) {
  try {
    const sql = getDb()
    const body = await request.json()

    const { type, url, duration, title, image_source } = body

    // Validate required fields
    if (!type || !url) {
      return NextResponse.json(
        { error: 'Missing required fields: type and url' },
        { status: 400 }
      )
    }

    // Get the highest position to add at the end
    const [maxPos] = await sql<{ max: number | null }[]>`
      SELECT COALESCE(MAX(position), -1) as max FROM banners
    `

    const newPosition = (maxPos?.max ?? -1) + 1

    const [banner] = await sql<Banner[]>`
      INSERT INTO banners (type, url, duration, title, image_source, position)
      VALUES (${type}, ${url}, ${duration || 10}, ${title || null}, ${image_source || null}, ${newPosition})
      RETURNING *
    `

    return NextResponse.json({ banner }, { status: 201 })
  } catch (error) {
    console.error('Error creating banner:', error)
    return NextResponse.json(
      { error: 'Failed to create banner' },
      { status: 500 }
    )
  }
}
