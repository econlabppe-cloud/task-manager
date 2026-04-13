import { createServer } from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data')
const INBOX_PATH = join(DATA_DIR, 'bridge-inbox.json')
const PORT = Number(process.env.MANDY_BRIDGE_PORT ?? 8787)
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? 'mandy-local-verify-token'
const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION ?? 'v24.0'

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(JSON.stringify(body))
}

function sendText(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(body)
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  return JSON.parse(raw)
}

async function readInbox() {
  try {
    const raw = await readFile(INBOX_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed.items) ? parsed.items : []
  } catch {
    return []
  }
}

async function writeInbox(items) {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(INBOX_PATH, JSON.stringify({ items }, null, 2), 'utf8')
}

function captureId(source, text, from) {
  const seed = `${source}:${from ?? ''}:${text}:${Date.now()}:${Math.random()}`
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }
  return `capture-${hash.toString(36)}-${Date.now().toString(36)}`
}

async function addCapture({ text, source = 'api', from, externalId }) {
  const cleanText = String(text ?? '').trim()
  if (!cleanText) return null

  const items = await readInbox()
  const id = externalId ? `capture-${source}-${externalId}` : captureId(source, cleanText, from)
  if (items.some(item => item.id === id)) return items.find(item => item.id === id)

  const item = {
    id,
    text: cleanText,
    source,
    from,
    createdAt: new Date().toISOString(),
  }
  await writeInbox([...items, item])
  return item
}

async function removeCapture(id) {
  const items = await readInbox()
  const next = items.filter(item => item.id !== id)
  await writeInbox(next)
  return items.length !== next.length
}

function extractWhatsAppMessages(payload) {
  const messages = []
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {}
      for (const message of value.messages ?? []) {
        if (message.type !== 'text') continue
        messages.push({
          text: message.text?.body,
          from: message.from,
          messageId: message.id,
        })
      }
    }
  }
  return messages.filter(message => message.text)
}

async function sendWhatsAppReply(to, body) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneNumberId || !to) return

  const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        preview_url: false,
        body,
      },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error(`WhatsApp reply failed: ${response.status} ${text}`)
  }
}

async function handleWhatsAppGet(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) {
    sendText(res, 200, challenge)
    return
  }

  sendText(res, 403, 'Forbidden')
}

async function handleWhatsAppPost(req, res) {
  const payload = await readBody(req)
  const messages = extractWhatsAppMessages(payload)
  const captured = []

  for (const message of messages) {
    const item = await addCapture({
      text: message.text,
      source: 'whatsapp',
      from: message.from,
      externalId: message.messageId,
    })
    if (item) captured.push(item)
    await sendWhatsAppReply(message.from, `קיבלתי למאנדי: ${message.text}`)
  }

  sendJson(res, 200, { ok: true, captured: captured.length })
}

async function route(req, res) {
  try {
    if (req.method === 'OPTIONS') {
      sendText(res, 204, '')
      return
    }

    const url = new URL(req.url, `http://${req.headers.host}`)

    if (req.method === 'GET' && url.pathname === '/api/bridge/health') {
      sendJson(res, 200, { ok: true, service: 'mandy-bridge', now: new Date().toISOString() })
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/bridge/inbox') {
      sendJson(res, 200, { items: await readInbox() })
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/bridge/capture') {
      const body = await readBody(req)
      const item = await addCapture({
        text: body.text,
        source: body.source ?? 'api',
        from: body.from,
      })
      if (!item) {
        sendJson(res, 400, { ok: false, error: 'text is required' })
        return
      }
      sendJson(res, 201, { ok: true, item })
      return
    }

    if (req.method === 'DELETE' && url.pathname.startsWith('/api/bridge/inbox/')) {
      const id = decodeURIComponent(url.pathname.replace('/api/bridge/inbox/', ''))
      sendJson(res, 200, { ok: true, removed: await removeCapture(id) })
      return
    }

    if (req.method === 'GET' && url.pathname === '/webhooks/whatsapp') {
      await handleWhatsAppGet(req, res)
      return
    }

    if (req.method === 'POST' && url.pathname === '/webhooks/whatsapp') {
      await handleWhatsAppPost(req, res)
      return
    }

    sendJson(res, 404, { ok: false, error: 'not found' })
  } catch (error) {
    console.error(error)
    sendJson(res, 500, { ok: false, error: 'internal error' })
  }
}

createServer(route).listen(PORT, () => {
  console.log(`Mandy bridge listening on http://127.0.0.1:${PORT}`)
  console.log(`WhatsApp verify token: ${VERIFY_TOKEN}`)
})
