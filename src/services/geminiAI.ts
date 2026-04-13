/**
 * Gemini AI service with automatic model fallback.
 *
 * Tries models from best to most-available:
 *   gemini-2.5-flash → gemini-2.5-flash-lite → gemma-3-27b-it
 *
 * On HTTP 429 (rate-limit) the next model in the chain is tried.
 * Falls back to null when every model is exhausted so the UI can
 * degrade gracefully to the local buildFocusPlan logic.
 */

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

// Ordered best-quality → most-available
const MODEL_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemma-3-27b-it',
] as const

type GeminiModel = (typeof MODEL_CHAIN)[number]

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> }
  }>
}

async function callGemini(model: GeminiModel, prompt: string, apiKey: string): Promise<string> {
  const url = `${BASE_URL}/${model}:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 350, temperature: 0.7 },
    }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw Object.assign(new Error(`Gemini ${model}: HTTP ${res.status}`), { status: res.status, body: err })
  }

  const data = (await res.json()) as GeminiResponse
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  if (!text) throw new Error(`Gemini ${model}: empty response`)
  return text
}

/** Call Gemini with automatic fallback. Returns null if all models fail. */
export async function askGemini(prompt: string): Promise<string | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
  if (!apiKey) return null

  for (const model of MODEL_CHAIN) {
    try {
      return await callGemini(model, prompt, apiKey)
    } catch (err) {
      const status = (err as { status?: number }).status
      // 429 = rate-limited → try next model
      // other errors → also try next (network, quota exhausted, etc.)
      console.warn(`[gemini] ${model} failed (${status ?? 'unknown'}), trying next…`)
    }
  }

  return null
}

/** Build the Hebrew prompt from current board state */
export function buildAIPrompt(
  groups: Array<{ title: string; tasks: Array<{ title: string; status: string; priority: string; dueDate: string; assignee: string }> }>,
): string {
  const today = new Date().toLocaleDateString('he-IL')
  const openTasks = groups.flatMap(g =>
    g.tasks
      .filter(t => t.status !== 'הושלם')
      .map(t => ({ ...t, group: g.title })),
  )
  const overdue = openTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date(new Date().toDateString()))
  const dueToday = openTasks.filter(t => t.dueDate === new Date().toISOString().slice(0, 10))
  const high = openTasks.filter(t => t.priority === 'גבוה')

  const taskSummary = openTasks
    .slice(0, 12)
    .map(t => `• ${t.title} [${t.group}] עדיפות:${t.priority} סטטוס:${t.status}${t.dueDate ? ` יעד:${t.dueDate}` : ''}`)
    .join('\n')

  return `אתה עוזר משפחתי חכם לניהול משימות הבית. היום ${today}.

סיכום הלוח:
- סה"כ משימות פתוחות: ${openTasks.length}
- באיחור: ${overdue.length}
- ליום זה: ${dueToday.length}
- עדיפות גבוהה: ${high.length}

המשימות הפתוחות:
${taskSummary}

אנא כתוב תשובה קצרה (עד 120 מילים) בעברית, בגוף ראשון רבים, בטון חם וחברותי:
1. מהי המשימה שהכי כדאי לעשות עכשיו ולמה?
2. טיפ אחד פרקטי לאיך לקדם אותה היום.
3. משפט אחד של עידוד.
אל תשתמש בכוכביות או כותרות — כתוב כמו הודעת וואטסאפ מחבר.`
}
