import { BoardState, Group, RecurringTaskTemplate, Task } from './types'
import { ensureRecurringState, materializeRecurringTasks } from './recurringTasks'
import { seedData } from './seed'
import {
  STORAGE_KEY,
  STORAGE_KEY_LEGACY,
  CURRENT_VERSION,
  MAX_TITLE_LENGTH,
  MAX_NOTES_LENGTH,
  MAX_GROUP_TITLE_LENGTH,
} from './constants'

const DEFAULT_TAGS = [
  { id: 'tag-urgent', label: 'דחוף', color: 'rose' },
  { id: 'tag-weekly', label: 'שבועי', color: 'sky' },
  { id: 'tag-shabbat', label: 'שבת', color: 'violet' },
] as BoardState['tags']

function sanitiseString(value: unknown, maxLength: number): string {
  return String(value ?? '').slice(0, maxLength)
}

function migrateTask(t: Partial<Task> & { id: string; title: string; createdAt: string }, idx: number): Task {
  return {
    subtasks: [],
    tags: [],
    recurring: 'none',
    order: idx,
    assignee: '',
    status: 'לא התחיל',
    priority: 'בינוני',
    dueDate: '',
    ...t,
    // enforce length caps even on loaded data
    title: sanitiseString(t.title, MAX_TITLE_LENGTH),
    notes: sanitiseString(t.notes ?? '', MAX_NOTES_LENGTH),
  }
}

function migrateGroup(g: Partial<Group> & { id: string; title: string }, idx: number): Group {
  const tasks = ((g.tasks ?? []) as Array<Partial<Task> & { id: string; title: string; createdAt: string }>).map(migrateTask)

  return {
    color: 'indigo',
    collapsed: false,
    order: idx,
    ...g,
    title: sanitiseString(g.title, MAX_GROUP_TITLE_LENGTH),
    tasks,
  }
}

function migrateRecurringTask(t: Partial<RecurringTaskTemplate> & { id: string; title: string }): RecurringTaskTemplate {
  return {
    groupId: '',
    assignee: '',
    priority: 'בינוני',
    notes: '',
    cadence: 'weekly',
    daysOfWeek: [0],
    active: true,
    generatedDates: [],
    createdAt: new Date().toISOString(),
    ...t,
  }
}

function migrate(raw: unknown): BoardState {
  const s = raw as Record<string, unknown>
  const groups = ((s.groups ?? []) as Array<Partial<Group> & { id: string; title: string }>).map(migrateGroup)
  const recurringTasks = ((s.recurringTasks ?? []) as Array<Partial<RecurringTaskTemplate> & { id: string; title: string }>).map(migrateRecurringTask)

  return ensureRecurringState({
    version: CURRENT_VERSION,
    groups,
    tags: (s.tags as BoardState['tags']) ?? DEFAULT_TAGS,
    recurringTasks,
    recurringDefaultsAdded: (s.recurringDefaultsAdded as boolean) ?? false,
    filterAssignee: (s.filterAssignee as BoardState['filterAssignee']) ?? '',
    filterStatus: (s.filterStatus as BoardState['filterStatus']) ?? '',
    filterTag: (s.filterTag as string) ?? '',
    viewMode: (s.viewMode as BoardState['viewMode']) ?? 'board',
    darkMode: (s.darkMode as boolean) ?? false,
    searchQuery: (s.searchQuery as string) ?? '',
  })
}

export function loadState(): BoardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      return materializeRecurringTasks(migrate(parsed)).state
    }
    // Legacy key
    const legacy = localStorage.getItem(STORAGE_KEY_LEGACY)
    if (legacy) {
      const parsed = JSON.parse(legacy) as unknown
      return materializeRecurringTasks(migrate(parsed)).state
    }
  } catch (err) {
    console.warn('[store] Failed to load state, falling back to seed data:', err)
  }
  return materializeRecurringTasks(migrate({ groups: seedData, tags: DEFAULT_TAGS })).state
}

export function saveState(state: BoardState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    // QuotaExceededError — storage is full
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      console.error('[store] localStorage quota exceeded — state not saved.')
      // Dispatch a custom event so the UI can warn the user
      window.dispatchEvent(new CustomEvent('mandy:storage-quota-exceeded'))
    } else {
      console.error('[store] Failed to save state:', err)
    }
  }
}
