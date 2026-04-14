import React from 'react'
import { BridgeStatus, captureExternalTask } from '../apiBridge'
import type { GoogleSyncState } from '../hooks/useGoogleCalendarAutoSync'
import { formatLastSynced } from '../hooks/useGoogleCalendarAutoSync'

interface Props {
  bridgeStatus: BridgeStatus
  syncState: GoogleSyncState
  onManualSync: (calendarUrl?: string) => Promise<void>
  onToggleAutoSync: () => void
  onDisconnect: () => void
}

const bridgeStatusText: Record<BridgeStatus, string> = {
  checking: 'בודק חיבור',
  connected: 'מחובר',
  offline: 'לא מחובר',
}
const bridgeStatusClass: Record<BridgeStatus, string> = {
  checking: 'bg-amber-50 text-amber-700 border-amber-200',
  connected: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  offline: 'bg-gray-50 text-gray-500 border-gray-200',
}

function SyncStatusDot({ status }: { status: GoogleSyncState['status'] }) {
  if (status === 'syncing') return (
    <svg className="w-3 h-3 animate-spin text-sky-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
  if (status === 'success') return <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
  if (status === 'error') return <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
  if (status === 'disconnected') return <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
  return <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
}

export const IntegrationHub: React.FC<Props> = ({
  bridgeStatus, syncState,
  onManualSync, onToggleAutoSync, onDisconnect,
}) => {
  const [testText, setTestText] = React.useState('מחר לקנות חלב לילדים, שנינו, בינוני')
  const [calendarUrl, setCalendarUrl] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [showAdvanced, setShowAdvanced] = React.useState(false)

  React.useEffect(() => {
    if (!message) return
    const id = window.setTimeout(() => setMessage(''), 3500)
    return () => window.clearTimeout(id)
  }, [message])

  const sendTest = async () => {
    try {
      await captureExternalTask(testText, 'shortcut')
      setMessage('נשלח לגשר. מאנדי ימשוך את זה כמשימה חכמה בעוד רגע.')
    } catch {
      setMessage('הגשר לא מחובר. הפעילו npm run bridge בחלון נפרד.')
    }
  }

  const handleSync = async () => {
    await onManualSync(calendarUrl.trim() || undefined)
    if (syncState.error) return
    const n = syncState.lastSyncedCount
    setMessage(n > 0 ? `יובאו ${n} אירועים חדשים מהיומן.` : 'הלוח מסונכרן — אין שינויים חדשים.')
  }

  return (
    <section aria-labelledby="integrations-title" className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 id="integrations-title" className="text-base font-bold text-gray-900">חיבורים ואינטגרציות</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Google Calendar, WhatsApp, API חיצוני
          </p>
        </div>
        <span className={`text-xs font-semibold rounded border px-3 py-1.5 ${bridgeStatusClass[bridgeStatus]}`}>
          {bridgeStatusText[bridgeStatus]}
        </span>
      </div>

      {/* ── Google Calendar auto-sync card ───────────────────────── */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            {/* Google Calendar icon */}
            <div className="w-7 h-7 rounded bg-white border border-gray-200 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="3" y="4" width="18" height="17" rx="2" fill="#4285F4" />
                <rect x="3" y="4" width="18" height="5" fill="#1A73E8" />
                <rect x="8" y="2" width="2" height="4" rx="1" fill="#1A73E8" />
                <rect x="14" y="2" width="2" height="4" rx="1" fill="#1A73E8" />
                <rect x="7" y="12" width="4" height="4" rx="0.5" fill="white" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-gray-800 leading-tight">Google Calendar</div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                <SyncStatusDot status={syncState.status} />
                {syncState.isConnected ? (
                  <span>
                    {syncState.status === 'syncing' ? 'מסנכרן...' : `סונכרן ${formatLastSynced(syncState.lastSyncedAt)}`}
                  </span>
                ) : (
                  <span>לא מחובר</span>
                )}
              </div>
            </div>
          </div>

          {/* Auto-sync toggle */}
          {syncState.isConnected && (
            <label className="flex items-center gap-2 cursor-pointer select-none" title="סנכרון אוטומטי כל 5 דקות">
              <span className="text-xs text-gray-500">אוטומטי</span>
              <button
                role="switch"
                aria-checked={syncState.autoSyncEnabled}
                onClick={onToggleAutoSync}
                className={`relative inline-flex h-5 w-9 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 ${
                  syncState.autoSyncEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
                    syncState.autoSyncEnabled ? '-translate-x-4' : '-translate-x-0.5'
                  }`}
                />
              </button>
            </label>
          )}
        </div>

        {/* Error banner */}
        {syncState.error && (
          <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2" role="alert">
            {syncState.error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {!syncState.isConnected ? (
            <a
              href={syncState.authUrl || undefined}
              className={`flex items-center gap-1.5 rounded text-xs font-semibold px-3 py-2 transition-colors ${
                syncState.authUrl
                  ? 'bg-sky-600 text-white hover:bg-sky-700'
                  : 'bg-gray-200 text-gray-400 pointer-events-none'
              }`}
              aria-disabled={!syncState.authUrl}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              התחבר לגוגל
            </a>
          ) : (
            <>
              <button
                onClick={handleSync}
                disabled={syncState.isSyncing}
                aria-busy={syncState.isSyncing}
                className="flex items-center gap-1.5 rounded bg-emerald-600 text-white text-xs font-semibold px-3 py-2 hover:bg-emerald-700 disabled:bg-gray-300 transition-colors"
              >
                {syncState.isSyncing ? (
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                {syncState.isSyncing ? 'מסנכרן...' : 'סנכרן עכשיו'}
              </button>

              <button
                onClick={onDisconnect}
                className="rounded text-xs text-gray-400 hover:text-red-500 px-2 py-2 transition-colors"
                title="נתק מגוגל"
                aria-label="נתק מ-Google Calendar"
              >
                נתק
              </button>
            </>
          )}

          <button
            onClick={() => setShowAdvanced(v => !v)}
            className="text-xs text-gray-400 hover:text-gray-600 mr-auto"
            aria-expanded={showAdvanced}
          >
            {showAdvanced ? '▲ הסתר' : '▼ אפשרויות מתקדמות'}
          </button>
        </div>

        {/* Advanced — ICS URL fallback */}
        {showAdvanced && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <label className="text-xs font-medium text-gray-600 block mb-1">
              ICS URL לייבוא בלבד (ללא OAuth)
            </label>
            <input
              value={calendarUrl}
              onChange={e => setCalendarUrl(e.target.value)}
              dir="ltr"
              placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
              className="w-full rounded border border-gray-200 px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-300"
              aria-label="כתובת ICS של יומן Google"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              ייבוא חד-כיווני בלבד. לסנכרון מלא — השתמשו בכפתור "התחבר לגוגל" למעלה.
            </p>
          </div>
        )}

        {/* Auto-sync info */}
        {syncState.isConnected && syncState.autoSyncEnabled && (
          <p className="text-[11px] text-gray-400 mt-2">
            🔄 סנכרון אוטומטי פעיל — כל 5 דקות כשהחלונית פתוחה
          </p>
        )}
      </div>

      {/* ── Bridge / API test ─────────────────────────────────────── */}
      <details className="group">
        <summary className="text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700 list-none flex items-center gap-1">
          <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M7.293 4.707a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L11.586 10 7.293 5.707a1 1 0 010-1.414z" />
          </svg>
          API חיצוני ובדיקת גשר
        </summary>

        <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px]">
          <input
            value={testText}
            onChange={e => setTestText(e.target.value)}
            dir="rtl"
            aria-label="טקסט לבדיקת גשר"
            className="rounded border border-gray-200 px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-300"
          />
          <button
            type="button"
            onClick={sendTest}
            className="rounded bg-cyan-700 text-white text-xs font-semibold px-3 py-2 hover:bg-cyan-800 transition-colors"
          >
            בדיקת חיבור
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-1">
          שליחת POST אל /api/bridge/capture עם text תכניס משימה ל-inbox החכם.
        </p>
      </details>

      {message && (
        <div
          className="text-xs font-medium text-cyan-700 bg-cyan-50 border border-cyan-200 rounded px-3 py-2"
          role="status"
          aria-live="polite"
        >
          {message}
        </div>
      )}
    </section>
  )
}
