import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { Banner, Location } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const sql = getDb()
    const { slug } = await params

    const [location] = await sql<Location[]>`
      SELECT * FROM locations WHERE slug = ${slug}
    `

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    const banners = await sql<Banner[]>`
      SELECT b.* FROM banners b
      INNER JOIN banner_locations bl ON b.id = bl.banner_id
      WHERE bl.location_id = ${location.id} AND b.active = true
      ORDER BY b.position ASC
    `

    const today = new Date()
    const currentDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const filteredBanners = banners.filter((banner) => {
      if (!banner.start_date && !banner.end_date) {
        return true
      }

      const startDate = banner.start_date instanceof Date
        ? `${banner.start_date.getFullYear()}-${String(banner.start_date.getMonth() + 1).padStart(2, '0')}-${String(banner.start_date.getDate()).padStart(2, '0')}`
        : (banner.start_date || '').split('T')[0]

      const endDate = banner.end_date instanceof Date
        ? `${banner.end_date.getFullYear()}-${String(banner.end_date.getMonth() + 1).padStart(2, '0')}-${String(banner.end_date.getDate()).padStart(2, '0')}`
        : (banner.end_date || '').split('T')[0]

      const afterStart = !startDate || startDate <= currentDate
      const beforeEnd = !endDate || endDate >= currentDate

      return afterStart && beforeEnd
    })

    const bannersWithLocations = await Promise.all(
      filteredBanners.map(async (banner) => {
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
        }
      })
    )

    return NextResponse.json({ banners: bannersWithLocations, location })
  } catch (error) {
    console.error('Error fetching banners for location:', error)
    return NextResponse.json(
      { error: 'Failed to fetch banners' },
      { status: 500 }
    )
  }
}
