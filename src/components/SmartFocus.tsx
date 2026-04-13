import React from 'react'
import { Group, Task } from '../types'
import { buildFocusPlan } from '../taskIntelligence'

interface Props {
  groups: Group[]
  onUpdateTask: (groupId: string, taskId: string, patch: Partial<Task>) => void
}

export const SmartFocus: React.FC<Props> = ({ groups, onUpdateTask }) => {
  const plan = React.useMemo(() => buildFocusPlan(groups), [groups])

  if (plan.items.length === 0) {
    return (
      <section className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <h2 className="text-base font-bold text-gray-900">מיקוד חכם להיום</h2>
        <p className="text-sm text-gray-500 mt-2">אין משימות פתוחות. זמן טוב להוסיף משהו קטן או פשוט לנוח.</p>
      </section>
    )
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-gray-900">מיקוד חכם להיום</h2>
          <p className="text-xs text-gray-500 mt-1">{plan.nudge}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Metric label="באיחור" value={plan.overdueCount} tone="red" />
          <Metric label="קרוב" value={plan.dueSoonCount} tone="amber" />
          <Metric label="תקוע" value={plan.stuckCount} tone="orange" />
          <Metric label="מהיר" value={plan.twoMinuteCount} tone="emerald" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3 mt-4">
        {plan.items.map(item => (
          <article key={item.task.id} className="border border-gray-200 rounded p-3 bg-gray-50">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-gray-400">{item.groupTitle}</span>
              <span className="text-[11px] font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 rounded px-2 py-0.5">
                {item.dueLabel}
              </span>
            </div>

            <h3 className="text-sm font-bold text-gray-900 mt-2 min-h-[40px]">{item.task.title}</h3>
            <p className="text-xs text-gray-500 mt-2">{item.reason}</p>
            <p className="text-xs text-gray-600 mt-1">{item.nextStep}</p>

            <button
              type="button"
              onClick={() => onUpdateTask(item.groupId, item.task.id, { status: 'בתהליך' })}
              className="mt-3 w-full rounded bg-gray-900 text-white text-xs font-semibold py-2 hover:bg-gray-700 transition-colors"
            >
              להתחיל עכשיו
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

interface MetricProps {
  label: string
  value: number
  tone: 'red' | 'amber' | 'orange' | 'emerald'
}

const metricClass: Record<MetricProps['tone'], string> = {
  red: 'bg-red-50 text-red-700 border-red-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const Metric: React.FC<MetricProps> = ({ label, value, tone }) => (
  <div className={`min-w-[72px] border rounded px-2 py-1 text-center ${metricClass[tone]}`}>
    <div className="text-sm font-bold">{value}</div>
    <div className="text-[11px]">{label}</div>
  </div>
)
