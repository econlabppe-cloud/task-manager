import { describe, it, expect } from 'vitest'
import {
  createRecurringTask,
  materializeRecurringTasks,
  recurrenceLabel,
  nextRunLabel,
  dayPresetToDays,
  buildDefaultRecurringTasks,
  WEEKDAY_LABELS,
} from '../recurringTasks'
import type { BoardState, Group, RecurringTaskTemplate } from '../types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeGroup(id: string, title: string): Group {
  return { id, title, color: 'blue', collapsed: false, order: 0, tasks: [] }
}

function makeState(groups: Group[], recurringTasks: RecurringTaskTemplate[] = []): BoardState {
  return {
    version: 3,
    groups,
    tags: [],
    recurringTasks,
    recurringDefaultsAdded: true,
    filterAssignee: '',
    filterStatus: '',
    filterTag: '',
    viewMode: 'board',
    darkMode: false,
    searchQuery: '',
  }
}

function makeTemplate(overrides: Partial<RecurringTaskTemplate> = {}): RecurringTaskTemplate {
  return {
    id: 'rt-1',
    title: 'שטיפת כלים',
    groupId: 'g-cleaning',
    assignee: 'שנינו',
    priority: 'בינוני',
    notes: '',
    cadence: 'daily',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // every day
    active: true,
    generatedDates: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

// Wednesday 2026-04-15
const TODAY = new Date(2026, 3, 15)

// ── createRecurringTask ───────────────────────────────────────────────────────

describe('createRecurringTask', () => {
  it('generates an id prefixed with "routine-"', () => {
    const template = createRecurringTask({
      title: 'test', groupId: 'g1', assignee: '', priority: 'בינוני',
      notes: '', cadence: 'daily', daysOfWeek: [0], active: true,
    })
    expect(template.id).toMatch(/^routine-/)
  })

  it('starts with an empty generatedDates array', () => {
    const template = createRecurringTask({
      title: 'test', groupId: 'g1', assignee: '', priority: 'בינוני',
      notes: '', cadence: 'daily', daysOfWeek: [0], active: true,
    })
    expect(template.generatedDates).toEqual([])
  })
})

// ── materializeRecurringTasks ─────────────────────────────────────────────────

describe('materializeRecurringTasks', () => {
  it('creates tasks for today + future days', () => {
    const groups = [makeGroup('g-cleaning', 'ניקיון')]
    const state = makeState(groups, [makeTemplate()])
    const result = materializeRecurringTasks(state, { daysAhead: 2, today: TODAY })

    expect(result.addedCount).toBe(3) // today + 2 ahead
    expect(result.changed).toBe(true)
  })

  it('does not duplicate tasks already generated', () => {
    const groups = [makeGroup('g-cleaning', 'ניקיון')]
    const state = makeState(groups, [makeTemplate({ generatedDates: ['2026-04-15'] })])
    const result = materializeRecurringTasks(state, { daysAhead: 0, today: TODAY })

    // 2026-04-15 already generated → nothing new
    expect(result.addedCount).toBe(0)
    expect(result.changed).toBe(false)
  })

  it('respects daysOfWeek — inactive days produce no tasks', () => {
    const groups = [makeGroup('g-cleaning', 'ניקיון')]
    // Only Sunday (0); TODAY is Wednesday (3)
    const state = makeState(groups, [makeTemplate({ daysOfWeek: [0] })])
    const result = materializeRecurringTasks(state, { daysAhead: 2, today: TODAY })

    expect(result.addedCount).toBe(0)
  })

  it('skips inactive templates', () => {
    const groups = [makeGroup('g-cleaning', 'ניקיון')]
    const state = makeState(groups, [makeTemplate({ active: false })])
    const result = materializeRecurringTasks(state, { daysAhead: 3, today: TODAY })

    expect(result.addedCount).toBe(0)
  })

  it('skips templates whose groupId does not match any group', () => {
    const groups = [makeGroup('g-other', 'אחר')]
    const state = makeState(groups, [makeTemplate({ groupId: 'non-existent-group' })])
    const result = materializeRecurringTasks(state, { daysAhead: 2, today: TODAY })

    expect(result.addedCount).toBe(0)
  })

  it('sets recurringTemplateId and recurringInstanceDate on created tasks', () => {
    const groups = [makeGroup('g-cleaning', 'ניקיון')]
    const state = makeState(groups, [makeTemplate()])
    const result = materializeRecurringTasks(state, { daysAhead: 0, today: TODAY })

    const tasks = result.state.groups[0].tasks
    expect(tasks[0].recurringTemplateId).toBe('rt-1')
    expect(tasks[0].recurringInstanceDate).toBe('2026-04-15')
  })

  it('does not add duplicate if task with same title+date already exists', () => {
    const groups = [makeGroup('g-cleaning', 'ניקיון')]
    // Pre-populate a task that matches the template on today's date
    groups[0].tasks.push({
      id: 'existing-task',
      title: 'שטיפת כלים',
      dueDate: '2026-04-15',
      assignee: 'שנינו',
      status: 'לא התחיל',
      priority: 'בינוני',
      notes: '',
      createdAt: '2026-04-15T00:00:00.000Z',
      subtasks: [],
      tags: [],
      recurring: 'none',
      order: 0,
    })
    const state = makeState(groups, [makeTemplate()])
    const result = materializeRecurringTasks(state, { daysAhead: 0, today: TODAY })

    expect(result.addedCount).toBe(0)
    expect(result.state.groups[0].tasks).toHaveLength(1) // only the pre-existing task
  })
})

// ── recurrenceLabel ───────────────────────────────────────────────────────────

describe('recurrenceLabel', () => {
  it('returns "כל יום" for all 7 days', () => {
    expect(recurrenceLabel({ cadence: 'daily', daysOfWeek: [0,1,2,3,4,5,6] })).toBe('כל יום')
  })

  it('returns "א׳-ה׳" for Mon-Fri (0-4 in Israeli convention)', () => {
    expect(recurrenceLabel({ cadence: 'daily', daysOfWeek: [0,1,2,3,4] })).toBe('א׳-ה׳')
  })

  it('returns school-days label for Sun-Fri', () => {
    expect(recurrenceLabel({ cadence: 'daily', daysOfWeek: [0,1,2,3,4,5] })).toBe('ימי לימודים א׳-ו׳')
  })

  it('returns weekly label for a single day', () => {
    const label = recurrenceLabel({ cadence: 'weekly', daysOfWeek: [1] })
    expect(label).toContain('כל שבוע')
    expect(label).toContain(WEEKDAY_LABELS[1])
  })
})

// ── nextRunLabel ──────────────────────────────────────────────────────────────

describe('nextRunLabel', () => {
  it('returns "היום" when template runs on today\'s day', () => {
    // TODAY is Wednesday (3)
    const template = makeTemplate({ daysOfWeek: [3] }) // Wednesday
    expect(nextRunLabel(template, TODAY)).toBe('היום')
  })

  it('returns "מחר" when template runs tomorrow', () => {
    // TODAY is Wednesday (3), Thursday is (4)
    const template = makeTemplate({ daysOfWeek: [4] })
    expect(nextRunLabel(template, TODAY)).toBe('מחר')
  })

  it('returns "לא מתוזמן" when template has no active days in next 14 days', () => {
    const template = makeTemplate({ active: false })
    expect(nextRunLabel(template, TODAY)).toBe('לא מתוזמן')
  })
})

// ── dayPresetToDays ───────────────────────────────────────────────────────────

describe('dayPresetToDays', () => {
  it('"daily" returns all 7 days', () => {
    expect(dayPresetToDays('daily', 0)).toHaveLength(7)
  })

  it('"school" returns 6 days', () => {
    expect(dayPresetToDays('school', 0)).toHaveLength(6)
  })

  it('"workweek" returns 5 days', () => {
    expect(dayPresetToDays('workweek', 0)).toHaveLength(5)
  })

  it('"weekly" returns an array with a single day', () => {
    expect(dayPresetToDays('weekly', 2)).toEqual([2])
  })

  it('clamps weekly day to 0-6', () => {
    expect(dayPresetToDays('weekly', 10)).toEqual([6])
    expect(dayPresetToDays('weekly', -5)).toEqual([0])
  })
})

// ── buildDefaultRecurringTasks ────────────────────────────────────────────────

describe('buildDefaultRecurringTasks', () => {
  it('returns 10 default routines', () => {
    const groups = [
      makeGroup('g-kids', 'ילדים'),
      makeGroup('g-shopping', 'קניות'),
      makeGroup('g-cleaning', 'ניקיון'),
      makeGroup('g-maintenance', 'תחזוקה'),
      makeGroup('g-finance', 'כספים'),
    ]
    const routines = buildDefaultRecurringTasks(groups)
    expect(routines).toHaveLength(10)
  })

  it('all routines have stable deterministic IDs', () => {
    const groups = [makeGroup('g-cleaning', 'ניקיון')]
    const first = buildDefaultRecurringTasks(groups)
    const second = buildDefaultRecurringTasks(groups)
    expect(first.map(r => r.id)).toEqual(second.map(r => r.id))
  })
})
