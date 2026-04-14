import React from 'react'
import { ViewMode } from '../types'

interface Props {
  viewMode: ViewMode
  darkMode: boolean
  onViewChange: (mode: ViewMode) => void
  onDarkModeToggle: () => void
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

export const Header: React.FC<Props> = ({ viewMode, darkMode, onViewChange, onDarkModeToggle }) => {
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

      {/* View switcher */}
      <nav aria-label="מצב תצוגה" className="flex items-center gap-1 bg-transparent">
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
