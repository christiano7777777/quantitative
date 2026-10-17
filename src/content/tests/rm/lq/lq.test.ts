// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: Cohen's d from exact fractions, a search for the sample size, Monte Carlo of the family-wise error.
//  B: exact fractions; the number of folds by simulating the walk; purge counted by listing overlapping observations.
//  C: exact fractions throughout.
//  D: exact fractions; the drawdown by scanning every peak and later trough; the downside deviation from the sorted losses.
//  E: Monte Carlo of the Sharpe standard error and of the AR(1) effective sample size.
//  F: exact fractions; AIC and BIC via their definitions; adjusted R squared through residual and total variance.
//  G: counts and averages recomputed from the table.
//  H: the congruential generator iterated, and by the closed form in BigInt; Monte Carlo that the expected maximum of N normals is below sqrt(2 ln N).
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { F } from '../../../shared/fraction'
import * as A from './a-hypotheses'
import * as B from './b-splits'
import * as C from './c-backtest'
import * as D from './d-metrics'
import * as E from './e-significance'
import * as Fc from './f-comparison'
import * as G from './g-robustness'
import * as H from './h-reporting'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const rel = (got: number, want: number, r: number) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(r * Math.abs(want))
const lectures = topics.find((t) => t.id === 'rm')!.lectures.length
const gauss = (rng: ReturnType<typeof makeRng>) => Math.sqrt(-2 * Math.log(1 - rng.next())) * Math.cos(2 * Math.PI * rng.next())

const gens: [string, LQGenerator, number][] = [
  ['A', { id: 'A', generate: (r) => A.build(A.sample(r)) }, 5],
  ['B', { id: 'B', generate: (r) => B.build(B.sample(r)) }, 5],
  ['C', { id: 'C', generate: (r) => C.build(C.sample(r)) }, 5],
  ['D', { id: 'D', generate: (r) => D.build(D.sample(r)) }, 5],
  ['E', { id: 'E', generate: (r) => E.build(E.sample(r)) }, 5],
  ['F', { id: 'F', generate: (r) => Fc.build(Fc.sample(r)) }, 5],
  ['G', { id: 'G', generate: (r) => G.build(G.sample(r)) }, 5],
  ['H', { id: 'H', generate: (r) => H.build(H.sample(r)) }, 5],
]

describe.each(gens)('generator %s: generic rules', (name, gen, nParts) => {
  it('has the expected number of parts and well-formed text and answers (300 seeds)', () => {
    for (const s of seeds(name, 300)) {
      const inst = gen.generate(makeRng(s))
      expect(inst.parts, s).toHaveLength(nParts)
      for (const text of [inst.intro, ...inst.parts.flatMap((p) => [p.prompt, p.explanation])]) {
        expect(text, s).not.toMatch(/NaN|undefined|Infinity|\[object/)
        expect(/[\u0000-\u001f\u007f]/.test(text), `${s}: control character in ${JSON.stringify(text)}`).toBe(false)
        expect((text.match(/\$/g) ?? []).length % 2, `${s}: ${text}`).toBe(0)
      }
      for (const p of inst.parts) {
        expect(Number.isFinite(p.answer), s).toBe(true)
        expect(p.lecture).toBeGreaterThanOrEqual(1)
        expect(p.lecture).toBeLessThanOrEqual(lectures)
        expect(p.tolerance?.abs).toBeGreaterThan(0)
      }
    }
  })
  it('is deterministic per seed and varies across seeds', () => {
    expect(JSON.stringify(gen.generate(makeRng('x')))).toBe(JSON.stringify(gen.generate(makeRng('x'))))
    const text = (s: string) => { const i = gen.generate(makeRng(s)); return i.intro + i.parts.map((p) => p.prompt).join('|') }
    expect(new Set(seeds(name, 100).map(text)).size).toBeGreaterThan(15)
  })
})

it('the LQ bank touches all lectures', () => {
  const seen = new Set<number>()
  for (const [name, gen] of gens) for (const s of seeds(name, 20)) gen.generate(makeRng(s)).parts.forEach((p) => seen.add(p.lecture))
  expect([...seen].sort((a, b) => a - b)).toEqual(Array.from({ length: lectures }, (_, i) => i + 1))
})

// ---------- A ----------
describe('generator A against independent computation', () => {
  it('Cohen d exactly, the sample size by search, multiple-testing formulas (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      const v1 = F(Math.round(p.s1 * 10) ** 2, 100), v0 = F(Math.round(p.s0 * 10) ** 2, 100)
      const sp2 = v1.add(v0).div(F(2))
      const diff = F(Math.round(p.m1 * 10) - Math.round(p.m0 * 10), 10)
      const d = diff.num / Math.sqrt(sp2.num)
      close(ans[0], d, 1e-12)
      // smallest n with d sqrt(n/2) >= 1.96 + 0.84
      let n = 1
      while (d * Math.sqrt(n / 2) < 2.8) n++
      expect(ans[1]).toBe(n)
      close(ans[2], 1 - Math.pow(1 - p.alpha, p.N), 1e-12)
      close(ans[3], p.alpha / p.N, 1e-12)
      close(ans[4], p.N * p.alpha, 1e-12)
    }
  })
  it('Monte Carlo: the chance of at least one false positive among N tests (3 seeds)', () => {
    for (const s of seeds('A', 3)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      const rng = makeRng('sim' + s)
      let hit = 0
      const runs = 200000
      for (let r = 0; r < runs; r++) { for (let i = 0; i < p.N; i++) if (rng.next() < p.alpha) { hit++; break } }
      close(ans[2], hit / runs, 0.006)
    }
  }, 60000)
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  it('exact survivorship arithmetic, folds by simulating the walk, purge by listing overlaps (300 seeds)', () => {
    for (const s of seeds('B', 300)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      const all = F(p.surv, 100).mul(F(p.rs, 10)).add(F(100 - p.surv, 100).mul(F(p.rd, 10)))
      close(ans[0], all.num, 1e-9)
      close(ans[1], F(p.rs, 10).sub(all).num, 1e-9)
      // simulate walk-forward: a fold exists while the test window fits inside the data
      let folds = 0, trainEnd = p.train
      while (trainEnd + p.test <= p.T) { folds++; trainEnd += p.test }
      expect(ans[2]).toBe(folds)
      expect(ans[3]).toBe(p.train + (p.k - 1) * p.test)
      // purge: observation i (label covers days i+1..i+h) overlaps a test starting at day s0 if i+h >= s0
      const s0 = 100
      const overlapping = Array.from({ length: s0 - 1 }, (_, i) => i + 1).filter((i) => i + p.h >= s0 + 1 - 1 && i < s0).length
      expect(ans[4]).toBe(overlapping + p.emb - (overlapping - p.h))
      expect(overlapping).toBe(p.h)
      expect(p.T - p.train).toBeGreaterThanOrEqual(p.test * 3)
    }
  })
})

// ---------- C ----------
describe('generator C against independent computation', () => {
  it('exact costs, net returns, break-even and capacity (300 seeds)', () => {
    for (const s of seeds('C', 300)) {
      const p = C.sample(makeRng(s))
      const ans = answers(C.build(p))
      const turn = p.turn.reduce((a, v) => a.add(F(v, 100)), F(0))
      const cost = F(p.cost).mul(turn)
      close(ans[0], cost.num, 1e-9)
      const gross = p.gross.reduce((a, v) => a.add(F(v)), F(0))
      const net = gross.sub(cost).div(F(5))
      close(ans[1], net.num, 1e-9)
      close(ans[2], net.mul(F(252)).div(F(100)).num, 1e-9)
      close(ans[3], gross.div(turn).num, 1e-9)
      close(ans[4], F(p.part, 100).mul(F(p.adv)).div(turn.div(F(5))).num, 1e-9)
    }
  })
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('exact Sharpe pieces, drawdown by scanning all peak-trough pairs, downside deviation by sorting (300 seeds)', () => {
    for (const s of seeds('D', 300)) {
      const p = D.sample(makeRng(s))
      const ans = answers(D.build(p))
      const R = p.r.map((v) => F(v, 100)), B = p.b.map((v) => F(v, 100))
      const meanF = (a: typeof R) => a.reduce((x, y) => x.add(y), F(0)).div(F(a.length))
      const varF = (a: typeof R) => { const m = meanF(a); return a.reduce((x, y) => x.add(y.sub(m).mul(y.sub(m))), F(0)).div(F(a.length - 1)) }
      close(ans[0], (meanF(R).num / Math.sqrt(varF(R).num)) * Math.sqrt(12), 1e-9)
      // wealth path and every (i < j) pair
      const w = [F(1)]
      for (const x of R) w.push(w[w.length - 1].mul(F(1).add(x)))
      let mdd = 0
      for (let i = 0; i < w.length; i++) for (let j = i + 1; j < w.length; j++) mdd = Math.max(mdd, 1 - w[j].num / w[i].num)
      close(ans[1], mdd, 1e-9)
      const neg = R.filter((x) => x.num < 0).sort((a, b) => a.num - b.num)
      const dd = Math.sqrt(neg.reduce((a, x) => a + x.num * x.num, 0) / R.length)
      close(ans[2], (meanF(R).num / dd) * Math.sqrt(12), 1e-9)
      const act = R.map((x, i) => x.sub(B[i]))
      close(ans[3], (meanF(act).num / Math.sqrt(varF(act).num)) * Math.sqrt(12), 1e-9)
      close(ans[4], w[w.length - 1].sub(F(1)).num, 1e-9)
    }
  })
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  it('closed forms recomputed (300 seeds)', () => {
    for (const s of seeds('E', 300)) {
      const p = E.sample(makeRng(s))
      const ans = answers(E.build(p))
      close(ans[0], p.sr * Math.sqrt(p.years), 1e-12)
      close(ans[2], p.sr - 1.96 * ans[1], 1e-12)
      close(ans[3], 4 / (p.sr * p.sr), 1e-12)
      close(ans[4], (p.T * (1 - p.rho)) / (1 + p.rho), 1e-12)
    }
  })
  it('Monte Carlo: the standard error of an estimated Sharpe ratio (3 settings)', () => {
    for (const [sr, years] of [[0.5, 4], [1, 4], [1.5, 6]] as const) {
      const ans = answers(E.build({ sr, years, T: 60, rho: 0.2 }))
      const rng = makeRng(`sr${sr}${years}`)
      const n = years * 12 // monthly observations
      const mu = sr / Math.sqrt(12) // monthly mean with unit monthly volatility
      const est: number[] = []
      for (let r = 0; r < 6000; r++) {
        let sum = 0, sq = 0
        for (let i = 0; i < n; i++) { const x = mu + gauss(rng); sum += x; sq += x * x }
        const m = sum / n, v = sq / n - m * m
        est.push((m / Math.sqrt(v)) * Math.sqrt(12))
      }
      const em = est.reduce((a, v) => a + v, 0) / est.length
      const sd = Math.sqrt(est.reduce((a, v) => a + (v - em) ** 2, 0) / (est.length - 1))
      rel(sd, ans[1], 0.05)
    }
  }, 120000)
  it('Monte Carlo: AR(1) data carry T(1-rho)/(1+rho) effective observations (variance of the mean)', () => {
    for (const rho of [0.2, 0.5]) {
      const T = 240
      const ans = answers(E.build({ sr: 1, years: 4, T, rho }))
      const rng = makeRng('ar' + rho)
      const means: number[] = []
      for (let r = 0; r < 6000; r++) {
        let x = gauss(rng), sum = x
        for (let t = 1; t < T; t++) { x = rho * x + Math.sqrt(1 - rho * rho) * gauss(rng); sum += x }
        means.push(sum / T)
      }
      const v = means.reduce((a, m) => a + m * m, 0) / means.length
      rel(1 / v, ans[4], 0.1)
    }
  }, 120000)
})

// ---------- F ----------
describe('generator F against independent computation', () => {
  it('AIC, BIC and likelihood ratio from definitions, adjusted R squared via variances (300 seeds)', () => {
    for (const s of seeds('F', 300)) {
      const p = Fc.sample(makeRng(s))
      const ans = answers(Fc.build(p))
      close(ans[0], -2 * p.ll1 + 2 * p.k1, 1e-9)
      close(ans[1], -2 * p.ll1 + p.k1 * Math.log(p.n), 1e-9)
      close(ans[2], (-2 * p.ll0 + 2 * p.k0) - (-2 * p.ll1 + 2 * p.k1), 1e-9)
      close(ans[3], 2 * (p.ll1 - p.ll0), 1e-9)
      // adjusted R^2 = 1 - [RSS/(n-p-1)] / [TSS/(n-1)] with RSS/TSS = 1 - R^2
      const pReg = p.k1 - 1
      close(ans[4], 1 - ((1 - p.r2) / (p.n - pReg - 1)) / (1 / (p.n - 1)), 1e-9)
      expect(p.k1).toBeGreaterThan(p.k0)
    }
  })
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  it('peak, mean, plateau count, neighbour drop and positive subperiods from the table (300 seeds)', () => {
    for (const s of seeds('G', 300)) {
      const p = G.sample(makeRng(s))
      const ans = answers(G.build(p))
      const S = p.sr.map((v) => v / 100)
      const sorted = [...S].sort((a, b) => b - a)
      close(ans[0], sorted[0], 1e-12)
      close(ans[1], S.reduce((a, v) => a + v, 0) / 5, 1e-12)
      let c = 0
      for (const v of S) if (v / sorted[0] >= 0.7 - 1e-12) c++
      expect(ans[2]).toBe(c)
      const i = S.indexOf(sorted[0])
      const nb = i === 0 ? [S[1]] : i === 4 ? [S[3]] : [S[i - 1], S[i + 1]]
      close(ans[3], 1 - nb.reduce((a, v) => a + v, 0) / nb.length / sorted[0], 1e-12)
      expect(ans[4]).toBe(p.sub.filter((v) => v > 0).length)
      expect(sorted[0]).toBeGreaterThan(0)
    }
  })
})

// ---------- H ----------
describe('generator H against independent computation', () => {
  it('t statistics, a BigInt closed form for the congruential stream, interval half-width (300 seeds)', () => {
    for (const s of seeds('H', 300)) {
      const p = H.sample(makeRng(s))
      const ans = answers(H.build(p))
      close(ans[0], p.sr * Math.sqrt(p.years), 1e-12)
      close(ans[1], Math.sqrt(2 * Math.log(p.N)), 1e-12)
      close(ans[2], ans[0] - ans[1], 1e-12)
      const seed = 1 + (p.a + p.c) % (p.m - 1)
      // closed form x_k = a^k x_0 + c (a^k - 1)/(a - 1) mod m, computed with the geometric sum expanded
      const a = BigInt(p.a), c = BigInt(p.c), m = BigInt(p.m)
      let geo = 0n, pow = 1n
      for (let i = 0; i < 3; i++) { geo += pow; pow *= a }
      expect(ans[3]).toBe(Number((pow * BigInt(seed) + c * geo) % m))
      close(ans[4], (1.96 * p.s) / Math.sqrt(p.n), 1e-12)
    }
  })
  it('Monte Carlo: the expected maximum of N independent standard normals stays below sqrt(2 ln N)', () => {
    for (const N of [10, 100, 1000]) {
      const rng = makeRng('max' + N)
      let tot = 0
      const runs = 4000
      for (let r = 0; r < runs; r++) { let mx = -Infinity; for (let i = 0; i < N; i++) mx = Math.max(mx, gauss(rng)); tot += mx }
      expect(tot / runs).toBeLessThan(Math.sqrt(2 * Math.log(N)))
      expect(tot / runs).toBeGreaterThan(0.5 * Math.sqrt(2 * Math.log(N)))
    }
  })
})
