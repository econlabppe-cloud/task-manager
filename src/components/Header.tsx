import React from 'react'
import { ViewMode } from '../types'

interface Props {
  viewMode: ViewMode
  darkMode: boolean
  onViewChange: (mode: ViewMode) => void
  onDarkModeToggle: () => void
  googleAuthUrl?: string
  googleConnected?: boolean
  googleEmail?: string
  calendarSyncing?: boolean
  onCalendarSync?: () => void
  onGoogleDisconnect?: () => void
}

const VIEWS: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
  {
    mode: 'board',
    label: 'לוח',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  },
  {
    mode: 'calendar',
    label: 'שבוע',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    mode: 'analytics',
    label: 'ניתוח',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    mode: 'shopping',
    label: 'קניות',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
]

// Google "G" logo SVG
const GoogleG: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

export const Header: React.FC<Props> = ({ viewMode, darkMode, onViewChange, onDarkModeToggle, googleAuthUrl, googleConnected, googleEmail, calendarSyncing, onCalendarSync, onGoogleDisconnect }) => {
  const headerBg = darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
  const logoText = darkMode ? 'text-gray-100' : 'text-gray-900'
  const mutedText = darkMode ? 'text-gray-500' : 'text-gray-400'

  return (
    <header className={`${headerBg} border-b h-14 flex items-center px-4 gap-3 shrink-0`}>
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <span className={`font-bold text-lg ${logoText} hidden sm:block`}>מאנדי בית</span>
      </div>

      <div className={`w-px h-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} mx-1 hidden sm:block`} />

      {/* View switcher — hidden on mobile (bottom nav handles it) */}
      <nav aria-label="מצב תצוגה" className="hidden sm:flex items-center gap-1 bg-transparent">
        {VIEWS.map(({ mode, label, icon }) => {
          const isActive = viewMode === mode
          return (
            <button
              key={mode}
              onClick={() => onViewChange(mode)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={label}
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2.5 rounded-xl transition-colors touch-manipulation ${
                isActive
                  ? darkMode
                    ? 'bg-indigo-800 text-indigo-200'
                    : 'bg-indigo-50 text-indigo-700'
                  : darkMode
                    ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <span aria-hidden="true">{icon}</span>
              <span className="hidden sm:block">{label}</span>
            </button>
          )
        })}
      </nav>

      <div className="flex-1" />

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Google Calendar — desktop only */}
        <div className="hidden sm:flex items-center gap-2">
          {googleConnected ? (
            /* Connected state: email chip + sync button */
            <>
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${
                darkMode ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}>
                <GoogleG className="w-3.5 h-3.5 shrink-0" />
                <span className="max-w-[140px] truncate">{googleEmail || 'מחובר'}</span>
                <button
                  type="button"
                  onClick={onGoogleDisconnect}
                  title="התנתק מגוגל"
                  className={`mr-0.5 rounded hover:bg-red-100 hover:text-red-600 p-0.5 transition-colors ${darkMode ? 'text-gray-500 hover:bg-red-900/40 hover:text-red-400' : 'text-gray-400'}`}
                  aria-label="התנתק מגוגל"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                onClick={onCalendarSync}
                disabled={calendarSyncing}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  darkMode
                    ? 'bg-emerald-900/60 border-emerald-700 text-emerald-300 hover:bg-emerald-800/60 disabled:bg-gray-700 disabled:border-gray-600 disabled:text-gray-500'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400'
                }`}
              >
                {calendarSyncing ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                {calendarSyncing ? 'מסנכרן...' : 'סנכרן'}
              </button>
            </>
          ) : googleAuthUrl ? (
            /* Not connected: Google Sign-In button */
            <a
              href={googleAuthUrl}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all shadow-sm hover:shadow ${
                darkMode
                  ? 'bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <GoogleG className="w-4 h-4 shrink-0" />
              <span>התחבר עם Google</span>
            </a>
          ) : null}
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={onDarkModeToggle}
          aria-label={darkMode ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title={darkMode ? 'מצב בהיר' : 'מצב כהה'}
        >
          {darkMode ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Auto-save indicator */}
        <div className={`flex items-center gap-1.5 text-xs ${mutedText} hidden sm:flex`}>
          <span>נשמר</span>
          <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
    </header>
  )
}
