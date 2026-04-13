import React from 'react'

const STREAK_KEY = 'mandy-streak-v1'

interface StreakData {
  currentStreak: number
  longestStreak: number
  lastDate: string       // YYYY-MM-DD of last day a task was completed
  completedDates: string[] // last 60 unique YYYY-MM-DD dates
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    if (raw) return JSON.parse(raw) as StreakData
  } catch { /* ignore */ }
  return { currentStreak: 0, longestStreak: 0, lastDate: '', completedDates: [] }
}

function saveStreak(data: StreakData): void {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

/**
 * Call `recordCompletion()` whenever a task is marked done.
 * Returns current streak info and a helper that counts today's completions.
 */
export function useStreak(completedTodayCount: number) {
  const [streak, setStreak] = React.useState<StreakData>(loadStreak)

  // Keep streak in sync with actual completions
  React.useEffect(() => {
    if (completedTodayCount === 0) return
    const today = todayStr()

    setStreak(prev => {
      if (prev.completedDates.includes(today)) return prev // already recorded

      const dates = [...prev.completedDates, today].slice(-60)
      const yesterday = yesterdayStr()
      const isConsecutive = prev.lastDate === yesterday || prev.lastDate === today
      const currentStreak = isConsecutive ? prev.currentStreak + (prev.lastDate === today ? 0 : 1) : 1
      const next: StreakData = {
        currentStreak,
        longestStreak: Math.max(prev.longestStreak, currentStreak),
        lastDate: today,
        completedDates: dates,
      }
      saveStreak(next)
      return next
    })
  }, [completedTodayCount])

  return streak
}
