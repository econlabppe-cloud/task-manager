export type BridgeStatus = 'checking' | 'connected' | 'offline'

export interface BridgeCapture {
  id: string
  text: string
  source: 'api' | 'whatsapp' | 'shortcut' | 'unknown'
  from?: string
  createdAt: string
}

const API_BASE = import.meta.env.VITE_MANDY_BRIDGE_URL ?? ''

async function bridgeFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
}

export async function checkBridgeHealth(): Promise<boolean> {
  const response = await bridgeFetch('/api/bridge/health')
  return response.ok
}

export async function fetchBridgeInbox(): Promise<BridgeCapture[]> {
  const response = await bridgeFetch('/api/bridge/inbox')
  if (!response.ok) throw new Error('Bridge inbox is unavailable')
  const body = await response.json() as { items?: BridgeCapture[] }
  return body.items ?? []
}

export async function ackBridgeCapture(id: string): Promise<void> {
  const response = await bridgeFetch(`/api/bridge/inbox/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Bridge ack failed')
}

export async function captureExternalTask(text: string, source: BridgeCapture['source'] = 'api'): Promise<void> {
  const response = await bridgeFetch('/api/bridge/capture', {
    method: 'POST',
    body: JSON.stringify({ text, source }),
  })
  if (!response.ok) throw new Error('Bridge capture failed')
}
