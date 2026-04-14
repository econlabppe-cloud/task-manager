/**
 * api/assistant-capture.ts
 *
 * Webhook endpoint for Google Assistant / IFTTT integration.
 *
 * POST  ?token=<ASSISTANT_WEBHOOK_TOKEN>  { text, source? }   → enqueues an item
 * GET   (no auth)                                              → returns & clears the queue
 *
 * The queue is an in-memory module-level array — it persists while the Vercel
 * function instance is warm (typically minutes).  For a personal home app this
 * is sufficient: Assistant fires, the app polls within 30 s and consumes it.
 */

declare const process: { env: Record<string, string | undefined> }

interface CaptureItem {
  id: string
  text: string
  source: string
  capturedAt: string
}

// In-memory queue.  Intentionally simple for a personal-use app.
const queue: CaptureItem[] = []
const MAX_QUEUE = 50

function json(status: number, body: unknown): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

function tokenOk(request: Request): boolean {
  const expected = process.env.ASSISTANT_WEBHOOK_TOKEN
  if (!expected) return false                                    // must configure token
  const url = new URL(request.url)
  const fromQuery = url.searchParams.get('token')
  const fromHeader = request.headers.get('x-webhook-token')
  return fromQuery === expected || fromHeader === expected
}

function makeId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default {
  async fetch(request: Request): Promise<Response> {
    // CORS preflight (IFTTT / mobile browsers)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST',
          'Access-Control-Allow-Headers': 'content-type, x-webhook-token',
        },
      })
    }

    // ── POST: Google Assistant / IFTTT → enqueue ──────────────────────────────
    if (request.method === 'POST') {
      if (!tokenOk(request)) return json(401, { ok: false, error: 'unauthorized' })

      let body: Record<string, string>
      try { body = await request.json() as Record<string, string> }
      catch { return json(400, { ok: false, error: 'invalid_json' }) }

      // Support { text } (direct) and { value1 } (IFTTT Webhooks format)
      const text = (body.text ?? body.value1 ?? '').trim()
      if (!text) return json(400, { ok: false, error: 'text_required' })

      const item: CaptureItem = {
        id: makeId(),
        text,
        source: body.source ?? 'google-assistant',
        capturedAt: new Date().toISOString(),
      }

      queue.push(item)
      if (queue.length > MAX_QUEUE) queue.splice(0, queue.length - MAX_QUEUE)

      return json(200, { ok: true, id: item.id, queued: queue.length })
    }

    // ── GET: app polls → return & clear queue ────────────────────────────────
    if (request.method === 'GET') {
      const items = queue.splice(0)           // take all, leave queue empty
      return json(200, { ok: true, items })
    }

    return json(405, { ok: false, error: 'method_not_allowed' })
  },
}
