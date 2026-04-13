function sendJson(response: any, status: number, body: unknown) {
  response.status(status).json(body)
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

export default async function handler(request: any, response: any) {
  response.setHeader('Cache-Control', 'no-store')

  if (request.method !== 'GET') {
    sendJson(response, 405, { ok: false, error: 'method_not_allowed' })
    return
  }

  const calendarUrl = request.query?.url || process.env.GOOGLE_CALENDAR_ICS_URL
  if (!calendarUrl || !/^https:\/\/.+/i.test(String(calendarUrl))) {
    sendJson(response, 400, {
      ok: false,
      error: 'missing_calendar_url',
      message: 'Set GOOGLE_CALENDAR_ICS_URL in Vercel, or pass ?url=https://...',
    })
    return
  }

  try {
    const calendarResponse = await fetch(String(calendarUrl), {
      headers: { 'User-Agent': 'MandyHome/1.0' },
    })

    if (!calendarResponse.ok) {
      sendJson(response, calendarResponse.status, {
        ok: false,
        error: 'calendar_fetch_failed',
      })
      return
    }

    sendJson(response, 200, {
      ok: true,
      events: parseEvents(await calendarResponse.text()),
      syncedAt: new Date().toISOString(),
    })
  } catch {
    sendJson(response, 500, { ok: false, error: 'calendar_sync_failed' })
  }
}
