const TOKEN_COOKIE = 'mandy_google_calendar_token'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'
const SCOPES = ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/calendar.events']
const DEFAULT_ALLOWED_EMAILS = new Set([
  'aa121232343@gmail.com',
  'yehudasadya@gmail.com',
  'carmelandau@gmail.com',
])
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

function missingConfig() {
  const missing = [
    !process.env.GOOGLE_CLIENT_ID ? 'GOOGLE_CLIENT_ID' : '',
    !process.env.GOOGLE_CLIENT_SECRET ? 'GOOGLE_CLIENT_SECRET' : '',
    !process.env.GOOGLE_REDIRECT_URI ? 'GOOGLE_REDIRECT_URI' : '',
  ].filter(Boolean)
  return missing
}

function allowedEmailsSet(): Set<string> {
  const raw = process.env.ALLOWED_EMAILS ?? ''
  const emails = raw
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean)
  return new Set([...DEFAULT_ALLOWED_EMAILS, ...emails])
}

function getTokenCookie(request: Request) {
  const cookie = request.headers.get('cookie') ?? ''
  return cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${TOKEN_COOKIE}=`))
}

function decodeCookieToken(request: Request) {
  const tokenCookie = getTokenCookie(request)
  if (!tokenCookie) return null
  try {
    return JSON.parse(Buffer.from(tokenCookie.slice(TOKEN_COOKIE.length + 1), 'base64url').toString('utf8')) as {
      access_token?: string
      refresh_token?: string
      expires_in?: number
      created_at?: number
    }
  } catch {
    return null
  }
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

async function refreshAccessTokenIfNeeded(token: { access_token?: string; refresh_token?: string; expires_in?: number; created_at?: number }) {
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
  const refreshed = await refreshResponse.json() as { access_token?: string }
  return refreshed.access_token || token.access_token
}

async function fetchGoogleEmail(accessToken: string) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) return ''
  const body = await response.json() as { email?: string }
  return String(body.email ?? '').toLowerCase()
}

async function accessStatus(request: Request) {
  const authUrl = buildAuthUrl(request)
  const missing = missingConfig()
  const configured = missing.length === 0

  const allowedEmails = allowedEmailsSet()
  const accessGateEnabled = allowedEmails.size > 0
  const token = decodeCookieToken(request)
  if (!token?.access_token) {
    return json(200, {
      ok: true,
      connected: false,
      configured,
      allowed: !accessGateEnabled,
      accessGateEnabled,
      missingConfig: missing,
      authUrl,
      message: configured ? undefined : 'google_oauth_not_configured',
    })
  }

  const accessToken = await refreshAccessTokenIfNeeded(token)
  if (!accessToken) {
    return json(200, {
      ok: true,
      connected: false,
      configured,
      allowed: !accessGateEnabled,
      accessGateEnabled,
      missingConfig: missing,
      authUrl,
      message: configured ? undefined : 'google_oauth_not_configured',
    })
  }

  const email = await fetchGoogleEmail(accessToken)
  const allowed = !accessGateEnabled || Boolean(email && allowedEmails.has(email))

  return json(200, {
    ok: true,
    connected: true,
    configured,
    allowed,
    accessGateEnabled,
    email,
    missingConfig: missing,
    authUrl,
    message: !configured ? 'google_oauth_not_configured' : allowed ? undefined : 'account_not_allowed',
  })
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

  const accessToken = String(token.access_token ?? '')
  const email = accessToken ? await fetchGoogleEmail(accessToken) : ''
  const allowedEmails = allowedEmailsSet()
  const accessGateEnabled = allowedEmails.size > 0
  const allowed = !accessGateEnabled || Boolean(email && allowedEmails.has(email))
  const missing = missingConfig()
  const configured = missing.length === 0
  const location = allowed
    ? `${getOrigin(request)}/?googleCalendar=connected`
    : `${getOrigin(request)}/?googleCalendar=not-allowed`

  return new Response(null, {
    status: 302,
    headers: {
      'Set-Cookie': cookie,
      Location: location,
      'Cache-Control': 'no-store',
      'X-Google-OAuth-Configured': configured ? '1' : '0',
    },
  })
}

export default {
  async fetch(request: Request) {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    if (code) return exchangeCode(request, code)
    return accessStatus(request)
  },
}
