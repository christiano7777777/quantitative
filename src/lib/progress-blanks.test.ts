import { describe, expect, it } from 'vitest'
import { createLocalProgress } from './progress'
import type { Answers, GradeResult, PaperSpec } from './types'

const mem = () => {
  const data: Record<string, string> = {}
  return { data, getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => { data[k] = v } }
}
const result = (total: number, passed: boolean): GradeResult => ({
  mcScore: 5, lqScore: total - 5, mcMax: 5, lqMax: 10, total, max: 15, passed, passMark: 12, failedSectionMin: [], mc: [], lq: [],
})

describe('progress with typed answers (no version bump)', () => {
  const spec: PaperSpec = { seed: 's', mcIds: ['latex-4-01', 'latex-4-02'], lqIds: ['latex-lq-4'] }
  const typedAnswers: Answers = { mc: [], blanks: ['\\toprule', 'l|rr % comment\n'], lq: [['\\begin{table}[htbp]', 'Model & Acc \\\\']] }

  it('records, exports and imports typed answers unchanged', () => {
    const a = createLocalProgress(mem())
    a.record('latex#L4', spec, typedAnswers, result(14, true))
    const b = createLocalProgress(mem())
    b.importJson(a.exportJson())
    expect(b.attempts('latex#L4')[0].answers).toEqual(typedAnswers)
    expect(b.isPassed('latex#L4')).toBe(true)
    expect(b.seenMcIds('latex#L4')).toEqual(new Set(spec.mcIds)) // "unseen first" works for typed banks too
  })

  it('still loads an existing progress file whose attempts have no typed answers', () => {
    const old = { version: 1, devMode: false, attempts: { np: [{ spec: { seed: 'x', mcIds: ['np-1'], lqIds: [] }, date: '2026-01-01T00:00:00Z', mcScore: 18, lqScore: 25, total: 43, max: 50, passed: true, answers: { mc: [1], lq: [['0.5']] } }] } }
    const s = mem()
    s.setItem('quantitative.progress.v1', JSON.stringify(old))
    const store = createLocalProgress(s)
    expect(store.isPassed('np')).toBe(true)
    expect(store.attempts('np')[0].answers.blanks).toBeUndefined()
    store.record('latex#L1', spec, typedAnswers, result(15, true))
    expect(JSON.parse(s.data['quantitative.progress.v1']).attempts.np).toEqual(old.attempts.np)
  })
})
