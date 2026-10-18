// TEST-ONLY login. There is no backend: this only checks a salted SHA-256 hash in the browser and then
// marks a fixed list of topics as passed. The hash is public, so it protects nothing; replace this with
// a server-backed ProgressStore before real accounts exist.
import type { ProgressStore } from './progress'

const SALT = 'quant-test-v1'
const USER = 'chrisccthz'
const HASH = '52eb163f530f52ca797f731bafdc34a15496f828e8882eb69ed92f4dcbf568c7'
const STORAGE_KEY = 'quantitative.testuser'

export const SAVED_TOPICS = ['calc', 'la1', 'dm', 'py', 'mvc', 'p1', 'p2', 'pf1', 'reg1', 'dv1', 'sp', 'sc', 'cpp1', 'ds1']

export async function checkCredentials(user: string, password: string): Promise<boolean> {
  if (user !== USER) return false
  const bytes = new TextEncoder().encode(`${SALT}:${user}:${password}`)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
  return hex === HASH
}

/** Adds a self-reported pass for each saved topic that is not already passed. Never touches real attempts. */
export function applySavedProgress(store: ProgressStore): void {
  const data = JSON.parse(store.exportJson())
  const date = new Date().toISOString()
  for (const id of SAVED_TOPICS) {
    if (store.isPassed(id)) continue
    data.attempts[id] = [...(data.attempts[id] ?? []), {
      spec: { seed: 'self-reported', mcIds: [], lqIds: [] }, date,
      mcScore: 20, lqScore: 30, total: 50, max: 50, passed: true, answers: { mc: [], lq: [] },
    }]
  }
  store.importJson(JSON.stringify(data))
}

export const loggedInUser = (): string | null => {
  try { return window.localStorage.getItem(STORAGE_KEY) } catch { return null }
}
export const setLoggedInUser = (u: string | null): void => {
  try { u ? window.localStorage.setItem(STORAGE_KEY, u) : window.localStorage.removeItem(STORAGE_KEY) } catch { /* storage blocked */ }
}
