import type { Answers, GradeResult, PaperSpec } from './types'

export interface Attempt {
  spec: PaperSpec
  date: string // ISO
  mcScore: number
  lqScore: number
  total: number
  max: number
  passed: boolean
  answers: Answers
}

/** Swap this for a server-backed implementation later. */
export interface ProgressStore {
  attempts(topicId: string): Attempt[]
  record(topicId: string, spec: PaperSpec, answers: Answers, result: GradeResult): Attempt
  isPassed(topicId: string): boolean
  best(topicId: string): Attempt | null
  seenMcIds(topicId: string): Set<string>
  passedIds(): Set<string>
  devMode(): boolean
  setDevMode(on: boolean): void
  exportJson(): string
  importJson(text: string): void // throws on invalid input, leaves existing data untouched
}

interface State {
  version: 1
  devMode: boolean
  attempts: Record<string, Attempt[]>
}

const KEY = 'quantitative.progress.v1'
const empty = (): State => ({ version: 1, devMode: false, attempts: {} })

function validate(x: unknown): State {
  const s = x as State
  if (!s || typeof s !== 'object' || s.version !== 1 || typeof s.attempts !== 'object' || s.attempts === null)
    throw new Error('not a Quantitative progress file (version 1)')
  for (const [id, list] of Object.entries(s.attempts)) {
    if (!Array.isArray(list)) throw new Error(`attempts for ${id} must be a list`)
    for (const a of list) {
      if (!a?.spec?.seed || !Array.isArray(a.spec.mcIds) || !Array.isArray(a.spec.lqIds) ||
          typeof a.total !== 'number' || typeof a.passed !== 'boolean' || typeof a.date !== 'string')
        throw new Error(`malformed attempt for ${id}`)
    }
  }
  return { version: 1, devMode: s.devMode === true, attempts: s.attempts }
}

export function createLocalProgress(storage: Pick<Storage, 'getItem' | 'setItem'> | null): ProgressStore {
  let state = empty()
  try {
    const raw = storage?.getItem(KEY)
    if (raw) state = validate(JSON.parse(raw))
  } catch {
    state = empty() // corrupt or blocked storage: start clean, don't crash the app
  }
  const save = () => {
    try { storage?.setItem(KEY, JSON.stringify(state)) } catch { /* storage full or blocked */ }
  }
  const list = (id: string) => state.attempts[id] ?? []
  const store: ProgressStore = {
    attempts: list,
    record(topicId, spec, answers, r) {
      const a: Attempt = {
        spec, date: new Date().toISOString(), mcScore: r.mcScore, lqScore: r.lqScore,
        total: r.total, max: r.max, passed: r.passed, answers,
      }
      state.attempts[topicId] = [...list(topicId), a]
      save()
      return a
    },
    isPassed: (id) => list(id).some((a) => a.passed),
    best: (id) => list(id).reduce<Attempt | null>((b, a) => (b === null || a.total > b.total ? a : b), null),
    seenMcIds: (id) => new Set(list(id).flatMap((a) => a.spec.mcIds)),
    // lecture quizzes are stored under "<topicId>#L<n>" and are not topics
    passedIds: () => new Set(Object.keys(state.attempts).filter((id) => !id.includes('#') && store.isPassed(id))),
    devMode: () => state.devMode,
    setDevMode(on) { state.devMode = on; save() },
    exportJson: () => JSON.stringify(state, null, 1),
    importJson(text) {
      state = validate(JSON.parse(text))
      save()
    },
  }
  return store
}
