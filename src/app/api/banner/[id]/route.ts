import { NextResponse } from 'next/server'
import { getDb, getBannerStatus } from '@/lib/db'
import { deleteUploadedFile, isUploadedFile } from '@/lib/file-delete'
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

    // Delete old uploaded file if url is changing
    const isNewUploadedFile = url.startsWith('/uploads/');
    const wasOldUploadedFile = isUploadedFile(currentBanner.url);

    if (wasOldUploadedFile && isNewUploadedFile && currentBanner.url !== url) {
      // Old file was uploaded, new file is also uploaded and different
      await deleteUploadedFile(currentBanner.url).catch(err => {
        console.error('Failed to delete old file:', err);
        // Don't fail the request, just log the error
      });
    }

    // Auto-disable if end_date is changed to past date
    let finalActive = active
    let wasAutoDisabled = false

    const today = new Date()
    const currentDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    // Check if we need to auto-disable due to expired end_date
    if (endDate && endDate < currentDate) {
      if (active === true) {
        // User is trying to enable but end_date is expired
        return NextResponse.json(
          { error: 'Cannot enable banner with expired end date. Please update the end date first.' },
          { status: 400 }
        )
      } else if (active === undefined && currentBanner.active === true) {
        // User didn't specify active, but current banner is active and end_date is expired
        // Auto-disable it
        finalActive = false
        wasAutoDisabled = true
      }
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
        ${finalActive !== undefined ? sql`active = ${finalActive},` : sql``}
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
        const values = location_ids.map((locId: number) => [id, locId])
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

    return NextResponse.json({
      banner: {
        ...banner,
        locations,
        status: getBannerStatus(banner.active, banner.start_date, banner.end_date),
      },
      wasAutoDisabled,
    })
  } catch (error) {
    console.error('Error updating banner:', error)
    return NextResponse.json(
      { error: 'Failed to update banner' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
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

    // Delete uploaded file if exists
    if (isUploadedFile(banner.url)) {
      await deleteUploadedFile(banner.url).catch(err => {
        console.error('Failed to delete banner file:', err);
        // Don't fail the request, just log the error
      });
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
