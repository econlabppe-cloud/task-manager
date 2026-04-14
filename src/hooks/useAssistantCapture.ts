/**
 * useAssistantCapture
 *
 * Polls /api/assistant-capture every 30 s while the tab is visible & online.
 * When items arrive (from Google Assistant via IFTTT), calls onCapture() with them.
 *
 * The endpoint is the in-memory queue in api/assistant-capture.ts.
 * The queue is cleared server-side on each GET, so the hook is the sole consumer.
 */
import React from 'react'

export interface AssistantCaptureItem {
  id: string
  text: string
  source: string
  capturedAt: string
}

const POLL_INTERVAL_MS = 30_000

export function useAssistantCapture(
  onCapture: (items: AssistantCaptureItem[]) => void,
  enabled = true,
): { lastChecked: string | null } {
  const lastChecked = React.useRef<string | null>(null)
  const [ts, setTs] = React.useState<string | null>(null)
  const onCaptureRef = React.useRef(onCapture)
  React.useLayoutEffect(() => { onCaptureRef.current = onCapture })

  const poll = React.useCallback(async () => {
    try {
      const res = await fetch('/api/assistant-capture', { cache: 'no-store' })
      if (!res.ok) return
      const body = await res.json() as { ok: boolean; items?: AssistantCaptureItem[] }
      if (!body.ok || !body.items?.length) return
      onCaptureRef.current(body.items)
      lastChecked.current = new Date().toISOString()
      setTs(lastChecked.current)
    } catch { /* feature is optional — network errors are silently ignored */ }
  }, [])

  React.useEffect(() => {
    if (!enabled) return
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'hidden' && navigator.onLine) void poll()
    }, POLL_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [enabled, poll])

  return { lastChecked: ts }
}
