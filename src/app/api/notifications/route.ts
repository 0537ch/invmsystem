import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(request: Request) {
  try {
    console.log('📝 POST /api/notifications called')

    const sql = getDb()
    const body = await request.json()
    const { rowIds, status, error } = body

    console.log('📝 Request body:', { rowIds, status, error })

    if (!rowIds || !Array.isArray(rowIds) || rowIds.length === 0) {
      console.error('❌ Invalid rowIds:', rowIds)
      return NextResponse.json(
        { error: 'rowIds is required' },
        { status: 400 }
      )
    }

    if (!['not_yet', 'success', 'failed'].includes(status)) {
      console.error('❌ Invalid status:', status)
      return NextResponse.json(
        { error: 'Invalid status. Must be: not_yet, success, or failed' },
        { status: 400 }
      )
    }

    console.log(`📝 Updating ${rowIds.length} rows to status: ${status}`)

    // Update notification status for all rows
    const result = await sql`
      UPDATE rows
      SET
        notification_status = ${status},
        notification_sent_at = CASE
          WHEN ${status} = 'success' THEN CURRENT_TIMESTAMP
          ELSE notification_sent_at
        END,
        notification_error = ${error || null}
      WHERE id = ANY(${rowIds})
    `

    console.log('✅ Update result:', result)

    return NextResponse.json({ success: true, updated: rowIds.length })
  } catch (error) {
    console.error('❌ Error updating notification status:', error)
    return NextResponse.json(
      { error: 'Failed to update notification status' },
      { status: 500 }
    )
  }
}
