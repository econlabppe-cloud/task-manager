/**
 * useGoogleCalendarAutoSync
 *
 * Manages the full Google Calendar integration lifecycle:
 *  - Checks OAuth status on mount
 *  - Polls every GOOGLE_SYNC_INTERVAL_MS when connected + tab visible
 *  - Pauses when tab is hidden (Page Visibility API) to save quota
 *  - Resumes on reconnect (navigator.onLine)
 *  - Persists autoSyncEnabled preference in localStorage
 *  - Exposes manual-trigger + connect/disconnect controls
 */
import React from 'react'
import { fetchGoogleCalendarAuthStatus } from '../googleCalendarSync'
import { GOOGLE_SYNC_INTERVAL_MS, GOOGLE_SYNC_PREFS_KEY } from '../constants'
import type { BoardState } from '../types'

export type GoogleSyncStatus = 'idle' | 'checking' | 'syncing' | 'success' | 'error' | 'disconnected'

export interface GoogleSyncState {
  /** True if OAuth token is valid */
  isConnected: boolean
  /** True while a sync request is in-flight */
  isSyncing: boolean
  /** Whether background auto-sync is enabled */
  autoSyncEnabled: boolean
  /** ISO timestamp of last successful sync */
  lastSyncedAt: string | null
  /** How many events were imported in last sync */
  lastSyncedCount: number
  /** Last error message, null if no error */
  error: string | null
  /** Google OAuth redirect URL */
  authUrl: string
  /** Current status token */
  status: GoogleSyncStatus
}

interface SyncPrefs {
  autoSyncEnabled: boolean
  lastSyncedAt: string | null
  lastSyncedCount: number
}

function loadPrefs(): SyncPrefs {
  try {
    const raw = localStorage.getItem(GOOGLE_SYNC_PREFS_KEY)
    if (raw) return JSON.parse(raw) as SyncPrefs
  } catch { /* ignore */ }
  return { autoSyncEnabled: true, lastSyncedAt: null, lastSyncedCount: 0 }
}

function savePrefs(prefs: SyncPrefs): void {
  try { localStorage.setItem(GOOGLE_SYNC_PREFS_KEY, JSON.stringify(prefs)) }
  catch { /* ignore */ }
}

export function useGoogleCalendarAutoSync(
  _setState: React.Dispatch<React.SetStateAction<BoardState>>,
  syncFn: (calendarUrl?: string) => Promise<number>,
): [GoogleSyncState, {
  manualSync: (calendarUrl?: string) => Promise<void>
  toggleAutoSync: () => void
  disconnect: () => void
}] {
  const prefs = React.useRef<SyncPrefs>(loadPrefs())

  const [syncState, setSyncState] = React.useState<GoogleSyncState>(() => ({
    isConnected: false,
    isSyncing: false,
    autoSyncEnabled: prefs.current.autoSyncEnabled,
    lastSyncedAt: prefs.current.lastSyncedAt,
    lastSyncedCount: prefs.current.lastSyncedCount,
    error: null,
    authUrl: '',
    status: 'checking',
  }))

  const isSyncingRef = React.useRef(false)
  const isConnectedRef = React.useRef(false)

  // ── Check OAuth status on mount ──────────────────────────────────
  React.useEffect(() => {
    let cancelled = false
    fetchGoogleCalendarAuthStatus()
      .then(status => {
        if (cancelled) return
        isConnectedRef.current = status.connected
        setSyncState(s => ({
          ...s,
          isConnected: status.connected,
          authUrl: status.authUrl ?? '',
          status: status.connected ? 'idle' : 'disconnected',
        }))
      })
      .catch(() => {
        if (cancelled) return
        setSyncState(s => ({ ...s, status: 'disconnected', isConnected: false }))
      })
    return () => { cancelled = true }
  }, [])

  // ── Core sync function ───────────────────────────────────────────
  const runSync = React.useCallback(async (calendarUrl?: string) => {
    if (isSyncingRef.current) return
    isSyncingRef.current = true

    setSyncState(s => ({ ...s, isSyncing: true, status: 'syncing', error: null }))

    try {
      const addedCount = await syncFn(calendarUrl)
      const now = new Date().toISOString()
      prefs.current = { ...prefs.current, lastSyncedAt: now, lastSyncedCount: addedCount }
      savePrefs(prefs.current)

      setSyncState(s => ({
        ...s,
        isSyncing: false,
        status: 'success',
        lastSyncedAt: now,
        lastSyncedCount: addedCount,
        error: null,
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה לא ידועה'
      // Detect auth failure → disable auto-sync to avoid hammering expired tokens
      const isAuthError = msg.includes('401') || msg.includes('auth') || msg.includes('token')
      if (isAuthError) isConnectedRef.current = false

      setSyncState(s => ({
        ...s,
        isSyncing: false,
        status: 'error',
        error: isAuthError ? 'פג תוקף ההתחברות לגוגל — יש להתחבר מחדש' : `שגיאה בסנכרון: ${msg}`,
        isConnected: isAuthError ? false : s.isConnected,
      }))
    } finally {
      isSyncingRef.current = false
    }
  }, [syncFn])

  // ── Auto-polling with Page Visibility + online guard ─────────────
  React.useEffect(() => {
    let intervalId: number | null = null

    const startPolling = () => {
      if (intervalId !== null) return
      intervalId = window.setInterval(() => {
        if (
          !isConnectedRef.current ||
          !prefs.current.autoSyncEnabled ||
          isSyncingRef.current ||
          document.visibilityState === 'hidden' ||
          !navigator.onLine
        ) return
        void runSync()
      }, GOOGLE_SYNC_INTERVAL_MS)
    }

    const stopPolling = () => {
      if (intervalId !== null) { window.clearInterval(intervalId); intervalId = null }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isConnectedRef.current && prefs.current.autoSyncEnabled) {
        // Immediate sync on tab focus if it's been a while
        const sinceMs = syncState.lastSyncedAt
          ? Date.now() - new Date(syncState.lastSyncedAt).getTime()
          : Infinity
        if (sinceMs > GOOGLE_SYNC_INTERVAL_MS) void runSync()
        startPolling()
      }
    }

    const handleOnline = () => {
      if (isConnectedRef.current && prefs.current.autoSyncEnabled) void runSync()
    }

    startPolling()
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('online', handleOnline)

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('online', handleOnline)
    }
  }, [runSync, syncState.lastSyncedAt])

  // ── Controls ─────────────────────────────────────────────────────
  const manualSync = React.useCallback(async (calendarUrl?: string) => {
    await runSync(calendarUrl)
  }, [runSync])

  const toggleAutoSync = React.useCallback(() => {
    prefs.current = { ...prefs.current, autoSyncEnabled: !prefs.current.autoSyncEnabled }
    savePrefs(prefs.current)
    setSyncState(s => ({ ...s, autoSyncEnabled: prefs.current.autoSyncEnabled }))
  }, [])

  const disconnect = React.useCallback(() => {
    isConnectedRef.current = false
    setSyncState(s => ({ ...s, isConnected: false, status: 'disconnected' }))
    // Revoke server-side token via fetch (best-effort)
    fetch('/api/google-calendar-auth?revoke=1').catch(() => {})
  }, [])

  return [syncState, { manualSync, toggleAutoSync, disconnect }]
}

/** Human-readable "last synced X ago" string */
export function formatLastSynced(lastSyncedAt: string | null): string {
  if (!lastSyncedAt) return 'לא סונכרן עדיין'
  const diffMs = Date.now() - new Date(lastSyncedAt).getTime()
  const diffMin = Math.round(diffMs / 60_000)
  if (diffMin < 1) return 'לפני פחות מדקה'
  if (diffMin < 60) return `לפני ${diffMin} דקות`
  const diffHrs = Math.round(diffMin / 60)
  if (diffHrs < 24) return `לפני ${diffHrs} שעות`
  return `לפני ${Math.round(diffHrs / 24)} ימים`
}
