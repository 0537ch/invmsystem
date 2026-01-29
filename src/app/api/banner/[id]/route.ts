import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { Banner } from '@/lib/db'

// PUT update banner
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sql = getDb()
    const { id: idParam } = await params
    const id = parseInt(idParam)
    const body = await request.json()

    const { type, url, duration, title, description, active, image_source, position } = body

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid banner ID' },
        { status: 400 }
      )
    }

    // Get current banner to check old position
    const [currentBanner] = await sql<Banner[]>`
      SELECT * FROM banners WHERE id = ${id}
    `

    if (!currentBanner) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      )
    }

    // If position is being updated
    if (position !== undefined && position !== currentBanner.position) {
      const oldPosition = currentBanner.position
      const newPosition = position

      if (newPosition < oldPosition) {
        // Moving up: increment positions of items in [newPosition, oldPosition-1]
        await sql`
          UPDATE banners
          SET position = position + 1
          WHERE position >= ${newPosition} AND position < ${oldPosition} AND id != ${id}
        `
      } else {
        // Moving down: decrement positions of items in [oldPosition+1, newPosition]
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
        title = ${title || null},
        description = ${description || null},
        active = COALESCE(${active}, active),
        image_source = ${image_source || null},
        position = COALESCE(${position}, position),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ banner })
  } catch (error) {
    console.error('Error updating banner:', error)
    return NextResponse.json(
      { error: 'Failed to update banner' },
      { status: 500 }
    )
  }
}

// DELETE banner
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

    // Reorder remaining banners
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
