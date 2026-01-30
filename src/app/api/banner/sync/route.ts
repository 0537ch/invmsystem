import { NextResponse } from 'next/server'
import { broadcastSync } from '../events/route'

let lastSyncTime = 0;
const SYNC_COOLDOWN = 500;

export async function POST() {
  try {
    const now = Date.now();

    if (now - lastSyncTime < SYNC_COOLDOWN) {
      return NextResponse.json({
        success: false,
        message: `Please wait ${SYNC_COOLDOWN - (now - lastSyncTime)}ms before syncing again`,
      }, { status: 429 }); // 429 Too Many Requests
    }

    lastSyncTime = now;

    const clientCount = broadcastSync()

    return NextResponse.json({
      success: true,
      message: `Synced to ${clientCount} display(s)`,
      syncedAt: now
    })
  } catch (error) {
    console.error('Error triggering sync:', error)
    return NextResponse.json(
      { error: 'Failed to trigger sync' },
      { status: 500 }
    )
  }
}
