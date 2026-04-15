import React from 'react'
import { Group, Task } from '../types'
import { downloadIcs, googleCalendarUrl } from '../googleCalendar'

interface Props {
  groups: Group[]
  darkMode?: boolean
  onUpdateTask?: (groupId: string, taskId: string, patch: Partial<Task>) => void
  googleAuthUrl?: string
  googleConnected?: boolean
  googleEmail?: string
  calendarSyncing?: boolean
  onCalendarSync?: () => void
  onGoogleDisconnect?: () => void
}

// Google "G" logo SVG
const GoogleG: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

const STATUS_DOT: Record<string, string> = {
  'לא התחיל': 'bg-gray-400',
  'בתהליך': 'bg-blue-500',
  'תקוע': 'bg-orange-500',
  'הושלם': 'bg-green-500',
}

const PRIORITY_BORDER: Record<string, string> = {
  'נמוך': 'border-gray-200',
  'בינוני': 'border-yellow-300',
  'גבוה': 'border-red-400',
}

interface CalendarTask {
  task: Task
  groupId: string
  groupTitle: string
  groupColor: string
}

interface DayCell {
  date: Date
  dateStr: string
  isToday: boolean
  isShabbat: boolean
  tasks: CalendarTask[]
}

function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function weekTitle(offset: number): string {
  if (offset === 0) return 'השבוע'
  if (offset === 1) return 'שבוע הבא'
  if (offset === -1) return 'שבוע שעבר'
  return `שבוע ${offset > 0 ? '+' : ''}${offset}`
}

export const CalendarView: React.FC<Props> = ({ groups, darkMode, onUpdateTask, googleAuthUrl, googleConnected, googleEmail, calendarSyncing, onCalendarSync, onGoogleDisconnect }) => {
  const [weekOffset, setWeekOffset] = React.useState(0)

  const today = React.useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  const days: DayCell[] = React.useMemo(() => {
    const base = new Date(today)
    base.setDate(base.getDate() - base.getDay() + weekOffset * 7)

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(base)
      date.setDate(base.getDate() + index)
      const dateStr = formatDateStr(date)

      const tasks = groups.flatMap(group =>
        group.tasks
          .filter(task => task.dueDate === dateStr)
          .sort((a, b) => a.order - b.order)
          .map(task => ({
            task,
            groupId: group.id,
            groupTitle: group.title,
            groupColor: group.color,
          }))
      )

      return {
        date,
        dateStr,
        tasks,
        isToday: dateStr === formatDateStr(today),
        isShabbat: date.getDay() === 6,
      }
    })
  }, [today, weekOffset, groups])

  const weekTasks = days.flatMap(day => day.tasks)
  const openWeekTasks = weekTasks.filter(({ task }) => task.status !== 'הושלם')
  const noDueTasks = groups.flatMap(group =>
    group.tasks
      .filter(task => !task.dueDate && task.status !== 'הושלם')
      .map(task => ({ task, groupId: group.id, groupTitle: group.title, groupColor: group.color }))
  )

  const bg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
  const textMain = darkMode ? 'text-gray-100' : 'text-gray-800'
  const textMuted = darkMode ? 'text-gray-500' : 'text-gray-400'
  const dayBg = darkMode ? 'bg-gray-900/40 border-gray-700' : 'bg-gray-50 border-gray-100'
  const todayRing = darkMode ? 'ring-2 ring-cyan-500 bg-cyan-900/20' : 'ring-2 ring-cyan-500 bg-cyan-50/80'
  const shabbatBg = darkMode ? 'bg-amber-900/10 border-amber-800/60' : 'bg-amber-50/60 border-amber-200'

  const exportWeek = () => {
    downloadIcs(
      weekTasks.map(({ task, groupTitle }) => ({ task, groupTitle })),
      `mandy-week-${days[0].dateStr}.ics`
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Navigation bar ────────────────────────────────────────── */}
      <div className={`px-4 py-3 rounded-xl border ${bg}`}>
        {/* Row 1: prev / title / next */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(offset => offset - 1)}
            className={`p-2 rounded-lg transition-colors touch-manipulation ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
            aria-label="שבוע קודם"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="flex-1 text-center min-w-0">
            <h2 className={`font-semibold ${textMain}`}>{weekTitle(weekOffset)}</h2>
            <p className={`text-xs ${textMuted}`}>
              {days[0].date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })} –{' '}
              {days[6].date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Today button — only when not current week */}
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className={`hidden sm:block text-xs px-2.5 py-1.5 rounded-lg transition-colors ${darkMode ? 'text-cyan-400 hover:bg-gray-700' : 'text-cyan-700 hover:bg-cyan-50'}`}
            >
              היום
            </button>
          )}

          {/* Desktop: Google controls + export */}
          <div className="hidden sm:flex items-center gap-2">
            {googleConnected ? (
              <>
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${
                  darkMode ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}>
                  <GoogleG className="w-3.5 h-3.5 shrink-0" />
                  <span className="max-w-[120px] truncate">{googleEmail || 'מחובר'}</span>
                  <button
                    type="button"
                    onClick={onGoogleDisconnect}
                    title="התנתק מגוגל"
                    className={`mr-0.5 rounded p-0.5 transition-colors ${darkMode ? 'text-gray-500 hover:bg-red-900/40 hover:text-red-400' : 'text-gray-400 hover:bg-red-100 hover:text-red-600'}`}
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
              <a
                href={googleAuthUrl}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all shadow-sm hover:shadow ${
                  darkMode ? 'bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <GoogleG className="w-4 h-4 shrink-0" />
                <span>התחבר עם Google</span>
              </a>
            ) : null}
            <button
              type="button"
              onClick={exportWeek}
              disabled={weekTasks.length === 0}
              className={`text-xs font-semibold px-3 py-1.5 rounded border transition-colors ${
                darkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 disabled:text-gray-500' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 disabled:text-gray-300'
              }`}
            >
              ייצוא ליומן
            </button>
          </div>

          <button
            onClick={() => setWeekOffset(offset => offset + 1)}
            className={`p-2 rounded-lg transition-colors touch-manipulation ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
            aria-label="שבוע הבא"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Row 2: mobile-only compact actions */}
        <div className={`flex sm:hidden items-center justify-between gap-2 mt-2 pt-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-2">
            {googleConnected ? (
              <>
                <div className={`flex items-center gap-1.5 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <GoogleG className="w-3.5 h-3.5 shrink-0" />
                  <span className="max-w-[100px] truncate">{googleEmail || 'מחובר'}</span>
                </div>
                <button
                  type="button"
                  onClick={onCalendarSync}
                  disabled={calendarSyncing}
                  title={calendarSyncing ? 'מסנכרן...' : 'סנכרן יומן'}
                  className={`p-2 rounded-lg border transition-colors touch-manipulation ${
                    darkMode ? 'border-emerald-700 text-emerald-400 hover:bg-emerald-900/40 disabled:text-gray-600 disabled:border-gray-700' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 disabled:text-gray-300 disabled:border-gray-200'
                  }`}
                  aria-label="סנכרן יומן"
                >
                  {calendarSyncing ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </button>
              </>
            ) : googleAuthUrl ? (
              <a
                href={googleAuthUrl}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                  darkMode ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <GoogleG className="w-3.5 h-3.5 shrink-0" />
                <span>חבר יומן</span>
              </a>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors touch-manipulation ${darkMode ? 'text-cyan-400 hover:bg-gray-700' : 'text-cyan-700 hover:bg-cyan-50'}`}
              >
                היום
              </button>
            )}
            <button
              type="button"
              onClick={exportWeek}
              disabled={weekTasks.length === 0}
              title="ייצוא ליומן"
              className={`p-2 rounded-lg border transition-colors touch-manipulation ${
                darkMode ? 'border-gray-600 text-gray-400 hover:bg-gray-700 disabled:text-gray-700 disabled:border-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-100 disabled:text-gray-300 disabled:border-gray-100'
              }`}
              aria-label="ייצוא ליומן"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Week summary (desktop hint) ────────────────────────────── */}
      <div className={`rounded-xl border px-4 py-3 ${bg}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={`text-sm font-medium ${textMain}`}>
            {openWeekTasks.length} פתוחות השבוע
            <span className={`text-xs font-normal mr-1 ${textMuted}`}>מתוך {weekTasks.length} עם תאריך</span>
          </p>
          <p className={`hidden sm:block text-xs ${textMuted}`}>
            כפתור "Google" בכרטיסיית המשימה פותח יצירת אירוע ביומן.
          </p>
        </div>
      </div>

      {/* ── 7-day grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-7 gap-2">
        {days.map(day => (
          <div
            key={day.dateStr}
            className={`rounded-xl border p-2 min-h-[100px] sm:min-h-[180px] flex flex-col gap-2 ${
              day.isToday ? todayRing : day.isShabbat ? shabbatBg : dayBg
            }`}
          >
            <div className="flex items-center justify-between gap-1 border-b border-black/5 pb-2">
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold leading-tight ${day.isToday ? 'text-cyan-600' : day.isShabbat ? 'text-amber-600' : textMain}`}>
                  {day.date.getDate()}
                </span>
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {DAYS_HE[day.date.getDay()]}
                </span>
              </div>
              {day.tasks.length > 0 && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                  {day.tasks.length}
                </span>
              )}
            </div>

            {day.tasks.length === 0 ? (
              <div className={`flex-1 flex items-center justify-center text-xs ${textMuted}`}>
                {day.isShabbat ? 'שבת שקטה' : 'פנוי'}
              </div>
            ) : (
              <div className="space-y-2 flex-1">
                {day.tasks.map(item => (
                  <article
                    key={item.task.id}
                    className={`text-xs leading-tight px-2 py-2 rounded border-r-2 ${PRIORITY_BORDER[item.task.priority]} ${
                      darkMode ? 'bg-gray-800/80 text-gray-200 border-gray-700' : 'bg-white text-gray-700 shadow-sm border-gray-100'
                    } ${item.task.status === 'הושלם' ? 'opacity-55' : ''}`}
                  >
                    <div className="flex items-start gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${STATUS_DOT[item.task.status]}`} />
                      <div className="min-w-0 flex-1">
                        <div className={`font-semibold ${item.task.status === 'הושלם' ? 'line-through' : ''}`}>
                          {item.task.title}
                        </div>
                        <div className={`text-[11px] mt-1 ${textMuted}`}>
                          {item.groupTitle} · {item.task.assignee || 'לא שויך'} · {item.task.priority}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      <button
                        type="button"
                        onClick={() => onUpdateTask?.(item.groupId, item.task.id, { status: item.task.status === 'הושלם' ? 'לא התחיל' : 'הושלם' })}
                        className={`rounded px-2 py-1 text-[11px] font-semibold ${
                          item.task.status === 'הושלם'
                            ? darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {item.task.status === 'הושלם' ? 'פתח מחדש' : 'הושלם'}
                      </button>
                      <a
                        href={googleCalendarUrl({ task: item.task, groupTitle: item.groupTitle })}
                        target="_blank"
                        rel="noreferrer"
                        className={`rounded px-2 py-1 text-[11px] font-semibold ${darkMode ? 'bg-gray-700 text-cyan-300' : 'bg-cyan-50 text-cyan-700'}`}
                      >
                        Google
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {noDueTasks.length > 0 && (
        <div className={`rounded-xl border p-4 ${bg}`}>
          <h3 className={`text-sm font-semibold mb-3 ${textMain}`}>ללא תאריך יעד ({noDueTasks.length})</h3>
          <div className="flex flex-wrap gap-2">
            {noDueTasks.slice(0, 14).map(({ task, groupTitle }) => (
              <div
                key={task.id}
                className={`text-xs px-2.5 py-1.5 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
              >
                {task.title}
                <span className={`mr-1.5 text-[10px] ${textMuted}`}>({groupTitle})</span>
              </div>
            ))}
            {noDueTasks.length > 14 && (
              <div className={`text-xs px-2.5 py-1.5 ${textMuted}`}>+{noDueTasks.length - 14} עוד</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
