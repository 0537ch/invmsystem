import '@/lib/cron';

type Controller = ReadableStreamDefaultController<Uint8Array>
const controllers = new Map<string, Controller>()  // Changed to Map with IDs

export async function GET() {
  const encoder = new TextEncoder()
  const clientId = crypto.randomUUID()

  const stream = new ReadableStream({
    start(controller) {
      controllers.set(clientId, controller)
      console.log(`🟢 SSE: Client ${clientId} connected (Total: ${controllers.size})`)

      // Send client ID
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`))

      // Keep-alive every 15s to detect dead connections
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keep-alive\n\n'))
        } catch (error) {
          clearInterval(keepAlive)
          controllers.delete(clientId)
          console.log(`🔴 SSE: Client ${clientId} removed (keep-alive failed) (Total: ${controllers.size})`)
        }
      }, 15000)

      // Store interval for cleanup
      ;(controller as any)._keepAlive = keepAlive
      ;(controller as any)._clientId = clientId
    },
    cancel(controller) {
      const interval = (controller as any)._keepAlive
      const id = (controller as any)._clientId
      if (interval) clearInterval(interval)
      if (id) controllers.delete(id)
      console.log(`🔴 SSE: Client ${id} disconnected via cancel() (Total: ${controllers.size})`)
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

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')

  if (!clientId) {
    return Response.json({ error: 'clientId required' }, { status: 400 })
  }

  const controller = controllers.get(clientId)
  if (controller) {
    try {
      controller.close()
    } catch (e) {
      // Already closed
    }
    controllers.delete(clientId)
    console.log(`🔴 SSE: Client ${clientId} disconnected via DELETE (Total: ${controllers.size})`)
    return Response.json({ success: true, message: 'Disconnected' })
  }

  return Response.json({ error: 'Client not found' }, { status: 404 })
}

export function broadcastSync() {
  const encoder = new TextEncoder()
  const message = `data: ${JSON.stringify({ type: 'sync' })}\n\n`

  let clientCount = 0
  controllers.forEach((controller, clientId) => {
    try {
      controller.enqueue(encoder.encode(message))
      clientCount++
    } catch (error) {
      controllers.delete(clientId)
      console.log(`🔴 SSE: Client ${clientId} removed (enqueue failed) (Total: ${controllers.size})`)
    }
  })

  return clientCount
}
