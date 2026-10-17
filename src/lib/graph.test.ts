import { describe, expect, it } from 'vitest'
import { careers, domainOrder, topics } from '../data'
import { ancestors, buildGraph, careerProgress, careerSummary, descendants, layout, statusOf } from './graph'

const g = buildGraph(topics)

describe('graph on the real data', () => {
  it('has 72 topics and no cycle', () => expect(g.topics).toHaveLength(72))

  // Expected values were computed independently in Python while checking the source data.
  const expected: Record<string, [number, number]> = {
    qr: [21, 672], qt: [17, 534], dq: [18, 570], rmg: [16, 516],
    air: [19, 609], mle: [20, 651], ds: [18, 585], swe: [13, 426],
  }
  it.each(Object.entries(expected))('career %s: effective topics and hours', (id, [n, h]) => {
    const s = careerSummary(g, careers.find((c) => c.id === id)!)
    expect(s.topics).toBe(n)
    expect(s.hours).toBe(h)
  })

  it('sp sits at depth 3 with ancestors p2, p1, mvc, calc', () => {
    expect(g.depth.get('sp')).toBe(3)
    expect([...ancestors(g, 'sp')].sort()).toEqual(['calc', 'mvc', 'p1', 'p2'])
  })
  it('descendants of sp include time series and stochastic calculus', () => {
    const d = descendants(g, 'sp')
    for (const id of ['ts1', 'sc', 'rl', 'ms2']) expect(d.has(id)).toBe(true)
  })
  it('layout puts every topic in the column equal to its depth, with unique cells', () => {
    const pos = layout(g, domainOrder)
    const cells = new Set<string>()
    for (const t of topics) {
      const p = pos.get(t.id)!
      expect(p.col).toBe(g.depth.get(t.id))
      cells.add(`${p.col}:${p.row}`)
    }
    expect(cells.size).toBe(72)
  })
})

describe('buildGraph errors', () => {
  const t = (id: string, prerequisites: string[]) => ({ id, prerequisites, lectures: [] }) as never
  it('rejects unknown prerequisites', () => expect(() => buildGraph([t('a', ['zz'])])).toThrow(/unknown prerequisite/))
  it('rejects cycles', () => expect(() => buildGraph([t('a', ['b']), t('b', ['a'])])).toThrow(/cycle/))
})

describe('statusOf', () => {
  it('root topics are open, dependants are locked until all prerequisites are passed', () => {
    expect(statusOf(g, 'calc', new Set(), false)).toBe('open')
    expect(statusOf(g, 'p1', new Set(), false)).toBe('locked')
    expect(statusOf(g, 'p1', new Set(['calc']), false)).toBe('open')
    expect(statusOf(g, 'p2', new Set(['p1']), false)).toBe('locked') // needs mvc too
    expect(statusOf(g, 'p2', new Set(['p1', 'mvc']), false)).toBe('open')
  })
  it('passed beats everything; dev mode opens locked topics but keeps passed ones passed', () => {
    expect(statusOf(g, 'p2', new Set(['p2']), false)).toBe('passed')
    expect(statusOf(g, 'sp', new Set(), true)).toBe('open')
    expect(statusOf(g, 'sp', new Set(['sp']), true)).toBe('passed')
  })
  it('passing sp unlocks ts1 only once reg1 is also passed', () => {
    expect(statusOf(g, 'ts1', new Set(['sp']), false)).toBe('locked')
    expect(statusOf(g, 'ts1', new Set(['sp', 'reg1']), false)).toBe('open')
  })
})

describe('careerProgress', () => {
  const qr = careers.find((c) => c.id === 'qr')!
  it('is empty when nothing is passed', () => {
    const p = careerProgress(g, qr, new Set())
    expect(p.percent).toBe(0)
    expect(p.path).toEqual({ passed: 0, total: 21 })
    expect(p.required).toEqual({ passed: 0, total: qr.required.length })
    expect(p.hours).toEqual({ passed: 0, total: 672 })
  })
  it('counts passed topics and weights hours by lectures', () => {
    const p = careerProgress(g, qr, new Set(['calc', 'p3', 'zzz-not-on-path']))
    const h = (id: string) => g.byId.get(id)!.lectures.length * 3
    expect(p.path.passed).toBe(2)
    expect(p.required.passed).toBe(1)
    expect(p.hours.passed).toBe(h('calc') + h('p3'))
    expect(p.percent).toBe(Math.round((100 * (h('calc') + h('p3'))) / 672))
  })
  it('reaches 100% when the whole path is passed, bonus topics do not count', () => {
    const all = careerSummary(g, qr).ids
    const p = careerProgress(g, qr, new Set(all))
    expect(p.percent).toBe(100)
    expect(p.path.passed).toBe(p.path.total)
    expect(p.bonus.passed).toBe(qr.bonus.filter((b) => all.has(b)).length)
  })
  it('counts topics with a test via the hasTest callback', () => {
    expect(careerProgress(g, qr, new Set(), (id) => id === 'p3').testable).toBe(1)
  })
})
