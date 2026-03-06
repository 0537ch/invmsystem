import { NextResponse } from 'next/server'
import { getDb, getBannerStatus } from '@/lib/db'
import type { Banner, Location } from '@/lib/db'

export async function GET() {
  try {
    const sql = getDb()

    const banners = await sql<Banner[]>`
      SELECT * FROM banners
      ORDER BY position ASC
    `

    // Auto-disable expired banners that are still active
    const today = new Date()
    const currentDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    for (const banner of banners) {
      if (banner.active && banner.end_date) {
        const endDate = typeof banner.end_date === 'string'
          ? banner.end_date.split('T')[0]
          : banner.end_date

        if (endDate < currentDate) {
          await sql`
            UPDATE banners
            SET active = false
            WHERE id = ${banner.id}
          `
          banner.active = false
        }
      }
    }

    const bannersWithLocations = await Promise.all(
      banners.map(async (banner) => {
        const locations = await sql<Location[]>`
          SELECT l.*
          FROM locations l
          INNER JOIN banner_locations bl ON l.id = bl.location_id
          WHERE bl.banner_id = ${banner.id}
          ORDER BY l.name ASC
        `
        return {
          ...banner,
          locations,
          status: getBannerStatus(banner.active, banner.start_date, banner.end_date),
        }
      })
    )

    return NextResponse.json({ banners: bannersWithLocations })
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
      end_date = null,
      location_ids = []
    } = body

    const formatDate = (date: string | Date | null): string | null => {
      if (!date) return null;
      // Parse string dates (including ISO format from JSON.stringify)
      if (typeof date === 'string') {
        const parsed = new Date(date);
        if (isNaN(parsed.getTime())) return date; // Invalid date, return as-is
        date = parsed;
      }

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

    // Validate: Don't allow active banner with expired end_date
    if (active && endDate) {
      const today = new Date()
      const currentDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      if (endDate < currentDate) {
        return NextResponse.json(
          { error: 'Cannot create active banner with expired end date. Please update the end date or disable the banner.' },
          { status: 400 }
        )
      }
    }

    // Auto-disable if end_date is in the past
    let finalActive = active
    let wasAutoDisabled = false
    if (active && endDate) {
      const today = new Date()
      const currentDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      if (endDate < currentDate) {
        finalActive = false
        wasAutoDisabled = true
      }
    }

    const [maxPos] = await sql<{ max: number | null }[]>`
      SELECT COALESCE(MAX(position), -1) as max FROM banners
    `

    const newPosition = (maxPos?.max ?? -1) + 1

    const [banner] = await sql<Banner[]>`
      INSERT INTO banners (type, url, duration, title, description, active, image_source, position, start_date, end_date)
      VALUES (${type}, ${url}, ${duration}, ${title}, ${description}, ${finalActive}, ${image_source}, ${newPosition}, ${startDate}, ${endDate})
      RETURNING *
    `

    if (location_ids.length > 0) {
      const values = location_ids.map((locId: number) => [banner.id, locId])
      await sql`INSERT INTO banner_locations (banner_id, location_id) VALUES ${sql(values)}`
    }

    const locations = await sql<Location[]>`
      SELECT l.*
      FROM locations l
      INNER JOIN banner_locations bl ON l.id = bl.location_id
      WHERE bl.banner_id = ${banner.id}
      ORDER BY l.name ASC
    `

    return NextResponse.json(
      {
        banner: {
          ...banner,
          locations,
          status: getBannerStatus(banner.active, banner.start_date, banner.end_date),
        },
        wasAutoDisabled,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating banner:', error)
    return NextResponse.json(
      { error: 'Failed to create banner' },
      { status: 500 }
    )
  }
}
