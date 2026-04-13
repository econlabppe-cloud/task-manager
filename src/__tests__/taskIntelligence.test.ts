import { describe, it, expect } from 'vitest'
import { parseSmartTask, formatDateLabel, buildFocusPlan } from '../taskIntelligence'
import type { Group, Task } from '../types'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a minimal Group for testing */
function makeGroup(id: string, title: string, tasks: Task[] = []): Group {
  return { id, title, color: 'blue', collapsed: false, order: 0, tasks }
}

/** Build a minimal Task for testing */
function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'test task',
    assignee: '',
    status: 'לא התחיל',
    priority: 'בינוני',
    dueDate: '',
    notes: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    subtasks: [],
    tags: [],
    recurring: 'none',
    order: 0,
    ...overrides,
  }
}

// Fixed reference date: Wednesday, 2026-04-15 (day 3 in JS = Wednesday)
const TODAY = new Date(2026, 3, 15) // month is 0-indexed → April

// ── parseSmartTask ────────────────────────────────────────────────────────────

describe('parseSmartTask', () => {
  const groups = [
    makeGroup('g-cleaning', 'ניקיון'),
    makeGroup('g-shopping', 'קניות'),
    makeGroup('g-kids', 'ילדים'),
    makeGroup('g-finance', 'כספים'),
  ]

  it('routes a cleaning task to the cleaning group', () => {
    const draft = parseSmartTask('לנקות את המטבח', groups, TODAY)
    expect(draft.groupId).toBe('g-cleaning')
  })

  it('routes a shopping task to the shopping group', () => {
    const draft = parseSmartTask('לקנות חלב בסופר', groups, TODAY)
    expect(draft.groupId).toBe('g-shopping')
  })

  it('routes a finance task to the finance group', () => {
    const draft = parseSmartTask('לשלם את חשבון הבנק', groups, TODAY)
    expect(draft.groupId).toBe('g-finance')
  })

  it('parses "מחר" as tomorrow', () => {
    const draft = parseSmartTask('מחר לשטוף כלים', groups, TODAY)
    expect(draft.dueDate).toBe('2026-04-16')
  })

  it('parses "מחרתיים" as two days from now', () => {
    const draft = parseSmartTask('מחרתיים לשטוף כלים', groups, TODAY)
    expect(draft.dueDate).toBe('2026-04-17')
  })

  it('parses "היום" as today', () => {
    const draft = parseSmartTask('היום לשלם חשבון', groups, TODAY)
    expect(draft.dueDate).toBe('2026-04-15')
  })

  it('parses "בעוד 3 ימים"', () => {
    const draft = parseSmartTask('בעוד 3 ימים לקנות ירקות', groups, TODAY)
    expect(draft.dueDate).toBe('2026-04-18')
  })

  it('parses "שבוע הבא" as 7 days ahead', () => {
    const draft = parseSmartTask('שבוע הבא לשלם ארנונה', groups, TODAY)
    expect(draft.dueDate).toBe('2026-04-22')
  })

  it('parses an explicit date like "20/4"', () => {
    const draft = parseSmartTask('ב-20/4 לקנות ציוד', groups, TODAY)
    expect(draft.dueDate).toBe('2026-04-20')
  })

  it('parses "ביום שני" as next Monday', () => {
    // TODAY is Wednesday (3). Next Monday (1) is in 5 days → 2026-04-20
    const draft = parseSmartTask('ביום שני לסדר', groups, TODAY)
    expect(draft.dueDate).toBe('2026-04-20')
  })

  it('assigns assignee יהודה', () => {
    const draft = parseSmartTask('אני צריך לקנות לחם', groups, TODAY)
    expect(draft.assignee).toBe('יהודה')
  })

  it('assigns assignee אשתי', () => {
    const draft = parseSmartTask('אשתי תקנה ירקות', groups, TODAY)
    expect(draft.assignee).toBe('אשתי')
  })

  it('assigns assignee שנינו', () => {
    const draft = parseSmartTask('שנינו נסדר את הבית', groups, TODAY)
    expect(draft.assignee).toBe('שנינו')
  })

  it('assigns assignee ילדים', () => {
    const draft = parseSmartTask('הילדים יסדרו את החדר', groups, TODAY)
    expect(draft.assignee).toBe('ילדים')
  })

  it('parses priority גבוה from "דחוף"', () => {
    const draft = parseSmartTask('דחוף לתקן את הברז', groups, TODAY)
    expect(draft.priority).toBe('גבוה')
  })

  it('parses priority נמוך from "לא דחוף"', () => {
    const draft = parseSmartTask('לא דחוף לסדר את המחסן', groups, TODAY)
    expect(draft.priority).toBe('נמוך')
  })

  it('defaults to priority בינוני', () => {
    const draft = parseSmartTask('לקנות חלב', groups, TODAY)
    expect(draft.priority).toBe('בינוני')
  })

  it('strips assignee and date from title', () => {
    const draft = parseSmartTask('מחר לקנות לחם, ליהודה', groups, TODAY)
    // Title should not contain "מחר" or "יהודה"
    expect(draft.title).not.toMatch(/מחר/)
    expect(draft.title).not.toMatch(/יהודה/)
    expect(draft.title.length).toBeGreaterThan(0)
  })

  it('falls back to first group when no keyword matches', () => {
    const localGroups = [makeGroup('g-misc', 'שונות')]
    const draft = parseSmartTask('לא ברור מה לעשות', localGroups, TODAY)
    expect(draft.groupId).toBe('g-misc')
  })

  it('handles empty string gracefully', () => {
    const draft = parseSmartTask('', groups, TODAY)
    expect(draft.title).toBe('')
  })
})

// ── formatDateLabel ───────────────────────────────────────────────────────────

describe('formatDateLabel', () => {
  it('returns "בלי יעד" for empty string', () => {
    expect(formatDateLabel('', TODAY)).toBe('בלי יעד')
  })

  it('returns "היום" for today', () => {
    expect(formatDateLabel('2026-04-15', TODAY)).toBe('היום')
  })

  it('returns "מחר" for tomorrow', () => {
    expect(formatDateLabel('2026-04-16', TODAY)).toBe('מחר')
  })

  it('returns "בעוד N ימים" for dates within the week', () => {
    expect(formatDateLabel('2026-04-19', TODAY)).toBe('בעוד 4 ימים')
  })

  it('returns "באיחור N ימים" for past dates', () => {
    expect(formatDateLabel('2026-04-10', TODAY)).toBe('באיחור 5 ימים')
  })

  it('returns DD/MM/YYYY for dates further than a week', () => {
    expect(formatDateLabel('2026-05-01', TODAY)).toBe('01/05/2026')
  })
})

// ── buildFocusPlan ────────────────────────────────────────────────────────────

describe('buildFocusPlan', () => {
  it('returns empty plan when there are no open tasks', () => {
    const groups = [makeGroup('g1', 'עבודה', [makeTask({ status: 'הושלם' })])]
    const plan = buildFocusPlan(groups, TODAY)
    expect(plan.items).toHaveLength(0)
    expect(plan.overdueCount).toBe(0)
  })

  it('scores overdue tasks highest', () => {
    const groups = [
      makeGroup('g1', 'עבודה', [
        makeTask({ id: 't-overdue', title: 'overdue', dueDate: '2026-04-10', priority: 'נמוך' }),
        makeTask({ id: 't-future', title: 'future', dueDate: '2026-05-01', priority: 'גבוה' }),
      ]),
    ]
    const plan = buildFocusPlan(groups, TODAY)
    expect(plan.items[0].task.id).toBe('t-overdue')
    expect(plan.overdueCount).toBe(1)
  })

  it('counts stuck tasks', () => {
    const groups = [
      makeGroup('g1', 'עבודה', [makeTask({ status: 'תקוע' }), makeTask({ id: 't2', status: 'תקוע' })]),
    ]
    const plan = buildFocusPlan(groups, TODAY)
    expect(plan.stuckCount).toBe(2)
  })

  it('limits items to top 3', () => {
    const tasks = Array.from({ length: 10 }, (_, i) =>
      makeTask({ id: `t${i}`, title: `task ${i}`, dueDate: '2026-04-16' }),
    )
    const groups = [makeGroup('g1', 'עבודה', tasks)]
    const plan = buildFocusPlan(groups, TODAY)
    expect(plan.items.length).toBeLessThanOrEqual(3)
  })

  it('provides a nudge string', () => {
    const groups = [makeGroup('g1', 'עבודה', [makeTask()])]
    const plan = buildFocusPlan(groups, TODAY)
    expect(typeof plan.nudge).toBe('string')
    expect(plan.nudge.length).toBeGreaterThan(0)
  })
})
