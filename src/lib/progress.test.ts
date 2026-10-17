import { describe, expect, it } from 'vitest'
import { createLocalProgress } from './progress'
import type { Answers, GradeResult } from './types'

const memory = () => {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
}
const answers: Answers = { mc: [0], lq: [['1']] }
const result = (total: number, passed: boolean) => ({ mcScore: total, lqScore: 0, total, max: 50, passed }) as GradeResult
const spec = (seed: string, ids: string[] = ['a']) => ({ seed, mcIds: ids, lqIds: [] })

describe('progress store', () => {
  it('records attempts, tracks best score and pass status', () => {
    const p = createLocalProgress(memory())
    expect(p.isPassed('sp')).toBe(false)
    p.record('sp', spec('1'), answers, result(30, false))
    p.record('sp', spec('2'), answers, result(42, true))
    p.record('sp', spec('3'), answers, result(35, false))
    expect(p.attempts('sp')).toHaveLength(3)
    expect(p.best('sp')!.total).toBe(42)
    expect(p.isPassed('sp')).toBe(true) // a later failed retake never un-passes
    expect([...p.passedIds()]).toEqual(['sp'])
  })
  it('collects seen MC ids across attempts', () => {
    const p = createLocalProgress(memory())
    p.record('sp', spec('1', ['a', 'b']), answers, result(1, false))
    p.record('sp', spec('2', ['b', 'c']), answers, result(1, false))
    expect([...p.seenMcIds('sp')].sort()).toEqual(['a', 'b', 'c'])
  })
  it('survives a reload (new store over the same storage)', () => {
    const s = memory()
    const a = createLocalProgress(s)
    a.record('sp', spec('1'), answers, result(45, true))
    a.setDevMode(true)
    const b = createLocalProgress(s)
    expect(b.isPassed('sp')).toBe(true)
    expect(b.devMode()).toBe(true)
  })
  it('export then import round-trips into a fresh store', () => {
    const a = createLocalProgress(memory())
    a.record('sp', spec('1'), answers, result(45, true))
    const b = createLocalProgress(memory())
    b.importJson(a.exportJson())
    expect(b.attempts('sp')).toEqual(a.attempts('sp'))
  })
  it('rejects bad imports and keeps existing data', () => {
    const p = createLocalProgress(memory())
    p.record('sp', spec('1'), answers, result(45, true))
    for (const bad of ['not json', '{}', '{"version":2,"attempts":{}}', '{"version":1,"attempts":{"sp":[{"total":1}]}}'])
      expect(() => p.importJson(bad)).toThrow()
    expect(p.isPassed('sp')).toBe(true)
  })
  it('starts clean on corrupt storage or no storage at all', () => {
    expect(createLocalProgress({ getItem: () => '{broken', setItem: () => {} }).passedIds().size).toBe(0)
    expect(createLocalProgress(null).passedIds().size).toBe(0)
  })
})
