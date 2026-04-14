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
import { useGoogleCalendarAutoSync } from './hooks/useGoogleCalendarAutoSync'
import { fetchGoogleCalendarAuthStatus } from './googleCalendarSync'
import { useAssistantCapture } from './hooks/useAssistantCapture'
import { useShoppingList } from './hooks/useShoppingList'
import { useConfetti, ConfettiOverlay } from './hooks/useConfetti'
import { useStreak } from './hooks/useStreak'
import { GROUP_COLORS } from './constants'
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
import { ShoppingListView } from './components/ShoppingListView'
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
  const [accessGateEnabled, setAccessGateEnabled] = React.useState(false)
  const [allowedAccess, setAllowedAccess] = React.useState(true)
  const [authChecked, setAuthChecked] = React.useState(false)
  const [signedEmail, setSignedEmail] = React.useState('')

  // Custom hooks
  const bridgeStatus = useBridgeSync(setState)
  const syncGoogleCalendar = useGoogleCalendarSync(setState)
  const [googleSyncState, googleSyncControls] = useGoogleCalendarAutoSync(setState, syncGoogleCalendar)
  const shopping = useShoppingList()

  // Google Assistant capture — items that say "לרשימת קניות" go to shopping; rest to board
  const handleAssistantCapture = React.useCallback((items: { text: string }[]) => {
    for (const { text } of items) {
      const isShoppingIntent = /קניות|לקנות|לקנייה|סופרמרקט/.test(text)
      if (isShoppingIntent) {
        // Strip the intent phrase and add to shopping list
        const item = text.replace(/הוסף(י)?\s*(ל)?רשימת\s*קניות|הכנס(י)?\s*(ל)?רשימה|לקנות\s*/gi, '').trim()
        if (item) shopping.addItem(item)
      } else {
        // Add to board as a task in the first group (same as bridge captures)
        setState(s => {
          if (s.groups.length === 0) return s
          const firstGroup = s.groups[0]
          const newTask: Task = {
            id: 'task-asst-' + Math.random().toString(36).slice(2),
            title: text.slice(0, 500),
            assignee: '' as Assignee,
            status: 'לא התחיל' as Status,
            priority: 'בינוני' as Priority,
            dueDate: '', notes: '', recurring: 'none',
            subtasks: [], tags: [],
            order: firstGroup.tasks.length,
            createdAt: new Date().toISOString(),
            externalSource: 'api',
          }
          return {
            ...s,
            groups: s.groups.map(g =>
              g.id === firstGroup.id ? { ...g, tasks: [...g.tasks, newTask] } : g
            ),
          }
        })
      }
    }
  }, [shopping, setState])

  useAssistantCapture(handleAssistantCapture)

  // Confetti
  const [confettiParticles, fireConfetti] = useConfetti()

  const handleTaskComplete = React.useCallback((_taskId: string, originX: number) => {
    fireConfetti(originX)
  }, [fireConfetti])

  // Streak + completed today
  const todayStr = new Date().toISOString().slice(0, 10)
  const completedToday = React.useMemo(
    () => state.groups.flatMap(g => g.tasks).filter(t =>
      t.status === 'הושלם' && t.completedAt?.startsWith(todayStr)
    ).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.groups, todayStr],
  )
  const streakData = useStreak(completedToday)

  // ── Dark mode ────────────────────────────────────────────────────
  React.useEffect(() => {
    if (state.darkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [state.darkMode])

  // ── Persist ──────────────────────────────────────────────────────
  React.useEffect(() => { saveState(state) }, [state])

  // ── Storage quota warning ────────────────────────────────────────
  React.useEffect(() => {
    const handler = () => setStorageWarning(true)
    window.addEventListener('mandy:storage-quota-exceeded', handler)
    return () => window.removeEventListener('mandy:storage-quota-exceeded', handler)
  }, [])

  // ── Notifications ────────────────────────────────────────────────
  React.useEffect(() => {
    requestNotificationPermission()
    const t = setTimeout(() => checkDueTasks(state.groups), 2500)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Access gate check ───────────────────────────────────────────
  React.useEffect(() => {
    void fetchGoogleCalendarAuthStatus()
      .then(status => {
        setAccessGateEnabled(Boolean(status.accessGateEnabled))
        setAllowedAccess(status.allowed !== false)
        setSignedEmail(status.email ?? '')
        setAuthChecked(true)
      })
      .catch(() => { setAuthChecked(true) })
  }, [])

  // ── Global shortcut Ctrl+K ───────────────────────────────────────
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

  // Note: initial Google Calendar sync is now handled automatically
  // by useGoogleCalendarAutoSync when OAuth status is confirmed.

  // ── Group ops ────────────────────────────────────────────────────
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

  // ── Task ops ─────────────────────────────────────────────────────
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
        g.id === groupId ? { ...g, tasks: g.tasks.map(t => t.id === taskId ? { ...t, ...patch } : t) } : g
      ),
    })),
  [])

  const deleteTask = React.useCallback((groupId: string, taskId: string) =>
    setState(s => ({
      ...s,
      groups: s.groups.map(g =>
        g.id === groupId ? { ...g, tasks: g.tasks.filter(t => t.id !== taskId) } : g
      ),
    })),
  [])

  const reorderTasks = React.useCallback((groupId: string, tasks: Task[]) =>
    setState(s => ({ ...s, groups: s.groups.map(g => g.id === groupId ? { ...g, tasks } : g) })),
  [])

  // ── Tags ─────────────────────────────────────────────────────────
  const createTag = React.useCallback((tag: Tag) =>
    setState(s => ({ ...s, tags: [...s.tags, tag] })),
  [])

  // ── Filter / view ────────────────────────────────────────────────
  const setViewMode = React.useCallback((viewMode: ViewMode) => setState(s => ({ ...s, viewMode })), [])
  const toggleDarkMode = React.useCallback(() => setState(s => ({ ...s, darkMode: !s.darkMode })), [])

  // ── Recurring ────────────────────────────────────────────────────
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

  // ── Import ───────────────────────────────────────────────────────
  const handleImport = React.useCallback((imported: BoardState) =>
    setState(s => ({ ...imported, darkMode: s.darkMode, viewMode: s.viewMode })),
  [])

  // ── Styling ──────────────────────────────────────────────────────
  const dm = state.darkMode
  const pageBg = dm ? 'bg-gray-950' : 'bg-gray-50'
  const mainBg = dm ? 'bg-gray-900' : 'bg-gray-50'
  const toolsBg = dm ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'

  if (accessGateEnabled && authChecked && !allowedAccess) {
    return (
      <div className={`min-h-screen ${pageBg} flex items-center justify-center p-4`} dir="rtl">
        <div className={`w-full max-w-md rounded-xl border p-6 ${dm ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'}`}>
          <h1 className="text-lg font-bold mb-2">גישה פרטית למאנדי בית</h1>
          <p className={`${dm ? 'text-gray-300' : 'text-gray-600'} text-sm leading-6`}>
            הגישה זמינה רק לחשבונות Google שאושרו מראש.
            {signedEmail ? ` החשבון הנוכחי: ${signedEmail}` : ''}
          </p>
          {googleSyncState.authUrl && (
            <a
              href={googleSyncState.authUrl}
              className={`mt-4 inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all shadow-sm hover:shadow ${
                dm ? 'bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              התחבר עם Google
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-screen overflow-hidden max-w-full ${pageBg}`} dir="rtl">
      <Header
        viewMode={state.viewMode}
        darkMode={dm}
        onViewChange={setViewMode}
        onDarkModeToggle={toggleDarkMode}
        googleAuthUrl={googleSyncState.authUrl}
        googleConnected={googleSyncState.isConnected}
        googleEmail={googleSyncState.email}
        calendarSyncing={googleSyncState.isSyncing}
        onCalendarSync={() => { void googleSyncControls.manualSync() }}
        onGoogleDisconnect={googleSyncControls.disconnect}
      />

      {/* Storage quota warning banner */}
      {storageWarning && (
        <div
          role="alert"
          className="bg-amber-50 border-b border-amber-200 text-amber-800 text-xs px-4 py-2 flex items-center justify-between"
        >
          <span>⚠️ האחסון המקומי מלא — הנתונים לא נשמרו. מחק משימות ישנות או ייצא גיבוי.</span>
          <button
            onClick={() => setStorageWarning(false)}
            className="text-amber-600 hover:text-amber-800 font-bold ml-3"
            aria-label="סגור התראה"
          >
            ✕
          </button>
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

      {/* Tools strip */}
      <div className={`border-b ${toolsBg}`}>
        <div className="max-w-6xl mx-auto px-4 py-2">
          <button
            onClick={() => setShowTools(t => !t)}
            aria-expanded={showTools}
            aria-controls="tools-panel"
            className={`flex items-center gap-1.5 text-xs font-medium ${dm ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${showTools ? '' : '-rotate-90'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
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
                <IntegrationHub
                  bridgeStatus={bridgeStatus}
                  syncState={googleSyncState}
                  onManualSync={googleSyncControls.manualSync}
                  onToggleAutoSync={googleSyncControls.toggleAutoSync}
                  onDisconnect={googleSyncControls.disconnect}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      <main className={`flex-1 overflow-y-auto overflow-x-hidden ${mainBg} pb-20 sm:pb-0`}>
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
                {state.groups
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map(group => (
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
              googleAuthUrl={googleSyncState.authUrl}
              googleConnected={googleSyncState.isConnected}
              googleEmail={googleSyncState.email}
              calendarSyncing={googleSyncState.isSyncing}
              onCalendarSync={() => { void googleSyncControls.manualSync() }}
              onGoogleDisconnect={googleSyncControls.disconnect}
            />
          )}

          {state.viewMode === 'analytics' && (
            <AnalyticsPanel groups={state.groups} darkMode={dm} />
          )}

          {state.viewMode === 'shopping' && (
            <ShoppingListView darkMode={dm} />
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
