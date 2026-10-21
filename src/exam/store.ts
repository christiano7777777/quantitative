// Big Exam attempts, drafts and settings in localStorage. Separate from the skill-tree progress store (which stays
// untouched); the header's Export/Import progress buttons carry both in one file.

import { percentToGrade } from './config.ts'
import { summarise, toPercent, type ExamSummary } from './grades.ts'
import type { CodingAttempt, Weights, WrittenAttempt, WrittenExam, WrittenMarking } from './types.ts'

export interface WrittenDraft { startedAt: string; updatedAt: string; answers: Record<string, string> }
export interface CodingDraft { startedAt: string; updatedAt: string; code: Record<string, string> }

interface State {
  version: 1
  written: Record<string, WrittenAttempt[]>
  coding: Record<string, CodingAttempt[]>
  drafts: { written: Record<string, WrittenDraft>; coding: Record<string, CodingDraft> }
}

export interface Settings { anthropicKey: string; model: string }

export const DEFAULT_MODEL = 'claude-opus-5-5'
export const STATE_KEY = 'quantitative.exams.v1'
export const SETTINGS_KEY = 'quantitative.settings.v1'

const empty = (): State => ({ version: 1, written: {}, coding: {}, drafts: { written: {}, coding: {} } })
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)

/** throws a readable error for anything that is not an exam-progress object */
export function validateState(x: unknown): State {
  if (!isObj(x) || x.version !== 1 || !isObj(x.written) || !isObj(x.coding)) throw new Error('not a Big Exam progress object (version 1)')
  const drafts = isObj(x.drafts) ? x.drafts : {}
  for (const [kind, lists] of [['written', x.written], ['coding', x.coding]] as const)
    for (const [topic, list] of Object.entries(lists)) {
      if (!Array.isArray(list)) throw new Error(`${kind} attempts for ${topic} must be a list`)
      for (const a of list) {
        if (!isObj(a) || typeof a.id !== 'string' || typeof a.submittedAt !== 'string' || typeof a.max !== 'number')
          throw new Error(`malformed ${kind} attempt for ${topic}`)
      }
    }
  return {
    version: 1, written: x.written as State['written'], coding: x.coding as State['coding'],
    drafts: { written: (isObj(drafts.written) ? drafts.written : {}) as State['drafts']['written'], coding: (isObj(drafts.coding) ? drafts.coding : {}) as State['drafts']['coding'] },
  }
}

/** Sum of the marks of every sub-part, clamped to its maximum. A part missing from the marking counts 0. */
export function scoreWritten(exam: WrittenExam, marking: WrittenMarking): number {
  let total = 0
  for (const q of exam.questions) {
    const qm = marking.questions.find((x) => x.id === q.id)
    for (const p of q.parts) {
      const m = qm?.parts.find((x) => x.id === p.id)?.marks
      if (typeof m === 'number' && Number.isFinite(m)) total += Math.max(0, Math.min(p.marks, m))
    }
  }
  return total
}

export function createExamStore(storage: Pick<Storage, 'getItem' | 'setItem'> | null) {
  let state = empty()
  try {
    const raw = storage?.getItem(STATE_KEY)
    if (raw) state = validateState(JSON.parse(raw))
  } catch {
    state = empty() // corrupt or blocked storage: start clean, never crash the app
  }
  const save = () => {
    try { storage?.setItem(STATE_KEY, JSON.stringify(state)) } catch { /* full or blocked */ }
  }

  const store = {
    writtenAttempts: (topic: string): WrittenAttempt[] => state.written[topic] ?? [],
    codingAttempts: (topic: string): CodingAttempt[] => state.coding[topic] ?? [],
    writtenAttempt: (topic: string, id: string) => (state.written[topic] ?? []).find((a) => a.id === id) ?? null,
    codingAttempt: (topic: string, id: string) => (state.coding[topic] ?? []).find((a) => a.id === id) ?? null,

    // ---- written ----
    writtenDraft: (topic: string): WrittenDraft | null => state.drafts.written[topic] ?? null,
    startWritten(topic: string): WrittenDraft {
      const now = new Date().toISOString()
      return (state.drafts.written[topic] = { startedAt: now, updatedAt: now, answers: {} }, save(), state.drafts.written[topic])
    },
    saveWrittenDraft(topic: string, answers: Record<string, string>) {
      const d = state.drafts.written[topic]
      if (!d) return
      d.answers = answers; d.updatedAt = new Date().toISOString(); save()
    },
    discardWrittenDraft(topic: string) { delete state.drafts.written[topic]; save() },
    /** turns the draft into a submitted attempt, waiting for marks */
    submitWritten(topic: string, exam: WrittenExam, answers: Record<string, string>): WrittenAttempt {
      const d = state.drafts.written[topic]
      const now = new Date().toISOString()
      const a: WrittenAttempt = { id: newId(), startedAt: d?.startedAt ?? now, submittedAt: now, answers, max: exam.totalMarks }
      state.written[topic] = [...store.writtenAttempts(topic), a]
      delete state.drafts.written[topic]
      save()
      return a
    },
    /** records (or replaces) the marks of a submitted attempt; computes marks, percent and grade */
    markWritten(topic: string, attemptId: string, exam: WrittenExam, marking: WrittenMarking, by: 'import' | 'api'): WrittenAttempt {
      const a = store.writtenAttempt(topic, attemptId)
      if (!a) throw new Error('attempt not found')
      a.marking = marking
      a.marks = scoreWritten(exam, marking)
      a.max = exam.totalMarks
      a.percent = toPercent(a.marks, a.max)
      a.grade = percentToGrade(a.percent)
      a.markedAt = new Date().toISOString()
      a.markedBy = by
      save()
      return a
    },

    // ---- coding ----
    codingDraft: (topic: string): CodingDraft | null => state.drafts.coding[topic] ?? null,
    startCoding(topic: string, code: Record<string, string>): CodingDraft {
      const now = new Date().toISOString()
      return (state.drafts.coding[topic] = { startedAt: now, updatedAt: now, code }, save(), state.drafts.coding[topic])
    },
    saveCodingDraft(topic: string, code: Record<string, string>) {
      const d = state.drafts.coding[topic]
      if (!d) return
      d.code = code; d.updatedAt = new Date().toISOString(); save()
    },
    discardCodingDraft(topic: string) { delete state.drafts.coding[topic]; save() },
    recordCoding(topic: string, attempt: Omit<CodingAttempt, 'id' | 'startedAt' | 'submittedAt' | 'grade'> & { startedAt?: string }): CodingAttempt {
      const d = state.drafts.coding[topic]
      const now = new Date().toISOString()
      const a: CodingAttempt = { ...attempt, id: newId(), startedAt: attempt.startedAt ?? d?.startedAt ?? now, submittedAt: now, grade: percentToGrade(attempt.percent) }
      state.coding[topic] = [...store.codingAttempts(topic), a]
      delete state.drafts.coding[topic]
      save()
      return a
    },

    // ---- summary and transfer ----
    summary: (topic: string, weights?: Weights): ExamSummary => summarise(store.writtenAttempts(topic), store.codingAttempts(topic), weights),
    exportState: (): State => JSON.parse(JSON.stringify(state)) as State,
    /** replaces all Big Exam data; throws and changes nothing if `x` is not valid */
    importState(x: unknown) { state = validateState(x); save() },
  }
  return store
}

export type ExamStore = ReturnType<typeof createExamStore>

// ---- settings: the API key lives apart from progress, so exporting progress never exports the key ----

export function loadSettings(storage: Pick<Storage, 'getItem'> | null): Settings {
  try {
    const x = JSON.parse(storage?.getItem(SETTINGS_KEY) ?? '{}') as Partial<Settings>
    return { anthropicKey: typeof x.anthropicKey === 'string' ? x.anthropicKey : '', model: typeof x.model === 'string' && x.model ? x.model : DEFAULT_MODEL }
  } catch {
    return { anthropicKey: '', model: DEFAULT_MODEL }
  }
}

export function saveSettings(storage: Pick<Storage, 'setItem'> | null, s: Settings) {
  try { storage?.setItem(SETTINGS_KEY, JSON.stringify(s)) } catch { /* blocked */ }
}
