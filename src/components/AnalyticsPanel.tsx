import React from 'react'
import { Assignee, Group } from '../types'

interface Props {
  groups: Group[]
  darkMode?: boolean
}

const ASSIGNEES: Assignee[] = ['יהודה', 'אשתי', 'שנינו', 'ילדים']
const ASSIGNEE_COLOR: Record<string, string> = {
  'יהודה': 'bg-blue-500',
  'אשתי': 'bg-pink-500',
  'שנינו': 'bg-violet-500',
  'ילדים': 'bg-green-500',
}

interface StatCardProps { label: string; value: string | number; sub?: string; color?: string; darkMode?: boolean }
const StatCard: React.FC<StatCardProps> = ({ label, value, sub, color = 'text-indigo-600', darkMode }) => (
  <div className={`rounded-xl border p-4 flex flex-col gap-1 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
    <span className={`text-2xl font-bold ${color}`}>{value}</span>
    <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
    {sub && <span className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{sub}</span>}
  </div>
)

interface BarRowProps { label: string; value: number; max: number; color: string; darkMode?: boolean }
const BarRow: React.FC<BarRowProps> = ({ label, value, max, color, darkMode }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs w-16 text-right shrink-0 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
      <div className={`flex-1 h-3 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className={`h-3 rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs w-8 shrink-0 font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{value}</span>
    </div>
  )
}

export const AnalyticsPanel: React.FC<Props> = ({ groups, darkMode }) => {
  const allTasks = groups.flatMap(g => g.tasks)
  const total = allTasks.length
  const done = allTasks.filter(t => t.status === 'הושלם').length
  const inProgress = allTasks.filter(t => t.status === 'בתהליך').length
  const stuck = allTasks.filter(t => t.status === 'תקוע').length
  const notStarted = allTasks.filter(t => t.status === 'לא התחיל').length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const overdue = allTasks.filter(t => {
    if (!t.dueDate || t.status === 'הושלם') return false
    return new Date(t.dueDate) < today
  }).length
  const dueToday = allTasks.filter(t => {
    if (!t.dueDate || t.status === 'הושלם') return false
    const d = new Date(t.dueDate)
    d.setHours(0, 0, 0, 0)
    return d.getTime() === today.getTime()
  }).length

  const totalSubtasks = allTasks.reduce((sum, t) => sum + (t.subtasks?.length ?? 0), 0)
  const doneSubtasks = allTasks.reduce((sum, t) => sum + (t.subtasks?.filter(s => s.done).length ?? 0), 0)

  const byAssignee = ASSIGNEES.map(a => ({
    name: a,
    total: allTasks.filter(t => t.assignee === a).length,
    done: allTasks.filter(t => t.assignee === a && t.status === 'הושלם').length,
  })).filter(a => a.total > 0)

  const byGroup = groups.map(g => ({
    title: g.title,
    color: g.color,
    total: g.tasks.length,
    done: g.tasks.filter(t => t.status === 'הושלם').length,
    pct: g.tasks.length > 0 ? Math.round((g.tasks.filter(t => t.status === 'הושלם').length / g.tasks.length) * 100) : 0,
  }))

  const bg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
  const textMain = darkMode ? 'text-gray-100' : 'text-gray-800'
  const sectionTitle = `text-sm font-bold mb-3 ${textMain}`

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="סה״כ משימות" value={total} darkMode={darkMode} color={darkMode ? 'text-indigo-400' : 'text-indigo-600'} />
        <StatCard label="הושלמו" value={done} sub={`${pct}% מהסך`} darkMode={darkMode} color="text-green-600" />
        <StatCard label="באיחור" value={overdue} sub="דורש טיפול" darkMode={darkMode} color={overdue > 0 ? 'text-red-500' : 'text-gray-400'} />
        <StatCard label="להיום" value={dueToday} darkMode={darkMode} color={dueToday > 0 ? 'text-amber-600' : 'text-gray-400'} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Status breakdown */}
        <div className={`rounded-xl border p-4 ${bg}`}>
          <h3 className={sectionTitle}>לפי סטטוס</h3>
          <div className="space-y-3">
            <BarRow label="לא התחיל" value={notStarted} max={total} color="bg-gray-400" darkMode={darkMode} />
            <BarRow label="בתהליך"   value={inProgress} max={total} color="bg-blue-500" darkMode={darkMode} />
            <BarRow label="תקוע"     value={stuck}      max={total} color="bg-orange-500" darkMode={darkMode} />
            <BarRow label="הושלם"    value={done}       max={total} color="bg-green-500" darkMode={darkMode} />
          </div>
          {/* Donut-style progress */}
          <div className="mt-4 flex items-center gap-3">
            <div className="relative w-16 h-16 shrink-0">
              <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke="#22c55e" strokeWidth="3"
                  strokeDasharray={`${pct} ${100 - pct}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-sm font-bold ${textMain}`}>{pct}%</span>
              </div>
            </div>
            <div>
              <p className={`text-sm font-semibold ${textMain}`}>{done} מתוך {total} הושלמו</p>
              {stuck > 0 && <p className="text-xs text-orange-500 mt-0.5">{stuck} תקועות — צריך לטפל</p>}
            </div>
          </div>
        </div>

        {/* By assignee */}
        <div className={`rounded-xl border p-4 ${bg}`}>
          <h3 className={sectionTitle}>לפי אחראי</h3>
          {byAssignee.length === 0 ? (
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>אין נתונים</p>
          ) : (
            <div className="space-y-4">
              {byAssignee.map(a => {
                const pctA = a.total > 0 ? Math.round((a.done / a.total) * 100) : 0
                return (
                  <div key={a.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${ASSIGNEE_COLOR[a.name] ?? 'bg-gray-400'}`}>
                          {a.name[0]}
                        </div>
                        <span className={`text-xs font-medium ${textMain}`}>{a.name}</span>
                      </div>
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{a.done}/{a.total} ({pctA}%)</span>
                    </div>
                    <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div
                        className={`h-2 rounded-full ${ASSIGNEE_COLOR[a.name] ?? 'bg-gray-400'} transition-all duration-700`}
                        style={{ width: `${pctA}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* By group */}
      <div className={`rounded-xl border p-4 ${bg}`}>
        <h3 className={sectionTitle}>לפי קטגוריה</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {byGroup.map(g => (
            <div key={g.title} className={`rounded-lg p-3 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${textMain}`}>{g.title}</span>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{g.pct}%</span>
              </div>
              <div className={`h-1.5 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                <div
                  className={`h-1.5 rounded-full bg-${g.color}-500 transition-all duration-700`}
                  style={{ width: `${g.pct}%`, backgroundColor: g.color === 'purple' ? '#a855f7' : g.color === 'blue' ? '#3b82f6' : g.color === 'green' ? '#22c55e' : g.color === 'orange' ? '#f97316' : g.color === 'teal' ? '#14b8a6' : g.color === 'red' ? '#ef4444' : g.color === 'pink' ? '#ec4899' : '#6366f1' }}
                />
              </div>
              <p className={`text-[10px] mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{g.done}/{g.total} הושלמו</p>
            </div>
          ))}
        </div>
      </div>

      {/* Subtasks */}
      {totalSubtasks > 0 && (
        <div className={`rounded-xl border p-4 ${bg}`}>
          <h3 className={sectionTitle}>תת-משימות</h3>
          <div className="flex items-center gap-4">
            <div className={`text-2xl font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{doneSubtasks}</div>
            <div>
              <p className={`text-xs font-medium ${textMain}`}>הושלמו מתוך {totalSubtasks}</p>
              <div className={`mt-1 w-32 h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${totalSubtasks > 0 ? Math.round((doneSubtasks / totalSubtasks) * 100) : 0}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
