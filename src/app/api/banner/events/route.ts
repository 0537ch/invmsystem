import '@/lib/cron';

type Controller = ReadableStreamDefaultController<Uint8Array>
interface ExtendedController extends Controller {
  _keepAlive?: ReturnType<typeof setInterval>
  _deviceId?: string
}

const controllers = new Map<string, Controller>()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const deviceId = searchParams.get('deviceId')

  if (!deviceId) {
    return Response.json({ error: 'deviceId required' }, { status: 400 })
  }

  const encoder = new TextEncoder()

  // IDEMPOTENCY: Close existing connection for this device if exists
  const existingController = controllers.get(deviceId)
  if (existingController) {
    try {
      const extExisting = existingController as ExtendedController
      if (extExisting._keepAlive) clearInterval(extExisting._keepAlive)
      existingController.close()
    } catch {
      // Already closed
    }
  }

  const stream = new ReadableStream({
    start(controller) {
      controllers.set(deviceId, controller)

      // Send connection confirmation
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', deviceId })}\n\n`))

      // Keep-alive every 15s to detect dead connections
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keep-alive\n\n'))
        } catch {
          clearInterval(keepAlive)
          controllers.delete(deviceId)
        }
      }, 15000)

      // Store interval for cleanup
      const extController = controller as ExtendedController
      extController._keepAlive = keepAlive
      extController._deviceId = deviceId
    },
    cancel(controller) {
      const extController = controller as ExtendedController
      if (extController._keepAlive) clearInterval(extController._keepAlive)
      if (extController._deviceId) controllers.delete(extController._deviceId)
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
  const deviceId = searchParams.get('deviceId')

  if (!deviceId) {
    return Response.json({ error: 'deviceId required' }, { status: 400 })
  }

  const controller = controllers.get(deviceId)
  if (controller) {
    try {
      const extController = controller as ExtendedController
      if (extController._keepAlive) clearInterval(extController._keepAlive)
      controller.close()
    } catch {
      // Already closed
    }
    controllers.delete(deviceId)
    return Response.json({ success: true, message: 'Disconnected' })
  }

  return Response.json({ error: 'Device not found' }, { status: 404 })
}

export function broadcastSync() {
  const encoder = new TextEncoder()
  const message = `data: ${JSON.stringify({ type: 'sync' })}\n\n`

  let clientCount = 0
  controllers.forEach((controller, deviceId) => {
    try {
      controller.enqueue(encoder.encode(message))
      clientCount++
    } catch {
      controllers.delete(deviceId)
    }
  })

  return clientCount
}
