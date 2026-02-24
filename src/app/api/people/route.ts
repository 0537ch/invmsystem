import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getTokenFromCookie } from '@/lib/token'

export async function DELETE(request: Request) {
  try {
    const token = await getTokenFromCookie()
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const importId = searchParams.get('importId')

    if (!importId) {
      return NextResponse.json(
        { error: 'Import ID is required' },
        { status: 400 }
      )
    }

    const [importRecord] = await sql<{ is_active: boolean }[]>`
      SELECT is_active FROM imports WHERE id = ${parseInt(importId)}
    `

    await sql`DELETE FROM rows WHERE import_id = ${parseInt(importId)}`

    await sql`DELETE FROM imports WHERE id = ${parseInt(importId)}`

    if (importRecord?.is_active) {
      await sql`
        UPDATE imports
        SET is_active = true
        WHERE id = (
          SELECT id FROM imports ORDER BY uploaded_at DESC LIMIT 1
        )
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete import' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const token = await getTokenFromCookie()
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const importId = searchParams.get('importId')

    const imports = await sql<{ id: number; file_name: string; uploaded_at: Date }[]>`
      SELECT id, file_name, uploaded_at
      FROM imports
      ORDER BY uploaded_at DESC
    `

    let selectedImportId = importId ? parseInt(importId) : null

    if (!selectedImportId) {
      const [latestActive] = await sql<{ id: number }[]>`
        SELECT id
        FROM imports
        WHERE is_active = true
        ORDER BY uploaded_at DESC
        LIMIT 1
      `
      selectedImportId = latestActive?.id || null

      if (!selectedImportId && imports.length > 0) {
        selectedImportId = imports[0].id
      }
    }

    if (!selectedImportId) {
      return NextResponse.json({ rows: [], imports: [] })
    }

    const rows = await sql`
      SELECT id, data, created_at, notification_status, notification_sent_at, notification_error
      FROM rows
      WHERE import_id = ${selectedImportId}
      ORDER BY created_at
    `

    const parsedRows = rows.map(row => ({
      ...row,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data
    }))

    return NextResponse.json({
      rows: parsedRows,
      imports,
      selectedImportId
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch rows' },
      { status: 500 }
    )
  }
}
