import { NextResponse } from 'next/server'

type Controller = ReadableStreamDefaultController<Uint8Array>
const controllers = new Set<Controller>()

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      controllers.add(controller)
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`))
    },
    cancel(controller) {
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

export function broadcastSync() {
  const encoder = new TextEncoder()
  const message = `data: ${JSON.stringify({ type: 'sync' })}\n\n`

  let clientCount = 0
  controllers.forEach((controller) => {
    try {
      controller.enqueue(encoder.encode(message))
      clientCount++
    } catch (error) {
      controllers.delete(controller)
    }
  })

  return clientCount
}
