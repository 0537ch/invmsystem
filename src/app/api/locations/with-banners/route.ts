import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { Banner, Location } from '@/lib/db'

export async function GET() {
  try {
    const sql = getDb()

    const locations = await sql<Location[]>`
      SELECT * FROM locations
      ORDER BY name ASC
    `

    const locationsWithBanners = await Promise.all(
      locations.map(async (location) => {
        const banners = await sql<Banner[]>`
          SELECT b.* FROM banners b
          INNER JOIN banner_locations bl ON b.id = bl.banner_id
          WHERE bl.location_id = ${location.id}
          ORDER BY b.position ASC
        `
        return {
          ...location,
          banners,
        }
      })
    )

    return NextResponse.json({ locations: locationsWithBanners })
  } catch (error) {
    console.error('Error fetching locations with banners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}
