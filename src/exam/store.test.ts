import { describe, expect, it } from 'vitest'
import bay from '../../content/exams/bay.written.json'
import { createExamStore, loadSettings, saveSettings, scoreWritten, STATE_KEY, validateState } from './store'
import type { WrittenExam, WrittenMarking } from './types'

const exam = bay as unknown as WrittenExam
const memory = () => {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), raw: m }
}
const marking = (marks: number[]): WrittenMarking => ({
  questions: [{ id: 'q1', parts: exam.questions[0].parts.map((p, i) => ({ id: p.id, marks: marks[i], feedback: '' })) }],
})

describe('written drafts and attempts', () => {
  it('keeps a draft with its start time across reloads, then turns it into an attempt', () => {
    const mem = memory()
    const s = createExamStore(mem)
    expect(s.writtenDraft('bay')).toBeNull()
    const d = s.startWritten('bay')
    s.saveWrittenDraft('bay', { 'q1.a': 'hello' })
    const s2 = createExamStore(mem) // simulates a page reload
    expect(s2.writtenDraft('bay')).toMatchObject({ startedAt: d.startedAt, answers: { 'q1.a': 'hello' } })
    const a = s2.submitWritten('bay', exam, { 'q1.a': 'hello' })
    expect(s2.writtenDraft('bay')).toBeNull()
    expect(a).toMatchObject({ max: 20, startedAt: d.startedAt })
    expect(a.marks).toBeUndefined() // not marked yet, so no grade
    expect(s2.summary('bay').total).toBeNull()
  })

  it('records marks, percent and grade, and keeps several attempts with best/latest', () => {
    const s = createExamStore(memory())
    const a1 = s.submitWritten('bay', exam, {})
    s.markWritten('bay', a1.id, exam, marking([5, 5, 5, 2]), 'import') // 17/20 = 85%
    const a2 = s.submitWritten('bay', exam, {})
    s.markWritten('bay', a2.id, exam, marking([1, 1, 1, 1]), 'api') // 4/20 = 20%
    expect(s.writtenAttempts('bay').map((a) => [a.marks, a.percent, a.grade, a.markedBy])).toEqual([[17, 85, 'A', 'import'], [4, 20, 'F', 'api']])
    expect(s.summary('bay', { written: 1, coding: 0 }).total).toEqual({ percent: 85, grade: 'A' }) // best
    expect(s.summary('bay', { written: 1, coding: 0 }).written!.attemptId).toBe(a1.id)
  })

  it('needs both parts for a total on a normal topic', () => {
    const s = createExamStore(memory())
    const a = s.submitWritten('bay', exam, {})
    s.markWritten('bay', a.id, exam, marking([5, 5, 5, 5]), 'import')
    expect(s.summary('bay').total).toBeNull()
    s.recordCoding('bay', { results: [], marks: 5, max: 10, percent: 50 })
    expect(s.summary('bay').total!.percent).toBeCloseTo(0.7 * 100 + 0.3 * 50, 9) // 85
  })
})

describe('scoreWritten', () => {
  it('clamps to each part maximum and counts missing parts as 0', () => {
    expect(scoreWritten(exam, marking([5, 5, 5, 5]))).toBe(20)
    expect(scoreWritten(exam, marking([99, -3, 2, 0]))).toBe(7) // 5 + 0 + 2 + 0
    expect(scoreWritten(exam, { questions: [] })).toBe(0)
  })
})

describe('persistence and transfer', () => {
  it('round-trips through export and import, and refuses bad data without changing anything', () => {
    const s = createExamStore(memory())
    const a = s.submitWritten('bay', exam, { 'q1.a': 'x' })
    s.markWritten('bay', a.id, exam, marking([5, 5, 5, 5]), 'import')
    const dump = JSON.parse(JSON.stringify(s.exportState()))
    const t = createExamStore(memory())
    t.importState(dump)
    expect(t.writtenAttempts('bay')[0]).toMatchObject({ marks: 20, grade: 'A+' })
    expect(() => t.importState({ version: 2 })).toThrow(/not a Big Exam progress object/)
    expect(() => t.importState({ version: 1, written: { bay: 'oops' }, coding: {} })).toThrow(/must be a list/)
    expect(() => t.importState({ version: 1, written: { bay: [{}] }, coding: {} })).toThrow(/malformed/)
    expect(t.writtenAttempts('bay')).toHaveLength(1)
  })

  it('survives corrupt and blocked storage', () => {
    const mem = memory(); mem.raw.set(STATE_KEY, '{not json')
    expect(createExamStore(mem).writtenAttempts('bay')).toEqual([])
    const blocked = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('denied') } }
    const s = createExamStore(blocked)
    expect(() => s.submitWritten('bay', exam, {})).not.toThrow()
    expect(createExamStore(null).writtenAttempts('x')).toEqual([])
  })

  it('validateState accepts missing drafts', () => {
    expect(validateState({ version: 1, written: {}, coding: {} }).drafts).toEqual({ written: {}, coding: {} })
  })
})

describe('settings', () => {
  it('are stored apart from progress and default sensibly', () => {
    const mem = memory()
    expect(loadSettings(mem)).toEqual({ anthropicKey: '', model: 'claude-opus-5-5' })
    saveSettings(mem, { anthropicKey: 'sk-x', model: 'm' })
    expect(loadSettings(mem)).toEqual({ anthropicKey: 'sk-x', model: 'm' })
    const s = createExamStore(mem)
    expect(JSON.stringify(s.exportState())).not.toContain('sk-x')
    expect(loadSettings({ getItem: () => '{broken' })).toEqual({ anthropicKey: '', model: 'claude-opus-5-5' })
  })
})
