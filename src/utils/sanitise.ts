import { MAX_TITLE_LENGTH, MAX_NOTES_LENGTH, MAX_GROUP_TITLE_LENGTH } from '../constants'

/** Truncate a string to a safe length. Strips leading/trailing whitespace. */
export function sanitiseTitle(raw: unknown): string {
  return String(raw ?? '').trim().slice(0, MAX_TITLE_LENGTH)
}

export function sanitiseNotes(raw: unknown): string {
  return String(raw ?? '').slice(0, MAX_NOTES_LENGTH)
}

export function sanitiseGroupTitle(raw: unknown): string {
  return String(raw ?? '').trim().slice(0, MAX_GROUP_TITLE_LENGTH)
}
