import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { Banner, Location } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sql = getDb()
    const { id: idParam } = await params
    const id = parseInt(idParam)
    const body = await request.json()

    const {
      type,
      url,
      duration = 10,
      title = null,
      description = null,
      active = undefined,
      image_source = null,
      position = undefined,
      start_date = null,
      end_date = null,
      location_ids = undefined
    } = body

    const formatDate = (date: string | Date | null): string | null => {
      if (!date) return null;
      if (typeof date === 'string') return date;

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

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid banner ID' },
        { status: 400 }
      )
    }

    const [currentBanner] = await sql<Banner[]>`
      SELECT * FROM banners WHERE id = ${id}
    `

    if (!currentBanner) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      )
    }

    if (position !== undefined && position !== currentBanner.position) {
      const oldPosition = currentBanner.position
      const newPosition = position

      if (newPosition < oldPosition) {
        await sql`
          UPDATE banners
          SET position = position + 1
          WHERE position >= ${newPosition} AND position < ${oldPosition} AND id != ${id}
        `
      } else {
        await sql`
          UPDATE banners
          SET position = position - 1
          WHERE position > ${oldPosition} AND position <= ${newPosition} AND id != ${id}
        `
      }
    }

    const [banner] = await sql<Banner[]>`
      UPDATE banners
      SET
        type = ${type},
        url = ${url},
        duration = ${duration},
        title = ${title},
        description = ${description},
        ${active !== undefined ? sql`active = ${active},` : sql``}
        image_source = ${image_source},
        ${position !== undefined ? sql`position = ${position},` : sql``}
        start_date = ${startDate},
        end_date = ${endDate},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (location_ids !== undefined) {
      await sql`
        DELETE FROM banner_locations WHERE banner_id = ${id}
      `

      if (location_ids.length > 0) {
        const values = location_ids.map(locId => [id, locId])
        await sql`INSERT INTO banner_locations (banner_id, location_id) VALUES ${sql(values)}`
      }
    }

    const locations = await sql<Location[]>`
      SELECT l.*
      FROM locations l
      INNER JOIN banner_locations bl ON l.id = bl.location_id
      WHERE bl.banner_id = ${id}
      ORDER BY l.name ASC
    `

    return NextResponse.json({ banner: { ...banner, locations } })
  } catch (error) {
    console.error('Error updating banner:', error)
    return NextResponse.json(
      { error: 'Failed to update banner' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sql = getDb()
    const { id: idParam } = await params
    const id = parseInt(idParam)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid banner ID' },
        { status: 400 }
      )
    }

    const [banner] = await sql<Banner[]>`
      DELETE FROM banners
      WHERE id = ${id}
      RETURNING *
    `

    if (!banner) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      )
    }

    await sql`
      UPDATE banners
      SET position = position - 1
      WHERE position > ${banner.position}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting banner:', error)
    return NextResponse.json(
      { error: 'Failed to delete banner' },
      { status: 500 }
    )
  }
}
