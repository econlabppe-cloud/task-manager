import React from 'react'
import { parseSmartTask } from '../taskIntelligence'
import { ackBridgeCapture, checkBridgeHealth, fetchBridgeInbox } from '../apiBridge'
import type { BridgeCapture, BridgeStatus } from '../apiBridge'
import type { BoardState, Task } from '../types'
import {
  BRIDGE_POLL_INTERVAL_MS,
  MAX_PROCESSED_CAPTURES,
  PROCESSED_CAPTURE_KEY,
} from '../constants'

function loadProcessedCaptureIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(PROCESSED_CAPTURE_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

function saveProcessedCaptureIds(ids: Set<string>): void {
  try {
    localStorage.setItem(
      PROCESSED_CAPTURE_KEY,
      JSON.stringify(Array.from(ids).slice(-MAX_PROCESSED_CAPTURES)),
    )
  } catch {
    // ignore — non-critical
  }
}

/**
 * Polls the local bridge server and appends any new WhatsApp / shortcut
 * captures to the board state.
 *
 * Returns the current bridge connection status so the UI can show an indicator.
 */
export function useBridgeSync(setState: React.Dispatch<React.SetStateAction<BoardState>>): BridgeStatus {
  const [bridgeStatus, setBridgeStatus] = React.useState<BridgeStatus>('checking')
  const processedIdsRef = React.useRef<Set<string>>(loadProcessedCaptureIds())

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

            const sourceLabel =
              capture.source === 'whatsapp'
                ? 'נקלט מווצאפ'
                : capture.source === 'shortcut'
                  ? 'נקלט מקיצור דרך'
                  : 'נקלט חיצוני'

            const newTask: Task = {
              id: `task-${capture.id}`,
              title: draft.title,
              assignee: draft.assignee,
              status: 'לא התחיל',
              priority: draft.priority,
              dueDate: draft.dueDate,
              notes: `${sourceLabel}: ${capture.text}`,
              createdAt: capture.createdAt,
              subtasks: [],
              tags: [],
              recurring: 'none',
              order: group.tasks.length,
            }

            return { ...group, tasks: [...group.tasks, newTask] }
          }),
        }
      })
    }

    const poll = async () => {
      try {
        await checkBridgeHealth()
        if (!active) return
        setBridgeStatus('connected')

        const captures = await fetchBridgeInbox()
        for (const capture of captures) {
          if (processedIdsRef.current.has(capture.id)) {
            await ackBridgeCapture(capture.id)
            continue
          }
          appendCapture(capture)
          processedIdsRef.current.add(capture.id)
          saveProcessedCaptureIds(processedIdsRef.current)
          await ackBridgeCapture(capture.id)
        }
      } catch {
        if (active) setBridgeStatus('offline')
      }
    }

    void poll()
    const id = window.setInterval(() => void poll(), BRIDGE_POLL_INTERVAL_MS)
    return () => {
      active = false
      window.clearInterval(id)
    }
  }, [setState])

  return bridgeStatus
}
