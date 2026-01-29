import { NextResponse } from 'next/server'
import { broadcastSync } from '../events/route'

// POST - Trigger sync to all connected displays
export async function POST() {
  try {
    // Broadcast sync event to all connected displays
    const clientCount = broadcastSync()

    return NextResponse.json({
      success: true,
      message: `Synced to ${clientCount} display(s)`,
      syncedAt: Date.now()
    })
  } catch (error) {
    console.error('Error triggering sync:', error)
    return NextResponse.json(
      { error: 'Failed to trigger sync' },
      { status: 500 }
    )
  }
}
