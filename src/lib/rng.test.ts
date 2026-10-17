import { describe, expect, it } from 'vitest'
import { makeRng } from './rng'

describe('makeRng', () => {
  it('is deterministic for a seed and differs across seeds', () => {
    const a = makeRng('s1'), b = makeRng('s1'), c = makeRng('s2')
    const xs = Array.from({ length: 10 }, () => a.next())
    expect(Array.from({ length: 10 }, () => b.next())).toEqual(xs)
    expect(Array.from({ length: 10 }, () => c.next())).not.toEqual(xs)
  })
  it('next() stays in [0,1) and int() stays in range and hits both ends', () => {
    const r = makeRng('range')
    const seen = new Set<number>()
    for (let i = 0; i < 5000; i++) {
      const u = r.next()
      expect(u).toBeGreaterThanOrEqual(0)
      expect(u).toBeLessThan(1)
      const k = r.int(3, 7)
      expect(k).toBeGreaterThanOrEqual(3)
      expect(k).toBeLessThanOrEqual(7)
      seen.add(k)
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6, 7])
  })
  it('int() is roughly uniform (chi-square against a loose bound)', () => {
    const r = makeRng('uniform'), n = 60000, counts = [0, 0, 0, 0, 0, 0]
    for (let i = 0; i < n; i++) counts[r.int(0, 5)]++
    const e = n / 6
    const chi2 = counts.reduce((s, c) => s + (c - e) ** 2 / e, 0)
    expect(chi2).toBeLessThan(20.5) // 99.9th percentile of chi-square with 5 df is 20.52
  })
  it('shuffle and sample return permutations / distinct subsets without mutating input', () => {
    const r = makeRng('shuf'), xs = [1, 2, 3, 4, 5, 6, 7, 8]
    const s = r.shuffle(xs)
    expect(xs).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect([...s].sort((p, q) => p - q)).toEqual(xs)
    const sub = r.sample(xs, 3)
    expect(new Set(sub).size).toBe(3)
  })
  it('fork streams are independent of draws on the parent', () => {
    const a = makeRng('p'), b = makeRng('p')
    a.next(); a.next()
    expect(a.fork('x').next()).toBe(b.fork('x').next())
  })
})
