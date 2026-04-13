import { Assignee, Group, Priority, Task } from './types'

const DAY_MS = 24 * 60 * 60 * 1000

export interface SmartTaskDraft {
  title: string
  groupId: string
  groupTitle: string
  assignee: Assignee
  priority: Priority
  dueDate: string
  reasons: string[]
}

export interface FocusItem {
  groupId: string
  groupTitle: string
  task: Task
  dueLabel: string
  reason: string
  nextStep: string
  score: number
}

export interface FocusPlan {
  items: FocusItem[]
  overdueCount: number
  dueSoonCount: number
  stuckCount: number
  inProgressCount: number
  twoMinuteCount: number
  nudge: string
}

const GROUP_KEYWORDS = [
  {
    title: 'ניקיון',
    keywords: ['ניקיון', 'לנקות', 'לשטוף', 'כביסה', 'אבק', 'מטבח', 'אמבטיה', 'שירותים', 'חלונות', 'ארון'],
  },
  {
    title: 'קניות',
    keywords: ['קניות', 'לקנות', 'סופר', 'חלב', 'לחם', 'ביצים', 'ירקות', 'אמזון', 'ציוד'],
  },
  {
    title: 'ילדים',
    keywords: ['ילדים', 'ילד', 'בית ספר', 'חוג', 'רופא', 'שיניים', 'צעצועים', 'משחקים', 'הורים'],
  },
  {
    title: 'תחזוקה',
    keywords: ['תחזוקה', 'לתקן', 'להחליף', 'ברז', 'מזגן', 'נורה', 'גינה', 'שרברב', 'טכנאי', 'לצבוע'],
  },
  {
    title: 'כספים',
    keywords: ['כספים', 'לשלם', 'חשבון', 'ארנונה', 'ביטוח', 'תקציב', 'בנק', 'חיסכון', 'חיוב'],
  },
]

const WEEKDAYS = [
  { label: 'ראשון', day: 0 },
  { label: 'שני', day: 1 },
  { label: 'שלישי', day: 2 },
  { label: 'רביעי', day: 3 },
  { label: 'חמישי', day: 4 },
  { label: 'שישי', day: 5 },
  { label: 'שבת', day: 6 },
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

function daysUntil(dueDate: string, today = new Date()): number | null {
  if (!dueDate) return null
  const [year, month, day] = dueDate.split('-').map(Number)
  if (!year || !month || !day) return null

  const due = startOfLocalDay(new Date(year, month - 1, day))
  const base = startOfLocalDay(today)
  return Math.round((due.getTime() - base.getTime()) / DAY_MS)
}

function parseDueDate(text: string, today = new Date()): string {
  const base = startOfLocalDay(today)

  if (/מחרתיים/.test(text)) return formatInputDate(addDays(base, 2))
  if (/מחר/.test(text)) return formatInputDate(addDays(base, 1))
  if (/היום|עוד היום/.test(text)) return formatInputDate(base)

  const inDays = text.match(/בעוד\s+(\d{1,2})\s+ימים?/)
  if (inDays) return formatInputDate(addDays(base, Number(inDays[1])))

  if (/שבוע הבא|בשבוע הבא/.test(text)) return formatInputDate(addDays(base, 7))

  const dateMatch = text.match(/(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/)
  if (dateMatch) {
    const day = Number(dateMatch[1])
    const month = Number(dateMatch[2])
    let year = dateMatch[3] ? Number(dateMatch[3]) : base.getFullYear()
    if (year < 100) year += 2000

    const candidate = startOfLocalDay(new Date(year, month - 1, day))
    if (!dateMatch[3] && candidate < base) {
      candidate.setFullYear(candidate.getFullYear() + 1)
    }
    if (!Number.isNaN(candidate.getTime())) return formatInputDate(candidate)
  }

  const weekday = WEEKDAYS.find(item => new RegExp(`(?:ביום\\s*)?${item.label}`).test(text))
  if (weekday) {
    const diff = (weekday.day - base.getDay() + 7) % 7 || 7
    return formatInputDate(addDays(base, diff))
  }

  return ''
}

function parseAssignee(text: string): Assignee {
  if (/שנינו|ביחד|יחד/.test(text)) return 'שנינו'
  if (/ילדים|הילדים|לילדים/.test(text)) return 'ילדים'
  if (/אשתי|לאשתי|אישה|האישה|לאישה/.test(text)) return 'אשתי'
  if (/יהודה|אני|עלי|שלי/.test(text)) return 'יהודה'
  return ''
}

function parsePriority(text: string): Priority {
  if (/לא דחוף|כשיהיה זמן|נמוך|נמוכה/.test(text)) return 'נמוך'
  if (/דחוף|דחופה|חשוב|חשובה|קריטי|גבוה|גבוהה/.test(text)) return 'גבוה'
  return 'בינוני'
}

function pickGroup(text: string, groups: Group[]): Group | undefined {
  const exact = groups.find(group => text.includes(group.title))
  if (exact) return exact

  const match = GROUP_KEYWORDS.find(config =>
    config.keywords.some(keyword => text.includes(keyword))
  )
  if (match) {
    const byTitle = groups.find(group => group.title.includes(match.title) || match.title.includes(group.title))
    if (byTitle) return byTitle
  }

  return groups[0]
}

function cleanTitle(raw: string, groups: Group[]): string {
  let title = raw.trim()

  title = title
    .replace(/^(תזכיר לי|תזכורת|צריך|צריכים|אני צריך|להוסיף|משימה)\s*/g, '')
    .replace(/(עדיפות\s*)?(גבוהה|גבוה|דחוף|דחופה|קריטי|חשוב|חשובה|נמוכה|נמוך|בינוני)/g, '')
    .replace(/לא דחוף|כשיהיה זמן/g, '')
    .replace(/ליהודה|יהודה|לאשתי|אשתי|אישה|האישה|לאישה|לילדים|ילדים|שנינו|ביחד|יחד|עלי|שלי/g, '')
    .replace(/מחרתיים|מחר|עוד היום|היום|בעוד\s+\d{1,2}\s+ימים?|שבוע הבא|בשבוע הבא/g, '')
    .replace(/(?:ביום\s*)?(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)/g, '')
    .replace(/(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/g, '')

  groups.forEach(group => {
    title = title.replace(new RegExp(group.title, 'g'), '')
  })

  title = title
    .replace(/[,:;|]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

  return title || raw.trim()
}

function explainDraft(text: string, draft: Omit<SmartTaskDraft, 'reasons'>): string[] {
  const reasons: string[] = []
  if (draft.groupTitle) reasons.push(`שובץ ל${draft.groupTitle}`)
  if (draft.dueDate) reasons.push('זוהה תאריך יעד')
  if (draft.assignee) reasons.push(`שויך ל${draft.assignee}`)
  if (draft.priority === 'גבוה' && /דחוף|חשוב|קריטי|גבוה/.test(text)) reasons.push('סומן כגבוה')
  if (draft.priority === 'נמוך' && /לא דחוף|כשיהיה זמן|נמוך/.test(text)) reasons.push('סומן כנמוך')
  return reasons
}

export function parseSmartTask(raw: string, groups: Group[], today = new Date()): SmartTaskDraft {
  const text = raw.trim()
  const group = pickGroup(text, groups)
  const draft = {
    title: cleanTitle(text, groups),
    groupId: group?.id ?? '',
    groupTitle: group?.title ?? '',
    assignee: parseAssignee(text),
    priority: parsePriority(text),
    dueDate: parseDueDate(text, today),
  }

  return {
    ...draft,
    reasons: explainDraft(text, draft),
  }
}

export function formatDateLabel(dueDate: string, today = new Date()): string {
  const diff = daysUntil(dueDate, today)
  if (diff === null) return 'בלי יעד'
  if (diff < 0) return `באיחור ${Math.abs(diff)} ימים`
  if (diff === 0) return 'היום'
  if (diff === 1) return 'מחר'
  if (diff <= 7) return `בעוד ${diff} ימים`
  const [year, month, day] = dueDate.split('-')
  return `${day}/${month}/${year}`
}

function isLikelyTwoMinuteTask(task: Task): boolean {
  return /לשלם|להתקשר|לקבוע|לבדוק|לשלוח|לעדכן|להחליף נורות|לקנות מוצרי/.test(task.title)
}

function scoreTask(task: Task, today = new Date()): number {
  const diff = daysUntil(task.dueDate, today)
  const priorityScore = task.priority === 'גבוה' ? 45 : task.priority === 'בינוני' ? 25 : 10
  const statusScore = task.status === 'תקוע' ? 30 : task.status === 'בתהליך' ? 15 : 5
  const dueScore =
    diff === null ? 4 :
    diff < 0 ? 60 :
    diff === 0 ? 55 :
    diff === 1 ? 35 :
    diff <= 3 ? 22 :
    diff <= 7 ? 12 :
    2
  const quickWin = isLikelyTwoMinuteTask(task) ? 8 : 0

  return priorityScore + statusScore + dueScore + quickWin
}

function focusReason(task: Task, today = new Date()): string {
  const diff = daysUntil(task.dueDate, today)
  const reasons: string[] = []

  if (diff !== null && diff < 0) reasons.push('עבר יעד')
  else if (diff === 0) reasons.push('להיום')
  else if (diff === 1) reasons.push('למחר')

  if (task.priority === 'גבוה') reasons.push('עדיפות גבוהה')
  if (task.status === 'תקוע') reasons.push('תקוע')
  if (isLikelyTwoMinuteTask(task)) reasons.push('ניצחון מהיר')

  return reasons.slice(0, 2).join(' + ') || 'הכי משתלם לקדם עכשיו'
}

function nextStep(task: Task): string {
  if (task.status === 'תקוע') return 'לכתוב חסם אחד ולמי פונים'
  if (isLikelyTwoMinuteTask(task)) return 'לעשות עכשיו אם יש שתי דקות'
  if (!task.dueDate) return 'לתת יעד קטן כדי שלא יישאר פתוח'
  if (task.priority === 'גבוה') return 'להתחיל בפעולה של 5 דקות'
  return 'להגדיר את הצעד הבא הכי קטן'
}

function buildNudge(plan: Omit<FocusPlan, 'items' | 'nudge'>): string {
  if (plan.overdueCount > 0) return 'קודם מורידים לחץ: משימה אחת שעברה יעד, בלי לפתוח עוד חזית.'
  if (plan.stuckCount > 0) return 'משימה תקועה לא צריכה יותר כוח רצון, היא צריכה חסם ברור וצעד קטן.'
  if (plan.inProgressCount >= 4) return 'יש יותר מדי דברים פתוחים. כדאי לסיים או להקטין משימה אחת לפני שמתחילים חדשה.'
  if (plan.twoMinuteCount > 0) return 'יש כאן ניצחון מהיר. שתי דקות עכשיו יכולות לנקות רעש מהראש.'
  return 'בחרו עד שלוש משימות להיום. פחות עומס, יותר סיכוי לסיים.'
}

export function buildFocusPlan(groups: Group[], today = new Date()): FocusPlan {
  const openItems = groups.flatMap(group =>
    group.tasks
      .filter(task => task.status !== 'הושלם')
      .map(task => ({
        groupId: group.id,
        groupTitle: group.title,
        task,
        dueLabel: formatDateLabel(task.dueDate, today),
        reason: focusReason(task, today),
        nextStep: nextStep(task),
        score: scoreTask(task, today),
      }))
  )

  const metrics = {
    overdueCount: openItems.filter(item => {
      const diff = daysUntil(item.task.dueDate, today)
      return diff !== null && diff < 0
    }).length,
    dueSoonCount: openItems.filter(item => {
      const diff = daysUntil(item.task.dueDate, today)
      return diff !== null && diff >= 0 && diff <= 2
    }).length,
    stuckCount: openItems.filter(item => item.task.status === 'תקוע').length,
    inProgressCount: openItems.filter(item => item.task.status === 'בתהליך').length,
    twoMinuteCount: openItems.filter(item => isLikelyTwoMinuteTask(item.task)).length,
  }

  return {
    ...metrics,
    items: openItems.sort((a, b) => b.score - a.score).slice(0, 3),
    nudge: buildNudge(metrics),
  }
}
