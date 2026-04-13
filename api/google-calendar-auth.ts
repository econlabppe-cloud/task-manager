const TOKEN_COOKIE = 'mandy_google_calendar_token'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const SCOPES = ['https://www.googleapis.com/auth/calendar.events']
declare const Buffer: any
declare const process: { env: Record<string, string | undefined> }

function json(status: number, body: unknown, headers: HeadersInit = {}) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...headers,
    },
  })
}

function getOrigin(request: Request) {
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}

function getRedirectUri(request: Request) {
  return process.env.GOOGLE_REDIRECT_URI || `${getOrigin(request)}/api/google-calendar-auth?callback=1`
}

function getTokenCookie(request: Request) {
  const cookie = request.headers.get('cookie') ?? ''
  return cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${TOKEN_COOKIE}=`))
}

function buildAuthUrl(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) return ''

  const url = new URL(GOOGLE_AUTH_URL)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', getRedirectUri(request))
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', SCOPES.join(' '))
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')
  return url.toString()
}

function encodeCookie(value: unknown) {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
}

async function exchangeCode(request: Request, code: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return json(500, { ok: false, error: 'missing_google_oauth_env' })
  }

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: getRedirectUri(request),
    grant_type: 'authorization_code',
  })

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!tokenResponse.ok) {
    return json(tokenResponse.status, { ok: false, error: 'google_token_exchange_failed' })
  }

  const token = await tokenResponse.json()
  const cookie = [
    `${TOKEN_COOKIE}=${encodeCookie({ ...token, created_at: Date.now() })}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Max-Age=2592000',
  ].join('; ')

  return new Response(null, {
    status: 302,
    headers: {
      'Set-Cookie': cookie,
      Location: `${getOrigin(request)}/?googleCalendar=connected`,
      'Cache-Control': 'no-store',
    },
  })
}

export default {
  async fetch(request: Request) {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    if (code) return exchangeCode(request, code)

    const authUrl = buildAuthUrl(request)
    if (!authUrl) return json(500, { ok: false, connected: false, error: 'missing_google_client_id' })

    return json(200, {
      ok: true,
      connected: Boolean(getTokenCookie(request)),
      authUrl,
    })
  },
}
