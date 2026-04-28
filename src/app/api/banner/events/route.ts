import '@/lib/cron';

type Controller = ReadableStreamDefaultController<Uint8Array>
interface ExtendedController extends Controller {
  _keepAlive?: ReturnType<typeof setInterval>
  _clientId?: string
}

const controllers = new Map<string, Controller>()

export async function GET() {
  const encoder = new TextEncoder()
  const clientId = crypto.randomUUID()

  const stream = new ReadableStream({
    start(controller) {
      controllers.set(clientId, controller)

      // Send client ID
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`))

      // Keep-alive every 15s to detect dead connections
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keep-alive\n\n'))
        } catch {
          clearInterval(keepAlive)
          controllers.delete(clientId)
        }
      }, 15000)

      // Store interval for cleanup
      const extController = controller as ExtendedController
      extController._keepAlive = keepAlive
      extController._clientId = clientId
    },
    cancel(controller) {
      const extController = controller as ExtendedController
      if (extController._keepAlive) clearInterval(extController._keepAlive)
      if (extController._clientId) controllers.delete(extController._clientId)
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
    } catch {
      controllers.delete(clientId)
    }
  })

  return clientCount
}
