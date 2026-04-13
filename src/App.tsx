import React from 'react'
import type {
  BoardState, Tag, Task,
  Status, Priority, Assignee, NewTaskDefaults, ViewMode,
  RecurringTaskInput,
} from './types'
import { loadState, saveState } from './store'
import { createRecurringTask, materializeRecurringTasks } from './recurringTasks'
import { requestNotificationPermission, checkDueTasks } from './notifications'
import { parseSmartTask } from './taskIntelligence'
import { ackBridgeCapture, checkBridgeHealth, fetchBridgeInbox } from './apiBridge'
import type { BridgeCapture, BridgeStatus } from './apiBridge'
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

const GROUP_COLORS = ['purple', 'blue', 'green', 'orange', 'teal', 'red', 'pink', 'indigo']
const PROCESSED_CAPTURE_KEY = 'mandy-processed-captures-v1'

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function loadProcessedCaptureIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(PROCESSED_CAPTURE_KEY) ?? '[]') as string[]) }
  catch { return new Set() }
}
function saveProcessedCaptureIds(ids: Set<string>): void {
  try { localStorage.setItem(PROCESSED_CAPTURE_KEY, JSON.stringify(Array.from(ids).slice(-250))) }
  catch { /* ignore */ }
}

export default function App() {
  const [state, setState] = React.useState<BoardState>(() => loadState())
  const [showTools, setShowTools] = React.useState(false)
  const [bridgeStatus, setBridgeStatus] = React.useState<BridgeStatus>('checking')
  const processedCaptureIdsRef = React.useRef<Set<string>>(loadProcessedCaptureIds())

  // ── Dark mode ────────────────────────────────────────────────────
  React.useEffect(() => {
    if (state.darkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [state.darkMode])

  // ── Persist ──────────────────────────────────────────────────────
  React.useEffect(() => { saveState(state) }, [state])

  // ── Notifications ────────────────────────────────────────────────
  React.useEffect(() => {
    requestNotificationPermission()
    const t = setTimeout(() => checkDueTasks(state.groups), 2500)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ── API Bridge polling ───────────────────────────────────────────
  React.useEffect(() => {
    let active = true
    const appendCapture = (capture: BridgeCapture) => {
      setState(current => {
        const draft = parseSmartTask(capture.text, current.groups)
        if (!draft.groupId) return current
        return {
          ...current,
          groups: current.groups.map(group => {
            if (group.id !== draft.groupId) return group
            const sourceLabel = capture.source === 'whatsapp' ? 'נקלט מווצאפ' : capture.source === 'shortcut' ? 'נקלט מקיצור דרך' : 'נקלט חיצוני'
            const newTask: Task = {
              id: `task-${capture.id}`, title: draft.title, assignee: draft.assignee,
              status: 'לא התחיל', priority: draft.priority, dueDate: draft.dueDate,
              notes: `${sourceLabel}: ${capture.text}`, createdAt: capture.createdAt,
              subtasks: [], tags: [], recurring: 'none', order: group.tasks.length,
            }
            return { ...group, tasks: [...group.tasks, newTask] }
          }),
        }
      })
    }
    const pollBridge = async () => {
      try {
        await checkBridgeHealth()
        if (!active) return
        setBridgeStatus('connected')
        const captures = await fetchBridgeInbox()
        for (const capture of captures) {
          if (processedCaptureIdsRef.current.has(capture.id)) { await ackBridgeCapture(capture.id); continue }
          appendCapture(capture)
          processedCaptureIdsRef.current.add(capture.id)
          saveProcessedCaptureIds(processedCaptureIdsRef.current)
          await ackBridgeCapture(capture.id)
        }
      } catch { if (active) setBridgeStatus('offline') }
    }
    void pollBridge()
    const id = window.setInterval(() => void pollBridge(), 5000)
    return () => { active = false; window.clearInterval(id) }
  }, [])

  // ── Group ops ────────────────────────────────────────────────────
  const toggleCollapse = (groupId: string) =>
    setState(s => ({ ...s, groups: s.groups.map(g => g.id === groupId ? { ...g, collapsed: !g.collapsed } : g) }))

  const addGroup = () => {
    const usedColors = new Set(state.groups.map(g => g.color))
    const color = GROUP_COLORS.find(c => !usedColors.has(c)) ?? GROUP_COLORS[state.groups.length % GROUP_COLORS.length]
    setState(s => ({ ...s, groups: [...s.groups, { id: 'group-' + genId(), title: 'קבוצה חדשה', color, collapsed: false, order: s.groups.length, tasks: [] }] }))
  }

  const deleteGroup = (groupId: string) =>
    setState(s => ({ ...s, groups: s.groups.filter(g => g.id !== groupId) }))

  const renameGroup = (groupId: string, title: string) =>
    setState(s => ({ ...s, groups: s.groups.map(g => g.id === groupId ? { ...g, title } : g) }))

  // ── Task ops ─────────────────────────────────────────────────────
  const addTask = (groupId: string, title: string, defaults: NewTaskDefaults = {}) => {
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
  }

  const updateTask = (groupId: string, taskId: string, patch: Partial<Task>) =>
    setState(s => ({
      ...s,
      groups: s.groups.map(g =>
        g.id === groupId ? { ...g, tasks: g.tasks.map(t => t.id === taskId ? { ...t, ...patch } : t) } : g
      ),
    }))

  const deleteTask = (groupId: string, taskId: string) =>
    setState(s => ({
      ...s,
      groups: s.groups.map(g =>
        g.id === groupId ? { ...g, tasks: g.tasks.filter(t => t.id !== taskId) } : g
      ),
    }))

  const reorderTasks = (groupId: string, tasks: Task[]) =>
    setState(s => ({ ...s, groups: s.groups.map(g => g.id === groupId ? { ...g, tasks } : g) }))

  // ── Tags ─────────────────────────────────────────────────────────
  const createTag = (tag: Tag) =>
    setState(s => ({ ...s, tags: [...s.tags, tag] }))

  // ── Filter / view ────────────────────────────────────────────────
  const setViewMode = (viewMode: ViewMode) => setState(s => ({ ...s, viewMode }))
  const toggleDarkMode = () => setState(s => ({ ...s, darkMode: !s.darkMode }))

  // ── Recurring ────────────────────────────────────────────────────
  const addRecurringTask = (input: RecurringTaskInput) =>
    setState(s => ({ ...s, recurringTasks: [...s.recurringTasks, createRecurringTask(input)] }))

  const updateRecurringTask = (templateId: string, patch: Partial<RecurringTaskInput>) =>
    setState(s => ({ ...s, recurringTasks: s.recurringTasks.map(t => t.id === templateId ? { ...t, ...patch } : t) }))

  const deleteRecurringTask = (templateId: string) =>
    setState(s => ({ ...s, recurringTasks: s.recurringTasks.filter(t => t.id !== templateId) }))

  const generateRecurringWeek = (): number => {
    const result = materializeRecurringTasks(state, { daysAhead: 7 })
    setState(result.state)
    return result.addedCount
  }

  // ── Import ───────────────────────────────────────────────────────
  const handleImport = (imported: BoardState) =>
    setState({ ...imported, darkMode: state.darkMode, viewMode: state.viewMode })

  // ── Styling ──────────────────────────────────────────────────────
  const dm = state.darkMode
  const pageBg = dm ? 'bg-gray-950' : 'bg-gray-50'
  const mainBg = dm ? 'bg-gray-900' : 'bg-gray-50'
  const toolsBg = dm ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${pageBg}`} dir="rtl">
      <Header viewMode={state.viewMode} darkMode={dm} onViewChange={setViewMode} onDarkModeToggle={toggleDarkMode} />
      <StatsBar groups={state.groups} darkMode={dm} />
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
            className={`flex items-center gap-1.5 text-xs font-medium ${dm ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
          >
            <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${showTools ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>כלים • Ctrl+K לאיסוף מהיר</span>
          </button>

          {showTools && (
            <div className="mt-3 space-y-3 pb-3">
              <SmartCapture groups={state.groups} onAddTask={addTask} />
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
                <IntegrationHub bridgeStatus={bridgeStatus} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      <main className={`flex-1 overflow-y-auto ${mainBg}`}>
        <div className="max-w-6xl mx-auto px-4 py-5">

          {state.viewMode === 'board' && (
            state.groups.length === 0 ? (
              <div className="text-center py-20">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${dm ? 'bg-indigo-900/40' : 'bg-indigo-100'}`}>
                  <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </div>
                <h2 className={`text-lg font-semibold mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>הלוח ריק</h2>
                <p className={`text-sm mb-4 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>לחצו על "קבוצה" כדי להתחיל</p>
              </div>
            ) : (
              state.groups
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
                  />
                ))
            )
          )}

          {state.viewMode === 'calendar' && (
            <CalendarView groups={state.groups} darkMode={dm} />
          )}

          {state.viewMode === 'analytics' && (
            <AnalyticsPanel groups={state.groups} darkMode={dm} />
          )}
        </div>
      </main>
    </div>
  )
}
