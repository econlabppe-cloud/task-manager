import React from 'react'
import type {
  BoardState, Tag, Task,
  Status, Priority, Assignee, NewTaskDefaults, ViewMode,
  RecurringTaskInput,
} from './types'
import { loadState, saveState } from './store'
import { createRecurringTask, materializeRecurringTasks } from './recurringTasks'
import { requestNotificationPermission, checkDueTasks } from './notifications'
import { useBridgeSync } from './hooks/useBridgeSync'
import { useGoogleCalendarSync } from './hooks/useGoogleCalendarSync'
import { useConfetti, ConfettiOverlay } from './hooks/useConfetti'
import { useStreak } from './hooks/useStreak'
import { GROUP_COLORS } from './constants'
import { fetchGoogleCalendarAuthStatus } from './googleCalendarSync'
import { Header } from './components/Header'
import { StatsBar } from './components/StatsBar'
import { FilterBar } from './components/FilterBar'
import { BoardGroup } from './components/BoardGroup'
import { SmartCapture } from './components/SmartCapture'
import { SmartFocus } from './components/SmartFocus'
import { RecurringRoutines } from './components/RecurringRoutines'
import { IntegrationHub } from './components/IntegrationHub'
import { CalendarView } from './components/CalendarView'
import { AnalyticsPanel } from './components/AnalyticsPanel'
import { ExportImport } from './components/ExportImport'
import { MobileBottomNav } from './components/MobileBottomNav'
import { AIFocusSuggest } from './components/AIFocusSuggest'

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export default function App() {
  const [state, setState] = React.useState<BoardState>(() => loadState())
  const [showTools, setShowTools] = React.useState(false)
  const [storageWarning, setStorageWarning] = React.useState(false)
  const [googleAuthUrl, setGoogleAuthUrl] = React.useState('')
  const [accessGateEnabled, setAccessGateEnabled] = React.useState(false)
  const [allowedAccess, setAllowedAccess] = React.useState(true)
  const [authChecked, setAuthChecked] = React.useState(false)
  const [signedEmail, setSignedEmail] = React.useState('')
  const [calendarQuickMessage, setCalendarQuickMessage] = React.useState('')
  const [quickCalendarSyncing, setQuickCalendarSyncing] = React.useState(false)

  const bridgeStatus = useBridgeSync(setState)
  const syncGoogleCalendar = useGoogleCalendarSync(setState)

  const [confettiParticles, fireConfetti] = useConfetti()
  const handleTaskComplete = React.useCallback((_taskId: string, originX: number) => {
    fireConfetti(originX)
  }, [fireConfetti])

  const todayStr = new Date().toISOString().slice(0, 10)
  const completedToday = React.useMemo(
    () => state.groups.flatMap(g => g.tasks).filter(t =>
      t.status === 'הושלם' && t.completedAt?.startsWith(todayStr),
    ).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.groups, todayStr],
  )
  const streakData = useStreak(completedToday)

  React.useEffect(() => {
    if (state.darkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [state.darkMode])

  React.useEffect(() => { saveState(state) }, [state])

  React.useEffect(() => {
    const handler = () => setStorageWarning(true)
    window.addEventListener('mandy:storage-quota-exceeded', handler)
    return () => window.removeEventListener('mandy:storage-quota-exceeded', handler)
  }, [])

  React.useEffect(() => {
    requestNotificationPermission()
    const t = setTimeout(() => checkDueTasks(state.groups), 2500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    void fetchGoogleCalendarAuthStatus()
      .then(status => {
        setGoogleAuthUrl(status.authUrl ?? '')
        setAccessGateEnabled(Boolean(status.accessGateEnabled))
        setAllowedAccess(status.allowed !== false)
        setSignedEmail(status.email ?? '')
        setAuthChecked(true)
      })
      .catch(() => {
        setGoogleAuthUrl('')
        setAuthChecked(true)
      })
  }, [])

  React.useEffect(() => {
    if (!calendarQuickMessage) return
    const timeoutId = window.setTimeout(() => setCalendarQuickMessage(''), 3500)
    return () => window.clearTimeout(timeoutId)
  }, [calendarQuickMessage])

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowTools(true)
        setTimeout(() => document.querySelector<HTMLTextAreaElement>('[data-smart-capture]')?.focus(), 100)
      }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  React.useEffect(() => {
    void syncGoogleCalendar().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleCollapse = React.useCallback((groupId: string) =>
    setState(s => ({ ...s, groups: s.groups.map(g => g.id === groupId ? { ...g, collapsed: !g.collapsed } : g) })),
  [])

  const addGroup = React.useCallback(() => {
    setState(s => {
      const usedColors = new Set(s.groups.map(g => g.color))
      const color = GROUP_COLORS.find(c => !usedColors.has(c)) ?? GROUP_COLORS[s.groups.length % GROUP_COLORS.length]
      return { ...s, groups: [...s.groups, { id: 'group-' + genId(), title: 'קבוצה חדשה', color, collapsed: false, order: s.groups.length, tasks: [] }] }
    })
  }, [])

  const deleteGroup = React.useCallback((groupId: string) =>
    setState(s => ({ ...s, groups: s.groups.filter(g => g.id !== groupId) })),
  [])

  const renameGroup = React.useCallback((groupId: string, title: string) =>
    setState(s => ({ ...s, groups: s.groups.map(g => g.id === groupId ? { ...g, title } : g) })),
  [])

  const addTask = React.useCallback((groupId: string, title: string, defaults: NewTaskDefaults = {}) => {
    setState(s => ({
      ...s,
      groups: s.groups.map(g => {
        if (g.id !== groupId) return g
        const newTask: Task = {
          id: 'task-' + genId(), title,
          assignee: '' as Assignee, status: 'לא התחיל' as Status,
          priority: 'בינוני' as Priority, dueDate: '', notes: '',
          recurring: 'none', ...defaults,
          subtasks: [], tags: [], order: g.tasks.length,
          createdAt: new Date().toISOString(),
        }
        return { ...g, tasks: [...g.tasks, newTask] }
      }),
    }))
  }, [])

  const updateTask = React.useCallback((groupId: string, taskId: string, patch: Partial<Task>) =>
    setState(s => ({
      ...s,
      groups: s.groups.map(g =>
        g.id === groupId ? { ...g, tasks: g.tasks.map(t => t.id === taskId ? { ...t, ...patch } : t) } : g,
      ),
    })),
  [])

  const deleteTask = React.useCallback((groupId: string, taskId: string) =>
    setState(s => ({
      ...s,
      groups: s.groups.map(g =>
        g.id === groupId ? { ...g, tasks: g.tasks.filter(t => t.id !== taskId) } : g,
      ),
    })),
  [])

  const reorderTasks = React.useCallback((groupId: string, tasks: Task[]) =>
    setState(s => ({ ...s, groups: s.groups.map(g => g.id === groupId ? { ...g, tasks } : g) })),
  [])

  const createTag = React.useCallback((tag: Tag) =>
    setState(s => ({ ...s, tags: [...s.tags, tag] })),
  [])

  const setViewMode = React.useCallback((viewMode: ViewMode) => setState(s => ({ ...s, viewMode })), [])
  const toggleDarkMode = React.useCallback(() => setState(s => ({ ...s, darkMode: !s.darkMode })), [])

  const addRecurringTask = React.useCallback((input: RecurringTaskInput) =>
    setState(s => ({ ...s, recurringTasks: [...s.recurringTasks, createRecurringTask(input)] })),
  [])

  const updateRecurringTask = React.useCallback((templateId: string, patch: Partial<RecurringTaskInput>) =>
    setState(s => ({ ...s, recurringTasks: s.recurringTasks.map(t => t.id === templateId ? { ...t, ...patch } : t) })),
  [])

  const deleteRecurringTask = React.useCallback((templateId: string) =>
    setState(s => ({ ...s, recurringTasks: s.recurringTasks.filter(t => t.id !== templateId) })),
  [])

  const generateRecurringWeek = React.useCallback((): number => {
    let added = 0
    setState(s => {
      const result = materializeRecurringTasks(s, { daysAhead: 7 })
      added = result.addedCount
      return result.state
    })
    return added
  }, [])

  const quickSyncGoogleCalendar = React.useCallback(async () => {
    setQuickCalendarSyncing(true)
    try {
      const added = await syncGoogleCalendar()
      setCalendarQuickMessage(added > 0 ? `יובאו ${added} אירועים חדשים מהיומן.` : 'היומן סונכרן.')
    } catch {
      setCalendarQuickMessage('צריך לחבר יומן Google לפני סנכרון דו־כיווני.')
    } finally {
      setQuickCalendarSyncing(false)
    }
  }, [syncGoogleCalendar])

  const handleImport = React.useCallback((imported: BoardState) =>
    setState(s => ({ ...imported, darkMode: s.darkMode, viewMode: s.viewMode })),
  [])

  const dm = state.darkMode
  const pageBg = dm ? 'bg-gray-950' : 'bg-gray-50'
  const mainBg = dm ? 'bg-gray-900' : 'bg-gray-50'
  const toolsBg = dm ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'

  if (accessGateEnabled && authChecked && !allowedAccess) {
    return (
      <div className={`min-h-screen ${pageBg} flex items-center justify-center p-4`} dir="rtl">
        <div className={`w-full max-w-md rounded-xl border p-6 ${dm ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'}`}>
          <h1 className="text-lg font-bold mb-2">גישה פרטית לצ'ק ליסט בית</h1>
          <p className={`${dm ? 'text-gray-300' : 'text-gray-600'} text-sm leading-6`}>
            הגישה זמינה רק לחשבונות Google שאושרו מראש.
            {signedEmail ? ` החשבון הנוכחי: ${signedEmail}` : ''}
          </p>
          <a
            href={googleAuthUrl || undefined}
            className={`mt-4 inline-flex items-center justify-center rounded px-4 py-2 text-sm font-semibold transition-colors ${googleAuthUrl ? 'bg-sky-700 text-white hover:bg-sky-800' : 'bg-gray-200 text-gray-400 pointer-events-none'}`}
          >
            התחברות עם גוגל
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${pageBg}`} dir="rtl">
      <Header
        viewMode={state.viewMode}
        darkMode={dm}
        onViewChange={setViewMode}
        onDarkModeToggle={toggleDarkMode}
        googleAuthUrl={googleAuthUrl}
        calendarSyncing={quickCalendarSyncing}
        onCalendarSync={quickSyncGoogleCalendar}
      />

      {storageWarning && (
        <div role="alert" className="bg-amber-50 border-b border-amber-200 text-amber-800 text-xs px-4 py-2 flex items-center justify-between">
          <span>האחסון המקומי מלא, הנתונים לא נשמרו. מחק משימות ישנות או ייצא גיבוי.</span>
          <button onClick={() => setStorageWarning(false)} className="text-amber-600 hover:text-amber-800 font-bold ml-3" aria-label="סגור התראה">x</button>
        </div>
      )}

      <StatsBar groups={state.groups} darkMode={dm} streak={streakData.currentStreak} completedToday={completedToday} />
      <FilterBar
        filterAssignee={state.filterAssignee}
        filterStatus={state.filterStatus}
        filterTag={state.filterTag ?? ''}
        searchQuery={state.searchQuery ?? ''}
        allTags={state.tags}
        darkMode={dm}
        onAssigneeChange={val => setState(s => ({ ...s, filterAssignee: val }))}
        onStatusChange={val => setState(s => ({ ...s, filterStatus: val }))}
        onTagChange={tagId => setState(s => ({ ...s, filterTag: tagId }))}
        onSearchChange={q => setState(s => ({ ...s, searchQuery: q }))}
        onAddGroup={addGroup}
      />

      <div className={`border-b ${toolsBg}`}>
        <div className="max-w-6xl mx-auto px-4 py-2">
          <button
            onClick={() => setShowTools(t => !t)}
            aria-expanded={showTools}
            aria-controls="tools-panel"
            className={`flex items-center gap-1.5 text-xs font-medium ${dm ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
          >
            <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${showTools ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>כלים • Ctrl+K לאיסוף מהיר</span>
          </button>

          {showTools && (
            <div id="tools-panel" className="mt-3 space-y-3 pb-3">
              <SmartCapture groups={state.groups} onAddTask={addTask} />
              <AIFocusSuggest groups={state.groups} darkMode={dm} />
              <SmartFocus groups={state.groups} onUpdateTask={updateTask} />
              <RecurringRoutines
                groups={state.groups}
                recurringTasks={state.recurringTasks}
                onAdd={addRecurringTask}
                onUpdate={updateRecurringTask}
                onDelete={deleteRecurringTask}
                onGenerateWeek={generateRecurringWeek}
              />
              <div className="grid sm:grid-cols-2 gap-3">
                <ExportImport state={state} onImport={handleImport} darkMode={dm} />
                <IntegrationHub bridgeStatus={bridgeStatus} onGoogleCalendarSync={syncGoogleCalendar} />
              </div>
            </div>
          )}
        </div>
      </div>

      <main className={`flex-1 overflow-y-auto ${mainBg} pb-20 sm:pb-0`}>
        <div className="max-w-6xl mx-auto px-4 py-5">
          {state.viewMode === 'board' && (
            state.groups.length === 0 ? (
              <div className="text-center py-20">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${dm ? 'bg-indigo-900/40' : 'bg-indigo-100'}`}>
                  <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </div>
                <h2 className={`text-lg font-semibold mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>הלוח ריק</h2>
                <p className={`text-sm mb-4 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>לחצו על "קבוצה" כדי להתחיל</p>
              </div>
            ) : (
              <div role="list" aria-label="קבוצות משימות">
                {state.groups.slice().sort((a, b) => a.order - b.order).map(group => (
                  <BoardGroup
                    key={group.id}
                    group={group}
                    filterAssignee={state.filterAssignee}
                    filterStatus={state.filterStatus}
                    filterTag={state.filterTag ?? ''}
                    searchQuery={state.searchQuery ?? ''}
                    allTags={state.tags}
                    darkMode={dm}
                    onToggleCollapse={toggleCollapse}
                    onUpdateTask={updateTask}
                    onDeleteTask={deleteTask}
                    onAddTask={addTask}
                    onDeleteGroup={deleteGroup}
                    onRenameGroup={renameGroup}
                    onReorderTasks={reorderTasks}
                    onCreateTag={createTag}
                    onTaskComplete={handleTaskComplete}
                  />
                ))}
              </div>
            )
          )}

          {state.viewMode === 'calendar' && (
            <CalendarView
              groups={state.groups}
              darkMode={dm}
              onUpdateTask={updateTask}
              googleAuthUrl={googleAuthUrl}
              calendarSyncing={quickCalendarSyncing}
              onCalendarSync={quickSyncGoogleCalendar}
            />
          )}

          {state.viewMode === 'analytics' && (
            <AnalyticsPanel groups={state.groups} darkMode={dm} />
          )}
        </div>
      </main>

      <MobileBottomNav
        viewMode={state.viewMode}
        toolsOpen={showTools}
        onViewChange={mode => {
          setShowTools(false)
          setViewMode(mode)
        }}
        onToolsToggle={() => setShowTools(open => !open)}
        darkMode={dm}
      />

      <ConfettiOverlay particles={confettiParticles} />
    </div>
  )
}
