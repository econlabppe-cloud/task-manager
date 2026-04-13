import React from 'react'
import { BridgeStatus, captureExternalTask } from '../apiBridge'
import { fetchGoogleCalendarAuthStatus } from '../googleCalendarSync'

interface Props {
  bridgeStatus: BridgeStatus
  onGoogleCalendarSync: (calendarUrl?: string) => Promise<number>
}

const statusText: Record<BridgeStatus, string> = {
  checking: 'בודק חיבור',
  connected: 'מחובר',
  offline: 'לא מחובר',
}

const statusClass: Record<BridgeStatus, string> = {
  checking: 'bg-amber-50 text-amber-700 border-amber-200',
  connected: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  offline: 'bg-gray-50 text-gray-500 border-gray-200',
}

export const IntegrationHub: React.FC<Props> = ({ bridgeStatus, onGoogleCalendarSync }) => {
  const [testText, setTestText] = React.useState('מחר לקנות חלב לילדים, שנינו, בינוני')
  const [calendarUrl, setCalendarUrl] = React.useState('')
  const [syncingCalendar, setSyncingCalendar] = React.useState(false)
  const [message, setMessage] = React.useState('')
  const [googleConnected, setGoogleConnected] = React.useState(false)
  const [googleAuthUrl, setGoogleAuthUrl] = React.useState('')

  React.useEffect(() => {
    void fetchGoogleCalendarAuthStatus()
      .then(status => {
        setGoogleConnected(status.connected)
        setGoogleAuthUrl(status.authUrl ?? '')
      })
      .catch(() => {
        setGoogleConnected(false)
      })
  }, [])

  React.useEffect(() => {
    if (!message) return
    const timeoutId = window.setTimeout(() => setMessage(''), 3000)
    return () => window.clearTimeout(timeoutId)
  }, [message])

  const sendTest = async () => {
    try {
      await captureExternalTask(testText, 'shortcut')
      setMessage('נשלח לגשר. מאנדי ימשוך את זה כמשימה חכמה בעוד רגע.')
    } catch {
      setMessage('הגשר לא מחובר כרגע. הפעילו npm run bridge בחלון נפרד.')
    }
  }

  const syncCalendar = async () => {
    setSyncingCalendar(true)
    try {
      const added = await onGoogleCalendarSync(calendarUrl)
      setMessage(added > 0 ? `סונכרן דו־כיוונית. יובאו ${added} אירועים חדשים מיומן Google.` : 'סונכרן דו־כיוונית, לא נמצאו משימות חדשות לייבוא.')
    } catch {
      setMessage('לא הצלחתי לסנכרן את Google Calendar. התחברו לגוגל או הדביקו קישור ICS פרטי לייבוא בלבד.')
    } finally {
      setSyncingCalendar(false)
    }
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-gray-900">חיבורים ואפליקציה</h2>
          <p className="text-xs text-gray-500 mt-1">
            מאנדי יכול לקבל משימות מבחוץ: קיצור דרך, n8n, ווב־הוק, או בוט ווצאפ דרך Cloud API.
          </p>
        </div>
        <span className={`text-xs font-semibold rounded border px-3 py-1.5 ${statusClass[bridgeStatus]}`}>
          {statusText[bridgeStatus]}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 mt-4">
        <div className="border border-gray-200 rounded p-3 bg-gray-50">
          <div className="text-xs font-bold text-gray-700">אפליקציה להתקנה</div>
          <p className="text-xs text-gray-500 leading-5 mt-2">
            במסך הבית של הדפדפן אפשר להתקין את מאנדי כאפליקציה. היא תיפתח במסך נקי ותמשיך לשמור נתונים מקומית.
          </p>
        </div>

        <div className="border border-gray-200 rounded p-3 bg-gray-50">
          <div className="text-xs font-bold text-gray-700">API למשימות</div>
          <p className="text-xs text-gray-500 leading-5 mt-2">
            שליחת POST אל /api/bridge/capture עם text תכניס משימה ל־inbox החכם.
          </p>
        </div>

        <div className="border border-gray-200 rounded p-3 bg-gray-50">
          <div className="text-xs font-bold text-gray-700">ווצאפ</div>
          <p className="text-xs text-gray-500 leading-5 mt-2">
            ה־Webhook מוכן ב־/webhooks/whatsapp. צריך טוקן Meta, מספר Business ו־URL ציבורי ב־HTTPS.
          </p>
        </div>

        <div className="border border-gray-200 rounded p-3 bg-gray-50">
          <div className="text-xs font-bold text-gray-700">Google Calendar</div>
          <p className="text-xs text-gray-500 leading-5 mt-2">
            בתצוגת שבוע אפשר לפתוח משימה כאירוע Google, לייצא ICS, וגם לייבא אירועים מהיומן כמשימות.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_120px]">
        <input
          value={testText}
          onChange={event => setTestText(event.target.value)}
          dir="rtl"
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

      <div className="mt-4 border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
          <div className="text-xs font-bold text-gray-700">סנכרון דו־כיווני עם Google Calendar</div>
          <span className={`text-[11px] font-semibold rounded border px-2 py-1 ${googleConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            {googleConnected ? 'מחובר לגוגל' : 'צריך התחברות'}
          </span>
        </div>
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_130px_150px]">
          <input
            value={calendarUrl}
            onChange={event => setCalendarUrl(event.target.value)}
            dir="ltr"
            placeholder="אופציונלי: Private ICS URL לייבוא בלבד. לסנכרון דו־כיווני השאירו ריק והתחברו לגוגל"
            className="rounded border border-gray-200 px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-300"
          />
          <a
            href={googleAuthUrl || undefined}
            className={`rounded text-center text-xs font-semibold px-3 py-2 transition-colors ${googleAuthUrl ? 'bg-sky-700 text-white hover:bg-sky-800' : 'bg-gray-200 text-gray-400 pointer-events-none'}`}
          >
            התחברות לגוגל
          </a>
          <button
            type="button"
            onClick={syncCalendar}
            disabled={syncingCalendar}
            className="rounded bg-emerald-700 text-white text-xs font-semibold px-3 py-2 hover:bg-emerald-800 disabled:bg-gray-300 transition-colors"
          >
            {syncingCalendar ? 'מסנכרן...' : 'סנכרן דו־כיווני'}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          התחברות גוגל מייבאת אירועים למאנדי ומייצאת משימות מתוארכות ליומן. קישור ICS נשאר כגיבוי לייבוא חד־כיווני בלבד.
        </p>
      </div>

      {message && (
        <div className="mt-3 text-xs font-medium text-cyan-700 bg-cyan-50 border border-cyan-200 rounded px-3 py-2">
          {message}
        </div>
      )}
    </section>
  )
}
