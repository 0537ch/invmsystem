import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

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
        { error: 'Invalid location ID' },
        { status: 400 }
      )
    }

    const [location] = await sql`
      DELETE FROM locations
      WHERE id = ${id}
      RETURNING *
    `

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting location:', error)
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    )
  }
}
