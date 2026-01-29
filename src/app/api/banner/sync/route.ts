import { NextResponse } from 'next/server'
import { broadcastSync } from '../events/route'

// Simple rate limiting to prevent abuse
let lastSyncTime = 0;
const SYNC_COOLDOWN = 500; // 500ms minimum between syncs

// POST - Trigger sync to all connected displays
export async function POST() {
  try {
    const now = Date.now();

    // Rate limiting - prevent rapid sync spamming
    if (now - lastSyncTime < SYNC_COOLDOWN) {
      return NextResponse.json({
        success: false,
        message: `Please wait ${SYNC_COOLDOWN - (now - lastSyncTime)}ms before syncing again`,
      }, { status: 429 }); // 429 Too Many Requests
    }

    lastSyncTime = now;

    // Broadcast sync event to all connected displays
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
