import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { Banner } from '@/lib/db'

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

export async function POST(request: Request) {
  try {
    const sql = getDb()
    const body = await request.json()

    const {
      type,
      url,
      duration = 10,
      title = null,
      description = null,
      active = true,
      image_source = null,
      start_date = null,
      end_date = null
    } = body

    const formatDate = (date: string | Date | null): string | null => {
      if (!date) return null;
      if (typeof date === 'string') return date;

      // Get date in local timezone (Indonesia time)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const startDate = formatDate(start_date);
    const endDate = formatDate(end_date);

    if (!type || !url) {
      return NextResponse.json(
        { error: 'Missing required fields: type and url' },
        { status: 400 }
      )
    }

    const [maxPos] = await sql<{ max: number | null }[]>`
      SELECT COALESCE(MAX(position), -1) as max FROM banners
    `

    const newPosition = (maxPos?.max ?? -1) + 1

    const [banner] = await sql<Banner[]>`
      INSERT INTO banners (type, url, duration, title, description, active, image_source, position, start_date, end_date)
      VALUES (${type}, ${url}, ${duration}, ${title}, ${description}, ${active}, ${image_source}, ${newPosition}, ${startDate}, ${endDate})
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
