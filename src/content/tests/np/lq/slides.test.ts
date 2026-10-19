// Independent checks of the generators written from the HKU STAT3620 lecture notes (LQ-L to LQ-V). Every answer is
// recomputed by a DIFFERENT method from the generator's own:
//  L: sample sizes as the smallest n with n * ARE >= n_t, the AREs from the normal density by numerical integration
//     (Wilcoxon 12 (int f^2)^2, sign 4 f(0)^2); the minimal sign-test p-value and the smallest rejecting n in exact fractions.
//  M: exact binomial tails from Pascal's triangle in fractions; the two-sided p-value from the full pmf.
//  N: coverage of the order-statistic interval by enumerating all 2^n below/above patterns, and by simulating uniform
//     samples; the empirical-cdf interval recomputed from the counts.
//  O: U from the rank sum; the null mean and variance of U by enumerating every assignment; the Hodges-Lehmann estimate
//     and k-th smallest difference through counting properties.
//  P: Siegel-Tukey scores against the worked example of the notes, their sum and null mean; Ansari-Bradley ranks as
//     min(#<=, #>=); the permutation p-value by recursive enumeration of all choices.
//  Q: mid-ranks by counting; the tie-adjusted statistic as SSB / sample variance of the ranks (ANOVA on ranks); the
//     permutation count as a ratio of factorials.
//  R: the null mean and variance of JT by enumerating every assignment of the observed values to the groups.
//  S: ranks by sorting; Friedman as a sum of squared deviations of rank sums; E(PG) by enumerating every arrangement.
//  T: the standard error by the one-pass formula; the basic interval through residuals; order statistics by a descending sort.
//  U: the BCa arguments in exact fractions; the studentised interval end points from sorted replicates.
//  V: least squares by solving the normal equations in exact fractions; the maximum-containing probability by enumerating all resamples.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import { F, Fr, solveFr } from '../../../shared/fraction'
import * as L from './l-intro'
import * as M from './m-sign'
import * as N from './n-cicdf'
import * as O from './o-hl'
import * as P from './p-scale'
import * as Q from './q-kw'
import * as R from './r-mult'
import * as S from './s-block'
import * as T from './t-bootci'
import * as U from './u-pivotal'
import * as V from './v-bootreg'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const close = (got: number, want: number, tol = 1e-9, what = '') => expect(Math.abs(got - want), `${what}: got ${got}, want ${want}`).toBeLessThan(tol)
const simpson = (f: (x: number) => number, a: number, b: number, n = 20000) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3 }
const phi = (x: number) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI)
const frac = (x: number) => { const d = 10000; return F(Math.round(x * d), d) }

/** Pascal's triangle row n as bigints */
const pascal = (n: number): bigint[] => { let row = [1n]; for (let i = 0; i < n; i++) row = [...row.map((v, j) => v + (row[j - 1] ?? 0n)), 1n]; return row }
const binomTail = (n: number, k: number, p: Fr): Fr => {
  const row = pascal(n)
  let s = F(0)
  for (let j = k; j <= n; j++) {
    let t = new Fr(row[j])
    for (let i = 0; i < j; i++) t = t.mul(p)
    for (let i = 0; i < n - j; i++) t = t.mul(F(1).sub(p))
    s = s.add(t)
  }
  return s
}
/** all ways to choose m of N positions, as index arrays */
const combos = (N: number, m: number): number[][] => {
  const out: number[][] = []
  const rec = (start: number, cur: number[]) => { if (cur.length === m) { out.push([...cur]); return } for (let i = start; i < N; i++) rec(i + 1, [...cur, i]) }
  rec(0, [])
  return out
}

describe('generator L against independent computation', () => {
  it('efficiency sample sizes and the sign-test p-value limits (300 seeds)', () => {
    const areW = 12 * simpson((x) => phi(x) ** 2, -8, 8) ** 2 // sigma = 1
    const areSign = 4 * phi(0) ** 2
    close(areW, 3 / Math.PI, 1e-6, 'ARE Wilcoxon')
    close(areSign, 2 / Math.PI, 1e-9, 'ARE sign')
    const areLaplace = 4 * 2 * 0.5 ** 2 // variance 2, f(0) = 1/2
    const smallest = (nt: number, e: number) => { let n = 1; while (n * e < nt - 1e-9) n++; return n }
    const alphas: Record<string, [number, number]> = { '0.1': [1, 10], '0.05': [1, 20], '0.02': [1, 50], '0.01': [1, 100] }
    for (const s of seeds('L', 300)) {
      const P0 = L.sample(makeRng(s))
      const ans = L.build(P0).parts.map((p) => p.answer)
      expect(ans[0], s).toBe(smallest(P0.nt, areW))
      expect(ans[1], s).toBe(smallest(P0.nt, areSign))
      expect(ans[2], s).toBe(smallest(P0.nt, areLaplace))
      const row = pascal(P0.ns)
      close(ans[3], new Fr(row[0] + row[P0.ns], 2n ** BigInt(P0.ns)).num, 1e-12, `${s} min p`)
      const [an, ad] = alphas[String(P0.alpha)]
      let n = 1
      while (new Fr(2n, 2n ** BigInt(n)).cmp(F(an, ad)) > 0) n++
      expect(ans[4], s).toBe(n)
    }
  })
})

describe('generator M against independent computation', () => {
  it('counts, exact one- and two-sided p-values, probability under an alternative (300 seeds)', () => {
    const p1s: Record<string, Fr> = { '0.6': F(3, 5), '0.7': F(7, 10), '0.75': F(3, 4), '0.8': F(4, 5) }
    for (const s of seeds('M', 300)) {
      const P0 = M.sample(makeRng(s))
      const ans = M.build(P0).parts.map((p) => p.answer)
      const kept = P0.x.filter((v) => v !== P0.m0)
      const n = kept.length, k = kept.filter((v) => v > P0.m0).length
      expect(ans[0]).toBe(n)
      expect(ans[1]).toBe(k)
      const up = binomTail(n, k, F(1, 2))
      close(ans[2], up.num, 1e-12, `${s} one-sided`)
      const low = F(1).sub(binomTail(n, k + 1, F(1, 2))) // P(B <= k)
      const two = F(2).mul(up.cmp(low) < 0 ? up : low)
      close(ans[3], Math.min(1, two.num), 1e-12, `${s} two-sided`)
      close(ans[4], binomTail(n, k, p1s[String(P0.p1)]).num, 1e-12, `${s} alternative`)
    }
  })
})

describe('generator N against independent computation', () => {
  it('order-statistic coverage by enumeration and simulation, empirical-cdf interval (300 seeds)', () => {
    for (const s of seeds('N', 300)) {
      const P0 = N.sample(makeRng(s))
      const ans = N.build(P0).parts.map((p) => p.answer)
      const { n, r } = P0
      const coverage = (rr: number) => { let c = 0; for (let m = 0; m < 1 << n; m++) { let j = 0; for (let i = 0; i < n; i++) if (m & (1 << i)) j++; if (j >= rr && j <= n - rr) c++ } return c / 2 ** n }
      close(ans[0], coverage(r), 1e-12, `${s} coverage`)
      let best = 0
      for (let k = 1; k <= n / 2; k++) if (coverage(k) >= 0.95 - 1e-12) best = k
      expect(ans[1], s).toBe(best)
      const f = P0.c / P0.m
      close(ans[2], f, 1e-12)
      close(ans[3], Math.sqrt((f * (1 - f)) / P0.m), 1e-12)
      close(ans[4], f + 1.96 * Math.sqrt((f * (1 - f)) / P0.m), 1e-12)
    }
    // simulation: median of a continuous distribution is 0.5 for the uniform
    for (const s of seeds('Nsim', 8)) {
      const P0 = N.sample(makeRng(s))
      const rng = makeRng('mc-' + s)
      let hit = 0
      const reps = 30000
      for (let t = 0; t < reps; t++) {
        const xs = Array.from({ length: P0.n }, () => rng.next()).sort((a, b) => a - b)
        if (xs[P0.r - 1] < 0.5 && 0.5 < xs[P0.n - P0.r]) hit++
      }
      close(N.build(P0).parts[0].answer, hit / reps, 0.012, `${s} simulated coverage`)
    }
  })
})

describe('generator O against independent computation', () => {
  it('U by ranks, null moments by enumeration, Hodges-Lehmann and difference properties (300 seeds)', () => {
    for (const s of seeds('O', 300)) {
      const P0 = O.sample(makeRng(s))
      const ans = O.build(P0).parts.map((p) => p.answer)
      const { x, y, k } = P0
      const m = x.length, n = y.length, N0 = m + n
      const all = [...x, ...y]
      const rank = (v: number) => all.filter((w) => w < v).length + 1
      const W = x.reduce((a, v) => a + rank(v), 0)
      const U1 = W - (m * (m + 1)) / 2
      expect(ans[0]).toBe(U1)
      // null mean and variance of U over all assignments of the N0 ranks
      const us = combos(N0, m).map((c) => c.reduce((a, i) => a + (i + 1), 0) - (m * (m + 1)) / 2)
      const mu = us.reduce((a, b) => a + b, 0) / us.length
      const va = us.reduce((a, b) => a + (b - mu) ** 2, 0) / us.length
      close(mu, (m * n) / 2, 1e-9)
      close(ans[1], (U1 - mu) / Math.sqrt(va), 1e-9, `${s} z`)
      const diffs: number[] = []
      for (const a of x) for (const b of y) diffs.push(a - b)
      const hl = ans[2]
      expect(diffs.filter((d) => d < hl).length).toBeLessThanOrEqual(diffs.length / 2)
      expect(diffs.filter((d) => d > hl).length).toBeLessThanOrEqual(diffs.length / 2)
      const dk = ans[3]
      expect(diffs.filter((d) => d < dk).length).toBeLessThanOrEqual(k - 1)
      expect(diffs.filter((d) => d <= dk).length).toBeGreaterThanOrEqual(k)
      close(ans[4], diffs.filter((d) => d > 0).length / (m * n), 1e-12)
    }
  })
})

describe('generator P against independent computation', () => {
  it('Siegel-Tukey scores match the notes, Ansari-Bradley by counting, permutation p-value by enumeration (300 seeds)', () => {
    expect(P.siegelTukey(6)).toEqual([1, 4, 5, 6, 3, 2]) // the worked example in the notes
    for (const N0 of [5, 6, 7, 8]) {
      const sc = P.siegelTukey(N0)
      expect([...sc].sort((a, b) => a - b)).toEqual(Array.from({ length: N0 }, (_, i) => i + 1))
    }
    for (const s of seeds('P', 300)) {
      const P0 = P.sample(makeRng(s))
      const ans = P.build(P0).parts.map((p) => p.answer)
      const { x, y } = P0
      const m = x.length, N0 = m + y.length
      const sorted = [...x, ...y].sort((a, b) => a - b)
      const st = P.siegelTukey(N0)
      const wST = x.reduce((a, v) => a + st[sorted.indexOf(v)], 0)
      expect(ans[0]).toBe(wST)
      const wAB = x.reduce((a, v) => a + Math.min(sorted.filter((w) => w <= v).length, sorted.filter((w) => w >= v).length), 0)
      expect(ans[1]).toBe(wAB)
      const med = (a: number[]) => { const t = [...a].sort((p, q) => p - q); return t.length % 2 ? t[(t.length - 1) / 2] : (t[t.length / 2 - 1] + t[t.length / 2]) / 2 }
      const dev = (a: number[]) => { const c = med(a); return a.map((v) => Math.abs(v - c)).reduce((p, q) => p + q, 0) / a.length }
      close(ans[2], dev(x) / dev(y), 1e-12, `${s} RMD`)
      const all = combos(N0, m)
      expect(ans[3]).toBe(all.length)
      const rs = all.map((c) => c.reduce((a, i) => a + st[i], 0))
      close(rs.reduce((a, b) => a + b, 0) / rs.length, (m * (N0 + 1)) / 2, 1e-9) // null mean
      close(ans[4], rs.filter((w) => w <= wST).length / rs.length, 1e-12, `${s} p`)
    }
  })
})

describe('generator Q against independent computation', () => {
  it('mid-ranks, KW, tie correction, ANOVA-on-ranks identity, permutation count (300 seeds)', () => {
    for (const s of seeds('Q', 300)) {
      const P0 = Q.sample(makeRng(s))
      const ans = Q.build(P0).parts.map((p) => p.answer)
      const g = P0.g
      const all = g.flat(), N0 = all.length
      const sizes = g.map((a) => a.length)
      const mid = (v: number) => all.filter((w) => w < v).length + (all.filter((w) => w === v).length + 1) / 2
      let at = 0
      const groupRanks = sizes.map((sz) => { const r = all.slice(at, at + sz).map(mid); at += sz; return r })
      close(ans[0], groupRanks[0].reduce((a, b) => a + b, 0), 1e-12, `${s} rank sum`)
      const meanRank = (N0 + 1) / 2
      const ssb = groupRanks.reduce((a, r) => a + r.length * (r.reduce((p, q) => p + q, 0) / r.length - meanRank) ** 2, 0)
      close(ans[1], (12 / (N0 * (N0 + 1))) * ssb, 1e-9, `${s} KW`)
      const ranks = all.map(mid)
      const s2 = ranks.reduce((a, r) => a + (r - meanRank) ** 2, 0) / (N0 - 1)
      close(ans[3], ssb / s2, 1e-9, `${s} KW with ties as SSB / s^2`)
      close(ans[2], ans[1] / ans[3], 1e-9, `${s} correction`)
      const fact = (n: number) => { let f = 1n; for (let i = 2; i <= n; i++) f *= BigInt(i); return f }
      expect(ans[4]).toBe(Number(fact(N0) / sizes.reduce((a, sz) => a * fact(sz), 1n)))
    }
  })
})

describe('generator R against independent computation', () => {
  it('pair counts, Bonferroni, JT with its null moments by enumerating all assignments (60 seeds)', () => {
    for (const s of seeds('R', 60)) {
      const P0 = R.sample(makeRng(s))
      const ans = R.build(P0).parts.map((p) => p.answer)
      const { g, kc, alpha } = P0
      let pairs = 0
      for (let i = 0; i < kc; i++) for (let j = i + 1; j < kc; j++) pairs++
      expect(ans[0]).toBe(pairs)
      close(ans[1], alpha / pairs, 1e-12)
      const sizes = g.map((a) => a.length)
      const all = g.flat(), N0 = all.length
      const labelOf = (assign: number[]) => assign // assign[i] = group of observation i
      const jt = (assign: number[]) => { let c = 0; for (let a = 0; a < N0; a++) for (let b = 0; b < N0; b++) if (assign[a] < assign[b] && all[a] < all[b]) c++; return c }
      const base: number[] = []
      sizes.forEach((sz, j) => { for (let t = 0; t < sz; t++) base.push(j) })
      expect(ans[2]).toBe(jt(labelOf(base)))
      // all distinct arrangements of the labels
      const seen = new Set<string>()
      const vals: number[] = []
      const rec = (cur: number[], left: number[]) => {
        if (cur.length === N0) { vals.push(jt(cur)); return }
        for (let j = 0; j < left.length; j++) if (left[j] > 0) { left[j]--; rec([...cur, j], left); left[j]++ }
      }
      rec([], [...sizes])
      void seen
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length
      const va = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length
      close(ans[3], mean, 1e-9, `${s} E(JT)`)
      close(ans[4], (ans[2] - mean) / Math.sqrt(va), 1e-9, `${s} z`)
    }
  })
})

describe('generator S against independent computation', () => {
  it('rank sums, Friedman, Page mean by enumeration, Kendall W (300 seeds)', () => {
    for (const s of seeds('S', 300)) {
      const P0 = S.sample(makeRng(s))
      const ans = S.build(P0).parts.map((p) => p.answer)
      const { data, focus } = P0
      const b = data.length, k = 3
      const ranks = data.map((row) => { const idx = row.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]); const r = new Array<number>(k); idx.forEach(([, i], pos) => { r[i] = pos + 1 }); return r })
      const Rp = [0, 1, 2].map((i) => ranks.reduce((a, r) => a + r[i], 0))
      expect(ans[0]).toBe(Rp[focus - 1])
      const mean = (b * (k + 1)) / 2
      const ssr = Rp.reduce((a, r) => a + (r - mean) ** 2, 0)
      close(ans[1], (12 / (b * k * (k + 1))) * ssr, 1e-9, `${s} Friedman`)
      expect(ans[2]).toBe(Rp[0] + 2 * Rp[1] + 3 * Rp[2])
      // E(PG): average over all (3!)^b arrangements of within-block ranks
      const perms = [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]
      let total = 0
      const count = perms.length ** b
      for (let code = 0; code < count; code++) {
        let c = code
        const sums = [0, 0, 0]
        for (let j = 0; j < b; j++) { const p = perms[c % 6]; c = Math.floor(c / 6); for (let i = 0; i < 3; i++) sums[i] += p[i] }
        total += sums[0] + 2 * sums[1] + 3 * sums[2]
      }
      close(ans[3], total / count, 1e-9, `${s} E(PG)`)
      close(ans[4], (12 * ssr) / (b * b * k * (k * k - 1)), 1e-9, `${s} W`)
    }
  })
})

describe('generator T against independent computation', () => {
  it('standard error, bias, normal, percentile and basic intervals (300 seeds)', () => {
    for (const s of seeds('T', 300)) {
      const P0 = T.sample(makeRng(s))
      const ans = T.build(P0).parts.map((p) => p.answer)
      const { theta, reps } = P0
      const B = reps.length
      const sum = reps.reduce((a, b) => a + b, 0), sumsq = reps.reduce((a, b) => a + b * b, 0)
      const se = Math.sqrt((sumsq - (sum * sum) / B) / (B - 1))
      close(ans[0], se, 1e-9, `${s} SE`)
      close(ans[1], sum / B - theta, 1e-9)
      close(ans[2], theta - 1.645 * se, 1e-9)
      const desc = [...reps].sort((a, b) => b - a)
      close(ans[3], desc[0], 1e-12)
      const resid = reps.map((v) => v - theta).sort((a, b) => a - b)
      close(ans[4], theta - resid[B - 1], 1e-9, `${s} basic interval`)
    }
  })
})

describe('generator U against independent computation', () => {
  it('standard error, bootstrap-t ends, BCa arguments in exact fractions (300 seeds)', () => {
    for (const s of seeds('U', 300)) {
      const P0 = U.sample(makeRng(s))
      const ans = U.build(P0).parts.map((p) => p.answer)
      const { x, ts, z0, a } = P0
      const n = x.length
      const mean = x.reduce((p, q) => p + q, 0) / n
      const ss = x.reduce((p, q) => p + q * q, 0) - n * mean * mean
      const se = Math.sqrt(ss / (n - 1)) / Math.sqrt(n)
      close(ans[0], se, 1e-9, `${s} SE`)
      const asc = [...ts].sort((p, q) => p - q)
      close(ans[1], mean - asc[asc.length - 1] * se, 1e-9)
      close(ans[2], mean - asc[0] * se, 1e-9)
      const Z0 = frac(z0), A = frac(a), Z = F(329, 200)
      const w1 = Z0.add(Z), w2 = Z0.sub(Z)
      close(ans[3], Z0.add(w1.div(F(1).sub(A.mul(w1)))).num, 1e-9, `${s} upper argument`)
      close(ans[4], Z0.add(w2.div(F(1).sub(A.mul(w2)))).num, 1e-9, `${s} lower argument`)
    }
  })
})

describe('generator V against independent computation', () => {
  it('slope and residual by exact normal equations, paired resample slope, p-value, maximum probability (300 seeds)', () => {
    const fit = (x: number[], y: number[]) => {
      const n = x.length
      const sx = x.reduce((a, b) => a + b, 0), sxx = x.reduce((a, b) => a + b * b, 0)
      const sy = y.reduce((a, b) => a + b, 0), sxy = x.reduce((a, b, i) => a + b * y[i], 0)
      const [b0, b1] = solveFr([[F(n), F(sx)], [F(sx), F(sxx)]], [F(sy), F(sxy)])
      return { b0, b1 }
    }
    for (const s of seeds('V', 300)) {
      const P0 = V.sample(makeRng(s))
      const ans = V.build(P0).parts.map((p) => p.answer)
      const { x, y, pick, stat, reps, nmax } = P0
      const { b0, b1 } = fit(x, y)
      close(ans[0], b1.num, 1e-9, `${s} slope`)
      close(ans[1], F(y[0]).sub(b0).sub(b1.mul(F(x[0]))).num, 1e-9, `${s} residual`)
      close(ans[2], fit(pick.map((i) => x[i]), pick.map((i) => y[i])).b1.num, 1e-9, `${s} paired slope`)
      close(ans[3], (1 + reps.filter((r) => r >= stat).length) / (reps.length + 1), 1e-12)
      // probability that a resample of size n from n distinct values contains the maximum (index n-1), by enumeration
      let withMax = 0
      const total = nmax ** nmax
      for (let code = 0; code < total; code++) { let c = code, has = false; for (let i = 0; i < nmax; i++) { if (c % nmax === nmax - 1) has = true; c = Math.floor(c / nmax) } if (has) withMax++ }
      close(ans[4], withMax / total, 1e-12, `${s} maximum`)
    }
  })
})
