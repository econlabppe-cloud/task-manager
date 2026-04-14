function json(status: number, body: unknown) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}

const TOKEN_COOKIE = 'mandy_google_calendar_token'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'
const DEFAULT_ALLOWED_EMAILS = new Set([
  'aa121232343@gmail.com',
  'yehudasaadya@gmail.com',
  'carmelandau@gmail.com',
])
declare const Buffer: any
declare const process: { env: Record<string, string | undefined> }

interface GoogleToken {
  access_token: string
  refresh_token?: string
  expires_in?: number
  created_at?: number
  token_type?: string
}

interface SyncTask {
  id: string
  title: string
  dueDate: string
  notes?: string
  status?: string
  priority?: string
  assignee?: string
  externalId?: string
}

function unfoldIcs(raw: string) {
  return raw.replace(/\r?\n[ \t]/g, '')
}

function parseIcsDate(value: string) {
  if (!value) return ''

  const dateOnly = value.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (dateOnly) return `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}`

  const dateTime = value.match(/^(\d{4})(\d{2})(\d{2})T/)
  if (dateTime) return `${dateTime[1]}-${dateTime[2]}-${dateTime[3]}`

  return ''
}

function unescapeIcs(value: string) {
  return String(value ?? '')
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim()
}

function fieldValue(lines: string[], name: string) {
  const line = lines.find(item => item.startsWith(`${name}:`) || item.startsWith(`${name};`))
  if (!line) return ''
  const index = line.indexOf(':')
  return index >= 0 ? line.slice(index + 1) : ''
}

function parseEvents(rawIcs: string) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const max = new Date(now)
  max.setDate(max.getDate() + 60)

  return unfoldIcs(rawIcs)
    .split('BEGIN:VEVENT')
    .slice(1)
    .map(block => block.split('END:VEVENT')[0].split(/\r?\n/).filter(Boolean))
    .map(lines => {
      const uid = unescapeIcs(fieldValue(lines, 'UID'))
      const summary = unescapeIcs(fieldValue(lines, 'SUMMARY'))
      const description = unescapeIcs(fieldValue(lines, 'DESCRIPTION'))
      const location = unescapeIcs(fieldValue(lines, 'LOCATION'))
      const startRaw = fieldValue(lines, 'DTSTART')
      const endRaw = fieldValue(lines, 'DTEND')
      const dueDate = parseIcsDate(startRaw)

      return {
        id: uid || `${summary}-${startRaw}`,
        title: summary || 'אירוע מהיומן',
        dueDate,
        notes: [
          description,
          location ? `מיקום: ${location}` : '',
          endRaw ? `סיום ביומן: ${endRaw}` : '',
        ].filter(Boolean).join('\n'),
      }
    })
    .filter(event => {
      if (!event.dueDate) return false
      const date = new Date(`${event.dueDate}T00:00:00`)
      return date >= now && date <= max
    })
    .slice(0, 100)
}

function decodeCookieToken(request: Request): GoogleToken | null {
  const cookie = request.headers.get('cookie') ?? ''
  const tokenCookie = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${TOKEN_COOKIE}=`))
  if (!tokenCookie) return null

  try {
    return JSON.parse(Buffer.from(tokenCookie.slice(TOKEN_COOKIE.length + 1), 'base64url').toString('utf8')) as GoogleToken
  } catch {
    return null
  }
}

async function getAccessToken(request: Request): Promise<string | null> {
  const token = decodeCookieToken(request)
  if (!token?.access_token) return null
  const expiresAt = (token.created_at ?? 0) + ((token.expires_in ?? 3600) - 60) * 1000
  if (!token.refresh_token || Date.now() < expiresAt) return token.access_token

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return token.access_token

  const refreshResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: token.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  if (!refreshResponse.ok) return token.access_token
  const refreshed = await refreshResponse.json() as GoogleToken
  return refreshed.access_token || token.access_token
}

function allowedEmailsSet() {
  const raw = process.env.ALLOWED_EMAILS ?? ''
  const emails = raw
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean)
  return new Set([...DEFAULT_ALLOWED_EMAILS, ...emails])
}

async function fetchGoogleEmail(accessToken: string) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) return ''
  const body = await response.json() as { email?: string }
  return String(body.email ?? '').toLowerCase()
}

function googleEventToTask(event: Record<string, any>) {
  const start = event.start?.date || String(event.start?.dateTime ?? '').slice(0, 10)
  const description = String(event.description ?? '')
  return {
    id: String(event.id),
    title: String(event.summary || 'אירוע מהיומן'),
    dueDate: start,
    notes: description.replace(/\n\nנוצר מצ'ק ליסט בית\.[\s\S]*$/m, '').trim(),
    updatedAt: String(event.updated ?? ''),
  }
}

async function fetchGoogleEvents(accessToken: string) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const max = new Date(now)
  max.setDate(max.getDate() + 60)
  const url = new URL(GOOGLE_EVENTS_URL)
  url.searchParams.set('singleEvents', 'true')
  url.searchParams.set('orderBy', 'startTime')
  url.searchParams.set('maxResults', '100')
  url.searchParams.set('timeMin', now.toISOString())
  url.searchParams.set('timeMax', max.toISOString())

  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!response.ok) throw new Error('google_events_fetch_failed')
  const body = await response.json() as { items?: Record<string, any>[] }
  return (body.items ?? []).map(googleEventToTask).filter(event => event.dueDate)
}

function taskToGoogleEvent(task: SyncTask) {
  return {
    summary: task.title,
    description: [
      task.notes ?? '',
      '',
      "נוצר מצ'ק ליסט בית.",
      `סטטוס: ${task.status || 'לא התחיל'}`,
      `עדיפות: ${task.priority || 'בינוני'}`,
      task.assignee ? `אחראי: ${task.assignee}` : '',
      `Mandy Task ID: ${task.id}`,
    ].filter(Boolean).join('\n'),
    start: { date: task.dueDate },
    end: { date: task.dueDate },
    extendedProperties: {
      private: {
        mandyTaskId: task.id,
        mandySource: 'mandy-home',
      },
    },
  }
}

async function exportTasksToGoogle(accessToken: string, tasks: SyncTask[]) {
  let exported = 0
  const exportedTasks: Array<{ taskId: string, eventId: string }> = []
  for (const task of tasks.slice(0, 100)) {
    if (!task.title?.trim() || !task.dueDate) continue
    const eventBody = taskToGoogleEvent(task)
    const eventUrl = task.externalId ? `${GOOGLE_EVENTS_URL}/${encodeURIComponent(task.externalId)}` : GOOGLE_EVENTS_URL
    const response = await fetch(eventUrl, {
      method: task.externalId ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventBody),
    })
    if (response.ok) {
      const body = await response.json().catch(() => ({})) as { id?: string }
      exported += 1
      if (body.id) exportedTasks.push({ taskId: task.id, eventId: body.id })
    }
  }
  return { exported, exportedTasks }
}

async function oauthSync(request: Request) {
  const accessToken = await getAccessToken(request)
  if (!accessToken) {
    return json(401, {
      ok: false,
      error: 'google_calendar_not_connected',
      message: 'Connect Google Calendar first.',
    })
  }

  const allowedEmails = allowedEmailsSet()
  if (allowedEmails.size > 0) {
    const email = await fetchGoogleEmail(accessToken)
    if (!email || !allowedEmails.has(email)) {
      return json(403, {
        ok: false,
        error: 'account_not_allowed',
        message: 'This account is not allowed for this checklist.',
      })
    }
  }

  let tasks: SyncTask[] = []
  if (request.method === 'POST') {
    const body = await request.json().catch(() => ({ tasks: [] })) as { tasks?: SyncTask[] }
    tasks = Array.isArray(body.tasks) ? body.tasks : []
  }

  const exportResult = request.method === 'POST' ? await exportTasksToGoogle(accessToken, tasks) : { exported: 0, exportedTasks: [] }
  const events = await fetchGoogleEvents(accessToken)
  return json(200, {
    ok: true,
    events,
    exported: exportResult.exported,
    exportedTasks: exportResult.exportedTasks,
    syncedAt: new Date().toISOString(),
  })
}

export default {
  async fetch(request: Request) {
    if (request.method === 'POST') return oauthSync(request)

    if (request.method !== 'GET') {
      return json(405, { ok: false, error: 'method_not_allowed' })
    }

    const url = new URL(request.url)
    if (decodeCookieToken(request) && !url.searchParams.get('url')) return oauthSync(request)

    const calendarUrl = url.searchParams.get('url') || process.env.GOOGLE_CALENDAR_ICS_URL
    if (!calendarUrl || !/^https:\/\/.+/i.test(String(calendarUrl))) {
      return json(400, {
        ok: false,
        error: 'missing_calendar_url',
        message: 'Set GOOGLE_CALENDAR_ICS_URL in Vercel, or pass ?url=https://...',
      })
    }

    try {
      const calendarResponse = await fetch(String(calendarUrl), {
        headers: { 'User-Agent': 'MandyHome/1.0' },
      })

      if (!calendarResponse.ok) {
        return json(calendarResponse.status, {
          ok: false,
          error: 'calendar_fetch_failed',
        })
      }

      return json(200, {
        ok: true,
        events: parseEvents(await calendarResponse.text()),
        syncedAt: new Date().toISOString(),
      })
    } catch {
      return json(500, { ok: false, error: 'calendar_sync_failed' })
    }
  },
}
