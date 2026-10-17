// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: exact fractions; the average of the difference in means over all 20 possible assignments equals the ATE (unbiasedness of randomisation).
//  B: the table is expanded into individual units; nearest neighbours by brute force.
//  C: exact fractions; the estimators are applied to large simulated populations with a known ATE (doubly robust property included).
//  D: exact fractions; Monte Carlo of a compliance-type model for the Wald estimate and the exclusion-violation bias.
//  E: exact normal equations; simulated data with a known jump.
//  F: exact fractions; a simulated parallel-trends model.
//  G: exact fractions; the permutation p-value from ranks.
//  H: extreme completions of the missing potential outcomes in an explicit population; exact binomial tail in fractions.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import type { Rng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { F, solveFr } from '../../../shared/fraction'
import * as A from './a-potential'
import * as B from './b-adjust'
import * as C from './c-ipw'
import * as D from './d-iv'
import * as E from './e-rd'
import * as Fd from './f-did'
import * as G from './g-synth'
import * as H from './h-sensitivity'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const lectures = topics.find((t) => t.id === 'ci')!.lectures.length
const gauss = (rng: Rng) => Math.sqrt(-2 * Math.log(1 - rng.next())) * Math.cos(2 * Math.PI * rng.next())

const gens: [string, LQGenerator, number][] = [
  ['A', { id: 'A', generate: (r) => A.build(A.sample(r)) }, 5],
  ['B', { id: 'B', generate: (r) => B.build(B.sample(r)) }, 5],
  ['C', { id: 'C', generate: (r) => C.build(C.sample(r)) }, 5],
  ['D', { id: 'D', generate: (r) => D.build(D.sample(r)) }, 5],
  ['E', { id: 'E', generate: (r) => E.build(E.sample(r)) }, 5],
  ['F', { id: 'F', generate: (r) => Fd.build(Fd.sample(r)) }, 5],
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
  it('exact arithmetic, and the mean over all 20 assignments of the naive estimator equals the ATE (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      const idx = [0, 1, 2, 3, 4, 5]
      const ate = idx.reduce((a, i) => a.add(F(p.y1[i] - p.y0[i])), F(0)).div(F(6))
      close(ans[0], ate.num, 1e-12)
      const ctrl = idx.filter((i) => !p.treated.includes(i))
      const att = p.treated.reduce((a, i) => a.add(F(p.y1[i] - p.y0[i])), F(0)).div(F(3))
      close(ans[1], att.num, 1e-12)
      const naive = p.treated.reduce((a, i) => a.add(F(p.y1[i])), F(0)).div(F(3)).sub(ctrl.reduce((a, i) => a.add(F(p.y0[i])), F(0)).div(F(3)))
      close(ans[2], naive.num, 1e-12)
      close(ans[3], naive.sub(att).num, 1e-12)
      // average of the naive estimate over every way of choosing 3 treated units
      let total = F(0), count = 0
      for (let a = 0; a < 6; a++) for (let b = a + 1; b < 6; b++) for (let c = b + 1; c < 6; c++) {
        const tr = [a, b, c], co = idx.filter((i) => !tr.includes(i))
        const d = tr.reduce((q, i) => q.add(F(p.y1[i])), F(0)).div(F(3)).sub(co.reduce((q, i) => q.add(F(p.y0[i])), F(0)).div(F(3)))
        total = total.add(d); count++
      }
      expect(count).toBe(20)
      close(total.div(F(20)).num, ate.num, 1e-12)
      // Neyman standard error from two-pass variances
      const sv = (a: number[]) => { const m = a.reduce((q, v) => q + v, 0) / a.length; return a.reduce((q, v) => q + (v - m) ** 2, 0) / (a.length - 1) }
      close(ans[4], Math.sqrt(sv(p.treated.map((i) => p.y1[i])) / 3 + sv(ctrl.map((i) => p.y0[i])) / 3), 1e-12)
    }
  })
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  it('expanding the table into units; nearest neighbours by brute force (300 seeds)', () => {
    for (const s of seeds('B', 300)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      const units: { x: number; t: number; y: number }[] = []
      for (let x = 0; x < 2; x++) for (let t = 0; t < 2; t++) for (let i = 0; i < p.n[x][t]; i++) units.push({ x, t, y: p.mu[x][t] / 10 })
      const mean = (a: number[]) => a.reduce((q, v) => q + v, 0) / a.length
      const naive = mean(units.filter((u) => u.t === 1).map((u) => u.y)) - mean(units.filter((u) => u.t === 0).map((u) => u.y))
      close(ans[0], naive, 1e-9)
      // backdoor formula by reweighting each unit to the covariate distribution of the whole sample
      const effect = (x: number) => mean(units.filter((u) => u.x === x && u.t === 1).map((u) => u.y)) - mean(units.filter((u) => u.x === x && u.t === 0).map((u) => u.y))
      const share = (x: number) => units.filter((u) => u.x === x).length / units.length
      close(ans[1], share(0) * effect(0) + share(1) * effect(1), 1e-9)
      close(ans[2], naive - ans[1], 1e-12)
      const treatedUnits = units.filter((u) => u.t === 1)
      close(ans[3], (treatedUnits.filter((u) => u.x === 0).length * effect(0) + treatedUnits.filter((u) => u.x === 1).length * effect(1)) / treatedUnits.length, 1e-9)
      // matching by brute-force minimisation of |x_c - x_t|
      const diffs = p.xt.map((v, i) => { const d = p.xc.map((c) => Math.abs(c - v)); return p.yt[i] - p.yc[d.indexOf(Math.min(...d))] })
      close(ans[4], mean(diffs), 1e-12)
    }
  })
})

// ---------- C ----------
describe('generator C against independent computation', () => {
  it('exact fractions for every part (300 seeds)', () => {
    for (const s of seeds('C', 300)) {
      const p = C.sample(makeRng(s))
      const ans = answers(C.build(p))
      const e = p.e.map((v) => F(v, 10)), m1 = p.m1.map((v) => F(v, 10)), m0 = p.m0.map((v) => F(v, 10))
      let ipw = F(0), dr = F(0)
      p.t.forEach((t, i) => {
        const y = F(p.y[i])
        ipw = ipw.add(t ? y.div(e[i]) : F(0).sub(y.div(F(1).sub(e[i]))))
        dr = dr.add(m1[i]).sub(m0[i])
        dr = dr.add(t ? y.sub(m1[i]).div(e[i]) : F(0).sub(y.sub(m0[i]).div(F(1).sub(e[i]))))
      })
      close(ans[0], ipw.div(F(6)).num, 1e-9)
      close(ans[4], dr.div(F(6)).num, 1e-9)
      const w = p.t.map((t, i) => (t ? F(1).div(e[i]) : F(1).div(F(1).sub(e[i]))))
      close(ans[2], Math.max(...w.map((v) => v.num)), 1e-9)
      const sw = w.reduce((a, v) => a.add(v), F(0)), sw2 = w.reduce((a, v) => a.add(v.mul(v)), F(0))
      close(ans[3], sw.mul(sw).div(sw2).num, 1e-9)
      let n1 = F(0), d1 = F(0), n0 = F(0), d0 = F(0)
      p.t.forEach((t, i) => { if (t) { n1 = n1.add(F(p.y[i]).mul(w[i])); d1 = d1.add(w[i]) } else { n0 = n0.add(F(p.y[i]).mul(w[i])); d0 = d0.add(w[i]) } })
      close(ans[1], n1.div(d1).sub(n0.div(d0)).num, 1e-9)
    }
  })
  it('Monte Carlo: IPW, Hajek and the doubly robust estimator recover a known ATE; AIPW survives either model being wrong', () => {
    const rng = makeRng('ipw-sim')
    const N = 300000
    const T: number[] = [], Y: number[] = [], e: number[] = [], x: number[] = []
    for (let i = 0; i < N; i++) {
      const xi = rng.next(), ei = 0.2 + 0.6 * xi
      const y1 = 3 + 2 * xi + gauss(rng), y0 = 1 + xi + gauss(rng) // ATE = 2 + E[xi] = 2.5
      const t = rng.next() < ei ? 1 : 0
      T.push(t); Y.push(t ? y1 : y0); e.push(ei); x.push(xi)
    }
    close(C.ipw(T, Y, e), 2.5, 0.03)
    close(C.hajek(T, Y, e), 2.5, 0.03)
    const zero = x.map(() => 0)
    close(C.aipw(T, Y, e, zero, zero), 2.5, 0.03) // wrong outcome model, right propensity
    close(C.aipw(T, Y, x.map(() => 0.5), x.map((v) => 3 + 2 * v), x.map((v) => 1 + v)), 2.5, 0.03) // wrong propensity, right outcome model
  }, 60000)
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('exact fractions (300 seeds)', () => {
    for (const s of seeds('D', 300)) {
      const p = D.sample(makeRng(s))
      const ans = answers(D.build(p))
      const rf = F(p.y1 - p.y0, 10), fs = F(p.t1 - p.t0, 100)
      close(ans[0], rf.num, 1e-12)
      close(ans[1], fs.num, 1e-12)
      close(ans[2], rf.div(fs).num, 1e-9)
      close(ans[3], fs.num ** 2 / p.se ** 2, 1e-9)
      close(ans[4], p.delta / fs.num, 1e-9)
    }
  })
  it('Monte Carlo: with compliers, always- and never-takers the Wald ratio recovers the complier effect; an exclusion violation adds delta / pi', () => {
    const rng = makeRng('iv-sim')
    const pi = 0.4, beta = 3, delta = 0.5, N = 400000
    const run = (direct: number) => {
      let s1 = 0, s0 = 0, n1 = 0, n0 = 0, t1 = 0, t0 = 0
      for (let i = 0; i < N; i++) {
        const z = rng.next() < 0.5 ? 1 : 0
        const u = rng.next()
        const type = u < pi ? 'c' : u < pi + 0.2 ? 'a' : 'n' // complier, always-taker, never-taker
        const t = type === 'a' ? 1 : type === 'n' ? 0 : z
        const y = 1 + beta * t * (type === 'c' ? 1 : 0.2) + direct * z + gauss(rng) // effect beta for compliers, smaller for always-takers
        if (z) { s1 += y; t1 += t; n1++ } else { s0 += y; t0 += t; n0++ }
      }
      return D.wald(s1 / n1, s0 / n0, t1 / n1, t0 / n0)
    }
    close(run(0), beta, 0.12)
    close(run(delta), beta + delta / pi, 0.2)
  }, 60000)
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  it('exact normal equations for each side, and the fuzzy ratio (300 seeds)', () => {
    for (const s of seeds('E', 300)) {
      const p = E.sample(makeRng(s))
      const ans = answers(E.build(p))
      const fit = (x: number[], y: number[]) => {
        const sx = x.reduce((a, v) => a.add(F(v)), F(0)), sy = y.reduce((a, v) => a.add(F(v, 10)), F(0))
        const sxx = x.reduce((a, v) => a.add(F(v * v)), F(0)), sxy = x.reduce((a, v, i) => a.add(F(v).mul(F(y[i], 10))), F(0))
        return solveFr([[F(x.length), sx], [sx, sxx]], [sy, sxy])
      }
      const l = fit(E.XL, p.yl), r = fit(E.XR, p.yr)
      close(ans[0], l[0].num, 1e-9)
      close(ans[1], r[0].num, 1e-9)
      close(ans[2], r[0].sub(l[0]).num, 1e-9)
      close(ans[3], r[1].num, 1e-9)
      close(ans[4], r[0].sub(l[0]).num / ((p.pr - p.pl) / 100), 1e-9)
    }
  })
  it('simulated data with a known jump: the difference of the fitted intercepts recovers it', () => {
    const rng = makeRng('rd-sim')
    const xs: number[] = [], ys: number[] = []
    for (let i = 0; i < 20000; i++) { const x = (rng.next() - 0.5) * 6; xs.push(x); ys.push(5 + 0.7 * x + (x >= 0 ? 2 : 0) + gauss(rng)) }
    const L = E.line(xs.filter((x) => x < 0), ys.filter((_, i) => xs[i] < 0)), R = E.line(xs.filter((x) => x >= 0), ys.filter((_, i) => xs[i] >= 0))
    close(R.intercept - L.intercept, 2, 0.1)
  })
})

// ---------- F ----------
describe('generator F against independent computation', () => {
  it('exact fractions (300 seeds)', () => {
    for (const s of seeds('F', 300)) {
      const p = Fd.sample(makeRng(s))
      const ans = answers(Fd.build(p))
      const T = p.t.map((v) => F(v, 10)), C = p.c.map((v) => F(v, 10))
      close(ans[0], T[2].sub(T[1]).sub(C[2].sub(C[1])).num, 1e-9)
      close(ans[1], T[2].sub(T[1]).num, 1e-9)
      close(ans[2], C[2].sub(C[1]).num, 1e-9)
      close(ans[3], T[1].add(C[2]).sub(C[1]).num, 1e-9)
      close(ans[4], T[1].sub(C[1]).sub(T[0].sub(C[0])).num, 1e-9)
    }
  })
  it('Monte Carlo: with parallel trends the estimator recovers the effect despite level differences and time shocks', () => {
    const rng = makeRng('did-sim')
    const N = 200000, effect = 4
    let tPre = 0, tPost = 0, cPre = 0, cPost = 0
    for (let i = 0; i < N; i++) {
      const a = 10 + gauss(rng), b = 3 + gauss(rng) // unit effects: treated and control levels differ
      tPre += a; tPost += a + 2 + effect + gauss(rng) // common time shock 2, treatment effect 4
      cPre += b; cPost += b + 2 + gauss(rng)
    }
    close(Fd.did([0, tPre / N, tPost / N], [0, cPre / N, cPost / N]), effect, 0.05)
  })
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  it('exact weight, synthetic outcome, RMSPE and rank-based p-value (300 seeds)', () => {
    for (const s of seeds('G', 300)) {
      const p = G.sample(makeRng(s))
      const ans = answers(G.build(p))
      const w = F(p.yt - p.y2).div(F(p.y1 - p.y2))
      expect(w.cmp(F(0))).toBeGreaterThan(0)
      expect(w.cmp(F(1))).toBeLessThan(0)
      close(ans[0], w.num, 1e-12)
      const synth = w.mul(F(p.z1, 10)).add(F(1).sub(w).mul(F(p.z2, 10)))
      close(ans[1], synth.num, 1e-9)
      close(ans[2], F(p.zt, 10).sub(synth).num, 1e-9)
      // the weighted donors reproduce the treated pre-treatment outcome
      close(w.num * (p.y1 / 10) + (1 - w.num) * (p.y2 / 10), p.yt / 10, 1e-9)
      close(ans[3], Math.sqrt(p.gaps.reduce((a, v) => a + (v / 10) ** 2, 0) / 3), 1e-12)
      // p-value from ranks among all ten ratios (descending order, ties counted as at least as large)
      const all = [...p.ratios, p.ratioT].sort((a, b) => b - a)
      const rank = all.lastIndexOf(p.ratioT) + 1 // number of ratios at least as large as the treated one
      close(ans[4], rank / 10, 1e-12)
    }
  })
})

// ---------- H ----------
describe('generator H against independent computation', () => {
  it('extreme completions of missing outcomes, exact binomial tail, subgroup effects (300 seeds)', () => {
    for (const s of seeds('H', 300)) {
      const p = H.sample(makeRng(s))
      const ans = answers(H.build(p))
      // a population of 1000 units: p% treated with mean outcome m1, rest with m0; outcomes in [0,1]
      const N = 1000, nT = (p.p * N) / 100, nC = N - nT
      const sumY1obs = nT * (p.m1 / 100), sumY0obs = nC * (p.m0 / 100)
      // lower bound: missing Y(1) of controls = 0, missing Y(0) of treated = 1; upper bound: the reverse
      const ateLow = (sumY1obs + nC * 0) / N - (sumY0obs + nT * 1) / N
      const ateHigh = (sumY1obs + nC * 1) / N - (sumY0obs + nT * 0) / N
      close(ans[0], ateLow, 1e-9)
      close(ans[1], ateHigh, 1e-9)
      expect(ateHigh - ateLow).toBeCloseTo(1, 12)
      // Rosenbaum bound with q = Gamma/(1+Gamma) as an exact fraction
      const q = F(p.gamma, 10).div(F(1).add(F(p.gamma, 10)))
      let tail = F(0)
      const choose = (n: number, k: number) => { let r = 1n; for (let i = 1; i <= k; i++) r = (r * BigInt(n - k + i)) / BigInt(i); return r }
      for (let k = p.T; k <= p.pairs; k++) {
        let t = F(Number(choose(p.pairs, k)))
        for (let i = 0; i < k; i++) t = t.mul(q)
        for (let i = 0; i < p.pairs - k; i++) t = t.mul(F(1).sub(q))
        tail = tail.add(t)
      }
      close(ans[2], tail.num, 1e-9)
      close(ans[3], (p.g[0] - p.g[1]) / 10, 1e-12)
      close(ans[4], (p.g[0] - p.g[1]) / 10 - (p.g[2] - p.g[3]) / 10, 1e-12)
    }
  })
})
