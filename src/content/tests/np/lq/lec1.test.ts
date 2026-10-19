// Independent check of the single question of STAT3620 lecture 1 (generator W). Every answer is recomputed by a method that differs
// from the generator's own:
//  - binomial probabilities as exact fractions from Pascal's triangle (the generator multiplies floating-point factors),
//  - the two-sided p-value as twice the smaller of the two tails, both computed (the generator relies on B being above n0/2),
//  - the interval coverage as a sum of binomial terms over the counts that make the interval cover (the generator uses 1 - 2 P(Bin <= r-1)),
//    and as a fixed-seed simulation of uniform samples,
//  - the cdf limit from the raw data.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import { F, Fr, fpow } from '../../../shared/fraction'
import * as W from './w-signci'

const seeds = (n: number) => Array.from({ length: n }, (_, i) => `W${i}`)
const close = (got: number, want: number, tol = 1e-9, what = '') => expect(Math.abs(got - want), `${what}: got ${got}, want ${want}`).toBeLessThan(tol)

/** Row n of Pascal's triangle as BigInt. */
function pascal(n: number): bigint[] {
  let row = [1n]
  for (let i = 0; i < n; i++) row = Array.from({ length: row.length + 1 }, (_, j) => (row[j - 1] ?? 0n) + (row[j] ?? 0n))
  return row
}
/** P(Bin(n, p) in [lo, hi]) with p an exact fraction. */
function binomRange(n: number, p: Fr, lo: number, hi: number): Fr {
  const row = pascal(n)
  let s = F(0)
  for (let j = Math.max(lo, 0); j <= Math.min(hi, n); j++) {
    s = s.add(new Fr(row[j]).mul(fpow(p, j)).mul(fpow(F(1).sub(p), n - j)))
  }
  return s
}
const half = F(1, 2)

describe('generator W (the single question of lecture 1) against independent computation', () => {
  it('counts, exact p-values, coverage and cdf limit (300 seeds)', () => {
    for (const s of seeds(300)) {
      const P = W.sample(makeRng(s))
      const ans = W.build(P).parts.map((p) => p.answer)
      const { m0, x, r, x0 } = P
      const n = x.length
      let nn = 0
      let k = 0
      for (const v of x) { if (v !== m0) nn++; if (v > m0) k++ }
      expect(ans[0]).toBe(nn)
      expect(ans[1]).toBe(k)
      const up = binomRange(nn, half, k, nn)
      const low = binomRange(nn, half, 0, k)
      close(ans[2], up.num, 1e-12, `${s} one-sided`)
      const smaller = up.cmp(low) <= 0 ? up : low
      const two = F(2).mul(smaller)
      close(ans[3], two.cmp(F(1)) > 0 ? 1 : two.num, 1e-12, `${s} two-sided`)
      // the interval (X_(r), X_(n+1-r)) contains the median iff the number of observations below it lies in [r, n-r]
      close(ans[4], binomRange(n, half, r, n - r).num, 1e-12, `${s} coverage`)
      const c = x.filter((v) => v <= x0).length
      const f = new Fr(BigInt(c), BigInt(n)).num
      close(ans[5], f + 1.96 * Math.sqrt((f * (1 - f)) / n), 1e-12, `${s} cdf limit`)
      // properties the generator promises
      const ties = n - nn
      expect(ties, `${s} ties`).toBeGreaterThanOrEqual(1)
      expect(ties).toBeLessThanOrEqual(2)
      expect(k, `${s} majority above`).toBeGreaterThan(nn / 2)
      expect(k).toBeLessThan(nn)
      expect(c).toBeGreaterThanOrEqual(2)
      expect(c).toBeLessThanOrEqual(n - 2)
      expect(ans[5]).toBeLessThan(1)
    }
  })

  it('the order-statistic interval covers the median with the stated probability (fixed-seed simulation)', () => {
    // mulberry32, so the simulation does not depend on the app's own generator
    let a = 20261019
    const u = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
    for (const [n, r] of [[12, 3], [13, 2]] as const) {
      let hit = 0
      const reps = 40000
      for (let i = 0; i < reps; i++) {
        const s = Array.from({ length: n }, u).sort((p, q) => p - q)
        if (s[r - 1] < 0.5 && 0.5 < s[n - r]) hit++
      }
      const exact = binomRange(n, half, r, n - r).num
      expect(Math.abs(hit / reps - exact), `n=${n} r=${r}`).toBeLessThan(0.01)
    }
  })

  it('the sign statistic: a p-value of 1/2^n0 summed over all outcomes is 1 (sanity of the binomial helper)', () => {
    for (const m of [9, 10, 11, 12]) expect(binomRange(m, half, 0, m).cmp(F(1))).toBe(0)
  })
})
