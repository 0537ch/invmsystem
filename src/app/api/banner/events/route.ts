import { NextResponse } from 'next/server'

// Store connected controllers in memory
type Controller = ReadableStreamDefaultController<Uint8Array>
const controllers = new Set<Controller>()

// GET - SSE endpoint for display to connect
export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Add this controller to the set
      controllers.add(controller)

      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`))
    },
    cancel(controller) {
      // Remove from set when connection closes
      controllers.delete(controller)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

// Export function to broadcast to all clients
export function broadcastSync() {
  const encoder = new TextEncoder()
  const message = `data: ${JSON.stringify({ type: 'sync' })}\n\n`

  // Send to all connected clients
  let clientCount = 0
  controllers.forEach((controller) => {
    try {
      controller.enqueue(encoder.encode(message))
      clientCount++
    } catch (error) {
      // Remove dead clients
      controllers.delete(controller)
    }
  })

  return clientCount
}
