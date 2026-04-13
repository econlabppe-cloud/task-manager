import React from 'react'
import { ViewMode } from '../types'

interface Props {
  viewMode: ViewMode
  toolsOpen: boolean
  onViewChange: (mode: ViewMode) => void
  onToolsToggle: () => void
  darkMode?: boolean
}

const navItems: Array<{ mode: ViewMode; label: string; path: string }> = [
  {
    mode: 'board',
    label: 'לוח',
    path: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
  },
  {
    mode: 'calendar',
    label: 'שבוע',
    path: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    mode: 'analytics',
    label: 'ניתוח',
    path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
]

export const MobileBottomNav: React.FC<Props> = ({ viewMode, toolsOpen, onViewChange, onToolsToggle, darkMode }) => {
  return (
    <nav className={`sm:hidden fixed bottom-0 inset-x-0 z-40 border-t px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 ${
      darkMode ? 'bg-gray-950/95 border-gray-800' : 'bg-white/95 border-gray-200'
    }`}>
      <div className="grid grid-cols-4 gap-1">
        {navItems.map(item => {
          const active = viewMode === item.mode && !toolsOpen
          return (
            <button
              key={item.mode}
              type="button"
              onClick={() => onViewChange(item.mode)}
              className={`flex flex-col items-center gap-1 rounded px-2 py-1.5 text-[11px] font-semibold ${
                active
                  ? darkMode ? 'bg-cyan-900/40 text-cyan-200' : 'bg-cyan-50 text-cyan-800'
                  : darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.path} />
              </svg>
              {item.label}
            </button>
          )
        })}

        <button
          type="button"
          onClick={onToolsToggle}
          className={`flex flex-col items-center gap-1 rounded px-2 py-1.5 text-[11px] font-semibold ${
            toolsOpen
              ? darkMode ? 'bg-emerald-900/40 text-emerald-200' : 'bg-emerald-50 text-emerald-800'
              : darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
          </svg>
          כלים
        </button>
      </div>
    </nav>
  )
}
