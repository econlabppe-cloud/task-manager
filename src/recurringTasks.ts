import {
  Assignee,
  BoardState,
  Group,
  Priority,
  RecurringTaskInput,
  RecurringTaskTemplate,
  Task,
} from './types'

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]
const SCHOOL_DAYS = [0, 1, 2, 3, 4, 5]
const WORKWEEK_DAYS = [0, 1, 2, 3, 4]

export const WEEKDAY_LABELS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'שבת']
export const assigneeOptions: Assignee[] = ['יהודה', 'אשתי', 'שנינו', 'ילדים', '']
export const priorityOptions: Priority[] = ['נמוך', 'בינוני', 'גבוה']

const DEFAULT_ROUTINES: Array<Omit<RecurringTaskInput, 'groupId'>> = [
  {
    title: 'לסגור מי לוקח ומי אוסף את הילדים',
    assignee: 'שנינו',
    priority: 'גבוה',
    notes: 'ערב קודם: מי יוצא בבוקר, מי אוסף, ומה צריך לקחת בתיקים.',
    cadence: 'daily',
    daysOfWeek: SCHOOL_DAYS,
    active: true,
  },
  {
    title: 'בדיקת תיקי ילדים, אוכל ובקבוקים',
    assignee: 'שנינו',
    priority: 'בינוני',
    notes: 'להכין בערב כדי להפחית לחץ בבוקר.',
    cadence: 'daily',
    daysOfWeek: SCHOOL_DAYS,
    active: true,
  },
  {
    title: 'איפוס בית 10 דקות בערב',
    assignee: 'שנינו',
    priority: 'בינוני',
    notes: 'טיימר קצר: משטחים, כלים גלויים, כביסה שנשארה באמצע.',
    cadence: 'daily',
    daysOfWeek: ALL_DAYS,
    active: true,
  },
  {
    title: 'לתכנן תפריט לשבת',
    assignee: 'שנינו',
    priority: 'גבוה',
    notes: 'מנה עיקרית, תוספת, סלטים, קינוח, ומה אפשר להכין מראש.',
    cadence: 'weekly',
    daysOfWeek: [2],
    active: true,
  },
  {
    title: 'לבנות רשימת קניות שבועית',
    assignee: 'שנינו',
    priority: 'בינוני',
    notes: 'לעבור על מזווה, מקרר, שבת, ארוחות ילדים וחוסרים קבועים.',
    cadence: 'weekly',
    daysOfWeek: [3],
    active: true,
  },
  {
    title: 'קניות שבועיות לשבת ולשבוע',
    assignee: 'שנינו',
    priority: 'גבוה',
    notes: 'לקנות לפי הרשימה, לא לפי זיכרון. להשאיר מקום להשלמה קטנה.',
    cadence: 'weekly',
    daysOfWeek: [4],
    active: true,
  },
  {
    title: 'שטיפת בית לפני שבת',
    assignee: 'שנינו',
    priority: 'גבוה',
    notes: 'לחלק לאזורים: מטבח, סלון, שירותים, רצפה. לא לחכות לרגע האחרון.',
    cadence: 'weekly',
    daysOfWeek: [5],
    active: true,
  },
  {
    title: 'משימות לפני שבת: פלטה, נרות ושעון שבת',
    assignee: 'שנינו',
    priority: 'גבוה',
    notes: 'פלטה, מיחם, נרות, שעון שבת, מפתחות, בגדים לילדים, פינוי שולחן.',
    cadence: 'weekly',
    daysOfWeek: [5],
    active: true,
  },
  {
    title: 'סיבוב תחזוקה קצר בבית',
    assignee: 'יהודה',
    priority: 'נמוך',
    notes: 'לזהות תקלה אחת קטנה לפני שהיא הופכת לפרויקט.',
    cadence: 'weekly',
    daysOfWeek: [1],
    active: true,
  },
  {
    title: 'בדיקת תקציב וקניות חריגות',
    assignee: 'שנינו',
    priority: 'בינוני',
    notes: 'עוברים על חיובים חריגים וקובעים החלטה אחת לשבוע הבא.',
    cadence: 'weekly',
    daysOfWeek: [0],
    active: true,
  },
]

const GROUP_BY_ROUTINE_TITLE: Array<{ match: RegExp; groupTitle: string; fallbackId: string }> = [
  { match: /ילדים|תיקי/, groupTitle: 'ילדים', fallbackId: 'group-kids' },
  { match: /קניות|תפריט/, groupTitle: 'קניות', fallbackId: 'group-shopping' },
  { match: /שטיפת|איפוס|שבת/, groupTitle: 'ניקיון', fallbackId: 'group-cleaning' },
  { match: /תחזוקה/, groupTitle: 'תחזוקה', fallbackId: 'group-maintenance' },
  { match: /תקציב|חיובים/, groupTitle: 'כספים', fallbackId: 'group-finance' },
]

function startOfLocalDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function addDays(date: Date, days: number): Date {
  const copy = startOfLocalDay(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function formatInputDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function findGroupId(groups: Group[], routineTitle: string): string {
  const groupMatch = GROUP_BY_ROUTINE_TITLE.find(item => item.match.test(routineTitle))
  const byTitle = groupMatch
    ? groups.find(group => group.title.includes(groupMatch.groupTitle) || groupMatch.groupTitle.includes(group.title))
    : undefined
  const byFallbackId = groupMatch ? groups.find(group => group.id === groupMatch.fallbackId) : undefined
  return byTitle?.id ?? byFallbackId?.id ?? groups[0]?.id ?? ''
}

function templateIdFromTitle(title: string): string {
  let hash = 0
  for (let index = 0; index < title.length; index += 1) {
    hash = (hash * 31 + title.charCodeAt(index)) >>> 0
  }
  return `routine-${hash.toString(36)}`
}

export function createRecurringTask(input: RecurringTaskInput): RecurringTaskTemplate {
  return {
    ...input,
    id: `routine-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`,
    generatedDates: [],
    createdAt: new Date().toISOString(),
  }
}

export function buildDefaultRecurringTasks(groups: Group[]): RecurringTaskTemplate[] {
  return DEFAULT_ROUTINES.map(routine => ({
    ...routine,
    id: templateIdFromTitle(routine.title),
    groupId: findGroupId(groups, routine.title),
    generatedDates: [],
    createdAt: '2026-04-13T00:00:00.000Z',
  }))
}

export function ensureRecurringState(state: BoardState): BoardState {
  if (state.recurringDefaultsAdded) return state

  return {
    ...state,
    recurringTasks: [...state.recurringTasks, ...buildDefaultRecurringTasks(state.groups)],
    recurringDefaultsAdded: true,
  }
}

function shouldRunOnDate(template: RecurringTaskTemplate, date: Date): boolean {
  if (!template.active) return false
  return template.daysOfWeek.includes(date.getDay())
}

function recurringTags(template: RecurringTaskTemplate): string[] {
  const tags = ['tag-weekly']
  if (/שבת|פלטה|נרות|תפריט/.test(template.title)) tags.push('tag-shabbat')
  return tags
}

function createTaskFromTemplate(template: RecurringTaskTemplate, date: Date, order: number): Task {
  const dueDate = formatInputDate(date)

  return {
    id: `task-${template.id}-${dueDate}`,
    title: template.title,
    assignee: template.assignee,
    status: 'לא התחיל',
    priority: template.priority,
    dueDate,
    notes: template.notes ? `${template.notes}\nנוצר מרוטינה חוזרת.` : 'נוצר מרוטינה חוזרת.',
    createdAt: new Date().toISOString(),
    subtasks: [],
    tags: recurringTags(template),
    recurring: template.cadence,
    recurringTemplateId: template.id,
    recurringInstanceDate: dueDate,
    order,
  }
}

function hasExistingInstance(group: Group, template: RecurringTaskTemplate, dueDate: string): boolean {
  return group.tasks.some(task =>
    task.recurringTemplateId === template.id && task.recurringInstanceDate === dueDate
  ) || group.tasks.some(task =>
    task.title === template.title && task.dueDate === dueDate
  )
}

function pruneGeneratedDates(dates: string[]): string[] {
  return Array.from(new Set(dates)).sort().slice(-180)
}

export function materializeRecurringTasks(
  state: BoardState,
  options: { daysAhead?: number; today?: Date } = {}
): { state: BoardState; addedCount: number; changed: boolean } {
  const daysAhead = options.daysAhead ?? 3
  const today = startOfLocalDay(options.today ?? new Date())
  const dates = Array.from({ length: daysAhead + 1 }, (_, index) => addDays(today, index))
  const tasksByGroup = new Map<string, Task[]>()
  const generatedByTemplate = new Map<string, string[]>()
  let addedCount = 0
  let changed = false

  for (const template of state.recurringTasks) {
    const group = state.groups.find(item => item.id === template.groupId)
    if (!group) continue

    for (const date of dates) {
      const dueDate = formatInputDate(date)
      if (!shouldRunOnDate(template, date)) continue
      if (template.generatedDates.includes(dueDate)) continue

      generatedByTemplate.set(template.id, [...(generatedByTemplate.get(template.id) ?? []), dueDate])

      if (hasExistingInstance(group, template, dueDate)) {
        changed = true
        continue
      }

      const pendingForGroup = tasksByGroup.get(group.id) ?? []
      const nextOrder = group.tasks.length + pendingForGroup.length
      tasksByGroup.set(group.id, [...pendingForGroup, createTaskFromTemplate(template, date, nextOrder)])
      addedCount += 1
      changed = true
    }
  }

  if (!changed) return { state, addedCount, changed: false }

  return {
    addedCount,
    changed: true,
    state: {
      ...state,
      groups: state.groups.map(group => ({
        ...group,
        tasks: [...group.tasks, ...(tasksByGroup.get(group.id) ?? [])],
      })),
      recurringTasks: state.recurringTasks.map(template => ({
        ...template,
        generatedDates: pruneGeneratedDates([
          ...template.generatedDates,
          ...(generatedByTemplate.get(template.id) ?? []),
        ]),
      })),
    },
  }
}

export function recurrenceLabel(template: Pick<RecurringTaskTemplate, 'cadence' | 'daysOfWeek'>): string {
  const days = [...template.daysOfWeek].sort((a, b) => a - b)
  if (days.length === 7) return 'כל יום'
  if (days.join(',') === WORKWEEK_DAYS.join(',')) return 'א׳-ה׳'
  if (days.join(',') === SCHOOL_DAYS.join(',')) return 'ימי לימודים א׳-ו׳'

  const dayNames = days.map(day => WEEKDAY_LABELS[day] ?? '').filter(Boolean).join(', ')
  return template.cadence === 'weekly' ? `כל שבוע ביום ${dayNames}` : `בימים ${dayNames}`
}

export function nextRunLabel(template: RecurringTaskTemplate, today = new Date()): string {
  const base = startOfLocalDay(today)

  for (let offset = 0; offset <= 14; offset += 1) {
    const date = addDays(base, offset)
    if (!shouldRunOnDate(template, date)) continue
    if (offset === 0) return 'היום'
    if (offset === 1) return 'מחר'
    return `${WEEKDAY_LABELS[date.getDay()]} ${formatInputDate(date).slice(5).replace('-', '/')}`
  }

  return 'לא מתוזמן'
}

export function dayPresetToDays(preset: 'daily' | 'school' | 'workweek' | 'weekly', weeklyDay: number): number[] {
  if (preset === 'daily') return ALL_DAYS
  if (preset === 'school') return SCHOOL_DAYS
  if (preset === 'workweek') return WORKWEEK_DAYS
  return [Math.max(0, Math.min(6, weeklyDay))]
}
