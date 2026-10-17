// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: raw sums of squares in exact fractions (not mean deviations); replication by incrementing n; the t table by integrating the t density.
//  B: effects as regression coefficients from an exact linear solve; the half fractions by fitting a 4-run model; alias identity A + sBC.
//  C: sums of squares in exact fractions from raw totals; the error as the sum of squared residuals (not by subtraction).
//  D: smallest n by incrementing until the power condition holds; pooled z from the 2x2 chi-square formula; normal tails by erf series.
//  E: delta-method variance through sample variances and covariance (exact fractions); simulation of the ratio estimator's sampling variance.
//  F: OBF constants by simulating the group sequential test; the mixture likelihood ratio by integrating over the prior; CUPED by exact variance algebra.
//  G: second-moment variance decomposition; the design effect from the equicorrelation matrix and by simulation; clusters by incrementing.
//  H: spending function by Simpson integration and simulation; chi-square from the one-cell identity; p-value by erf series; missing share exactly.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import type { Rng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { F as fr, Fr, solveFr } from '../../../shared/fraction'
import * as A from './a-anova'
import * as B from './b-factorial'
import * as C from './c-block'
import * as D from './d-abtest'
import * as E from './e-ratio'
import * as Ff from './f-sequential'
import * as G from './g-strata'
import * as H from './h-spending'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const lectures = topics.find((t) => t.id === 'exp')!.lectures.length
const gauss = (rng: Rng) => Math.sqrt(-2 * Math.log(1 - rng.next())) * Math.cos(2 * Math.PI * rng.next())
const simpson = (f: (x: number) => number, a: number, b: number, n = 4000) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3 }
/** erf by its Maclaurin series (accurate for |x| below about 4), independent of the Abramowitz-Stegun fit in shared/format */
const erf = (x: number) => { let term = x, s = x; for (let n = 1; n < 120; n++) { term *= (-x * x) / n; s += term / (2 * n + 1) } return (2 / Math.sqrt(Math.PI)) * s }
const Phi = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2))
const sumF = (v: Fr[]) => v.reduce((a, b) => a.add(b), fr(0))
const sq = (x: Fr) => x.mul(x)
const solve = (A: Fr[][], b: Fr[]) => solveFr(A, b)

const gens: [string, LQGenerator, number][] = [
  ['A', { id: 'A', generate: (r) => A.build(A.sample(r)) }, 5],
  ['B', { id: 'B', generate: (r) => B.build(B.sample(r)) }, 5],
  ['C', { id: 'C', generate: (r) => C.build(C.sample(r)) }, 5],
  ['D', { id: 'D', generate: (r) => D.build(D.sample(r)) }, 5],
  ['E', { id: 'E', generate: (r) => E.build(E.sample(r)) }, 5],
  ['F', { id: 'F', generate: (r) => Ff.build(Ff.sample(r)) }, 5],
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
        expect((p.tolerance?.abs ?? 0) > 0 || (p.tolerance?.rel ?? 0) > 0, `${s}: tolerance`).toBe(true)
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
  for (const [name, gen] of gens) for (const s of seeds(name, 40)) gen.generate(makeRng(s)).parts.forEach((p) => seen.add(p.lecture))
  expect([...seen].sort((a, b) => a - b)).toEqual(Array.from({ length: lectures }, (_, i) => i + 1))
})

it('the blueprint slots cover the lectures of their range', () => {
  const lec = (g: LQGenerator) => { const s = new Set<number>(); for (const sd of seeds('slot', 20)) g.generate(makeRng(sd)).parts.forEach((p) => s.add(p.lecture)); return s }
  const byId = new Map(gens.map(([, g], i) => [String.fromCharCode(65 + i), lec(g)]))
  const union = (ids: string[]) => new Set(ids.flatMap((i) => [...byId.get(i)!]))
  for (const [ids, lo, hi] of [[['A', 'B', 'C'], 1, 5], [['D', 'E'], 6, 8], [['F', 'G', 'H'], 9, 11]] as [string[], number, number][]) {
    const u = union(ids)
    for (let l = lo; l <= hi; l++) expect(u.has(l), `lecture ${l} in slot ${ids}`).toBe(true)
    for (const l of u) { expect(l).toBeGreaterThanOrEqual(lo); expect(l).toBeLessThanOrEqual(hi) }
  }
})

// ---------- A ----------
describe('generator A against independent computation', () => {
  it('the printed t table matches the 97.5% point of the t density found by integration', () => {
    for (const [df, t] of Object.entries(A.T_CRIT)) {
      const nu = +df
      const dens = (x: number) => (1 + (x * x) / nu) ** (-(nu + 1) / 2)
      const total = simpson(dens, -200, 200, 200000)
      const cdf = 1 - simpson(dens, t, 200, 100000) / total
      close(cdf, 0.975, 2e-4)
    }
  })
  it('raw-sum sums of squares in exact fractions; replication by incrementing n (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      const { k, n } = p
      const N = k * n
      const T = p.y.map((r) => fr(r.reduce((a, b) => a + b, 0)))
      const G = sumF(T)
      const sumsq = p.y.flat().reduce((a, v) => a + v * v, 0)
      const corr = G.mul(G).div(fr(N))
      const between = sumF(T.map(sq)).div(fr(n)).sub(corr)
      const within = fr(sumsq).sub(sumF(T.map(sq)).div(fr(n)))
      close(ans[1], between.num, 1e-9)
      close(ans[2], within.num, 1e-9)
      const Fst = between.div(fr(k - 1)).div(within.div(fr(N - k)))
      close(ans[3], Fst.num, 1e-9)
      close(ans[4], A.T_CRIT[N - k] * Math.sqrt(within.div(fr(N - k)).mul(fr(2)).div(fr(n)).num), 1e-9)
      let reps = 1
      const s15 = p.s * 2 // s in halves
      while (fr(2 * p.sigma2).div(fr(reps)).cmp(fr(s15 * s15, 4)) > 0) reps++
      close(ans[0], reps, 1e-12)
    }
  })
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  const lvl = (i: number, b: number) => (((i >> b) & 1) ? 1 : -1)
  it('effects as regression coefficients; half fractions by a 4-run model; the alias identity (300 seeds)', () => {
    for (const s of seeds('B', 300)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      // full model, columns: 1, A, B, C, AB, AC, BC, ABC (orthogonal, so X'X = 8 I but solve it exactly anyway)
      const cols = [[], [0], [1], [2], [0, 1], [0, 2], [1, 2], [0, 1, 2]]
      const X = Array.from({ length: 8 }, (_, i) => cols.map((c) => c.reduce((a, b) => a * lvl(i, b), 1)))
      const XtX = cols.map((_, a) => cols.map((_, b) => fr(X.reduce((t, row) => t + row[a] * row[b], 0))))
      const Xty = cols.map((_, a) => fr(X.reduce((t, row, i) => t + row[a] * p.y[i], 0)))
      const beta = solve(XtX, Xty)
      close(ans[0], 2 * beta[1].num, 1e-12)
      close(ans[1], 2 * beta[4].num, 1e-12)
      close(ans[2], 2 * beta[7].num, 1e-12)
      // fraction: four runs, model 1 + A + B + C
      const fit = (sign: number) => {
        const runs = [0, 1, 2, 3, 4, 5, 6, 7].filter((i) => lvl(i, 0) * lvl(i, 1) * lvl(i, 2) === sign)
        const M = runs.map((i) => [1, lvl(i, 0), lvl(i, 1), lvl(i, 2)].map((v) => fr(v)))
        return solve(M, runs.map((i) => fr(p.y[i])))
      }
      const b1 = fit(p.s), b2 = fit(-p.s)
      close(ans[3], 2 * b1[1].num, 1e-12)
      // the alias identity: the fraction's A contrast is A + s*BC from the full model
      close(2 * b1[1].num, 2 * beta[1].num + p.s * 2 * beta[6].num, 1e-12)
      close(2 * b2[1].num, 2 * beta[1].num - p.s * 2 * beta[6].num, 1e-12)
      close(ans[4], 2 * beta[6].num, 1e-12)
    }
  })
})

// ---------- C ----------
describe('generator C against independent computation', () => {
  it('raw-total sums of squares; the error as a sum of squared residuals (300 seeds)', () => {
    for (const s of seeds('C', 300)) {
      const p = C.sample(makeRng(s))
      const ans = answers(C.build(p))
      const { t, b } = p
      const N = t * b
      const Y = p.y.map((r) => r.map((v) => fr(v)))
      const G = sumF(Y.flat())
      const blockTot = Y.map(sumF)
      const trtTot = Array.from({ length: t }, (_, i) => sumF(Y.map((r) => r[i])))
      const cf = G.mul(G).div(fr(N))
      const ssB = sumF(blockTot.map(sq)).div(fr(t)).sub(cf)
      const ssT = sumF(trtTot.map(sq)).div(fr(b)).sub(cf)
      close(ans[0], ssB.num, 1e-9)
      close(ans[1], ssT.num, 1e-9)
      // residual e_ij = y_ij - ybar_i. - ybar_.j + ybar_..
      let sse = fr(0)
      for (let j = 0; j < b; j++) for (let i = 0; i < t; i++) {
        const e = Y[j][i].sub(trtTot[i].div(fr(b))).sub(blockTot[j].div(fr(t))).add(G.div(fr(N)))
        sse = sse.add(sq(e))
      }
      close(ans[2], sse.num, 1e-9)
      const mse = sse.div(fr((t - 1) * (b - 1)))
      close(ans[3], ssT.div(fr(t - 1)).div(mse).num, 1e-9)
      // efficiency: the CRD error variance estimate built from pooled block and error variation, relative to MSE
      const crd = ssB.div(fr(b - 1)).mul(fr(b - 1)).add(mse.mul(fr(b * (t - 1)))).div(fr(N - 1))
      close(ans[4], crd.div(mse).num, 1e-9)
    }
  })
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('z quantiles; smallest n by incrementing; pooled z from the 2x2 chi-square; tails by erf series (300 seeds)', () => {
    const quantile = (pr: number) => { let lo = 0, hi = 6; for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (Phi(mid) < pr) lo = mid; else hi = mid } return lo }
    close(quantile(0.975), D.Z_ALPHA, 1e-4)
    close(quantile(0.8), D.Z_POWER, 1e-4)
    for (const s of seeds('D', 300)) {
      const p = D.sample(makeRng(s))
      const ans = answers(D.build(p))
      const p0 = p.p0 / 100, p1 = (p.p0 + p.delta) / 100, d = p.delta / 100
      const v = p0 * (1 - p0) + p1 * (1 - p1)
      let n = 1
      while (d / Math.sqrt(v / n) < D.Z_ALPHA + D.Z_POWER) n++
      close(ans[0], n, 1e-12)
      close(ans[1], Phi(d / Math.sqrt(v / p.nSmall) - D.Z_ALPHA), 1e-6)
      const m = p.m
      const a = p.xt, bb = m - p.xt, c = p.xc, dd = m - p.xc
      const chi = (2 * m * (a * dd - bb * c) ** 2) / ((a + bb) * (c + dd) * (a + c) * (bb + dd))
      const z = Math.sign(p.xt - p.xc) * Math.sqrt(chi)
      close(ans[2], z, 1e-9)
      const se = Math.sqrt((a * bb) / m ** 3 + (c * dd) / m ** 3)
      close(ans[3], 1.96 * se, 1e-9)
      close(ans[4], 2 * (1 - Phi(Math.abs(z))), 1e-6)
    }
  })
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  it('delta-method variance through sample variances and covariance in exact fractions (300 seeds)', () => {
    for (const s of seeds('E', 300)) {
      const p = E.sample(makeRng(s))
      const ans = answers(E.build(p))
      const n = p.x.length
      const X = p.x.map((v) => fr(v)), V = p.v.map((v) => fr(v))
      const mx = sumF(X).div(fr(n)), mv = sumF(V).div(fr(n))
      const R = mx.div(mv)
      close(ans[0], R.num, 1e-12)
      const sxx = sumF(X.map((a) => sq(a.sub(mx)))).div(fr(n - 1))
      const svv = sumF(V.map((a) => sq(a.sub(mv)))).div(fr(n - 1))
      const sxv = sumF(X.map((a, i) => a.sub(mx).mul(V[i].sub(mv)))).div(fr(n - 1))
      const varUser = sxx.sub(fr(2).mul(R).mul(sxv)).add(sq(R).mul(svv)).div(sq(mv)) // per-user variance of the linearised metric
      close(ans[1], Math.sqrt(varUser.div(fr(n)).num), 1e-12)
      const naive = Math.sqrt(R.mul(fr(1).sub(R)).div(sumF(V)).num)
      close(ans[2], naive, 1e-12)
      close(ans[3], varUser.div(fr(n)).num / (naive * naive), 1e-9)
      close(ans[4], Math.ceil(2 * (1.96 + 0.8416) ** 2 * varUser.num / (p.delta * p.delta) - 1e-9), 1e-12)
    }
  })
  it('the delta-method variance matches the simulated sampling variance of the ratio estimator (population = the six users)', () => {
    for (const s of seeds('Emc', 3)) {
      const rng = makeRng(s)
      const p = E.sample(rng)
      const se = answers(E.build(p))[1]
      const n = p.x.length, M = 400, reps = 12000
      let s1 = 0, s2 = 0
      for (let r = 0; r < reps; r++) {
        let sx = 0, sv = 0
        for (let i = 0; i < M; i++) { const j = Math.floor(rng.next() * n); sx += p.x[j]; sv += p.v[j] }
        const R = sx / sv
        s1 += R; s2 += R * R
      }
      const varMC = s2 / reps - (s1 / reps) ** 2
      // generator SE uses divisor n-1 for the six users; the population variance has divisor n, so SE^2 * (n-1) equals M * Var for sampling M users
      expect(Math.abs((varMC * M) / (se * se * (n - 1)) - 1), s).toBeLessThan(0.07)
    }
  }, 120000)
})

// ---------- F ----------
describe('generator F against independent computation', () => {
  it('the O\'Brien-Fleming constants give overall 5% error in simulation', () => {
    const rng = makeRng('F-obf')
    for (const K of [3, 4, 5]) {
      const reps = 400000
      let rej = 0
      for (let r = 0; r < reps; r++) {
        let S = 0
        for (let j = 1; j <= K; j++) {
          S += gauss(rng) // increment of the standardised partial sum, unit variance per look
          if (Math.abs(S / Math.sqrt(j)) >= Ff.OBF[K] * Math.sqrt(K / j)) { rej++; break }
        }
      }
      expect(Math.abs(rej / reps - 0.05), `K=${K}`).toBeLessThan(0.0025)
    }
  }, 120000)
  it('z from the standard error of the difference; mixture ratio by integrating over the prior; CUPED by exact variance algebra (300 seeds)', () => {
    for (const s of seeds('F', 300)) {
      const p = Ff.sample(makeRng(s))
      const ans = answers(Ff.build(p))
      close(ans[0], Ff.OBF[p.K] * Math.sqrt(p.K / p.k), 1e-12)
      const nk = p.k * p.nLook
      close(ans[1], p.dz / Math.sqrt((2 * p.sigma * p.sigma) / nk), 1e-9)
      // Lambda = integral over theta of L(theta)/L(0) times the N(0, tau^2) density
      const sd2 = p.sd * p.sd
      const f = (th: number) => Math.exp((p.nObs * th * p.xbar) / sd2 - (p.nObs * th * th) / (2 * sd2)) * Math.exp(-(th * th) / (2 * p.tau * p.tau)) / (p.tau * Math.sqrt(2 * Math.PI))
      close(ans[2] / simpson(f, -12 * p.tau, 12 * p.tau, 200000), 1, 1e-6)
      // CUPED: Var(Y - theta X) = sy^2 (1 - rho^2) exactly when theta = Cov/Var(X); minimise over a grid as a check
      const rho = fr(p.rho10, 10)
      const cov = rho.mul(fr(p.sy)).mul(fr(p.sx))
      const theta = cov.div(fr(p.sx * p.sx))
      close(ans[3], theta.num, 1e-12)
      const varAdj = fr(p.sy * p.sy).sub(fr(2).mul(theta).mul(cov)).add(sq(theta).mul(fr(p.sx * p.sx)))
      expect(varAdj.cmp(fr(p.sy * p.sy).mul(fr(1).sub(sq(rho)))), s).toBe(0)
      close(ans[4], fr(p.nBase).mul(varAdj).div(fr(p.sy * p.sy)).num, 1e-9)
      // theta is the minimiser: nearby coefficients give a larger variance
      const vAt = (th: number) => p.sy * p.sy - 2 * th * cov.num + th * th * p.sx * p.sx
      expect(vAt(theta.num + 0.01)).toBeGreaterThan(vAt(theta.num))
      expect(vAt(theta.num - 0.01)).toBeGreaterThan(vAt(theta.num))
    }
  })
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  it('second-moment decomposition; clusters by incrementing; design effect from the equicorrelation matrix (300 seeds)', () => {
    for (const s of seeds('G', 300)) {
      const p = G.sample(makeRng(s))
      const ans = answers(G.build(p))
      const W = p.w.map((x) => fr(x, 10))
      const mean = sumF(W.map((w, i) => w.mul(fr(p.mu[i]))))
      close(ans[0], mean.num, 1e-12)
      const second = sumF(W.map((w, i) => w.mul(fr(p.sd[i] * p.sd[i] + p.mu[i] * p.mu[i]))))
      const total = second.sub(sq(mean))
      close(ans[1], total.num, 1e-9)
      const within = sumF(W.map((w, i) => w.mul(fr(p.sd[i] * p.sd[i]))))
      close(ans[2], fr(1).sub(within.div(total)).num, 1e-9)
      // variance of the mean of m equicorrelated unit-variance observations, relative to independent: (1/m^2) * sum of the correlation matrix, times m
      const rho = fr(p.rho100, 100)
      let tot = fr(0)
      for (let i = 0; i < p.m; i++) for (let j = 0; j < p.m; j++) tot = tot.add(i === j ? fr(1) : rho)
      const de = tot.div(fr(p.m))
      close(ans[3], de.num, 1e-12)
      let c = 1
      while (fr(c * p.m).div(de).cmp(fr(p.nInd)) < 0) c++
      close(ans[4], c, 1e-12)
    }
  })
  it('the design effect appears in simulated cluster means', () => {
    const rng = makeRng('G-mc')
    for (const [m, rho] of [[20, 0.05], [10, 0.03]]) {
      const C = 20, reps = 40000
      let s1 = 0, s2 = 0
      for (let r = 0; r < reps; r++) {
        let tot = 0
        for (let c = 0; c < C; c++) {
          const u = Math.sqrt(rho) * gauss(rng)
          for (let i = 0; i < m; i++) tot += u + Math.sqrt(1 - rho) * gauss(rng)
        }
        const mean = tot / (C * m)
        s1 += mean; s2 += mean * mean
      }
      const v = s2 / reps - (s1 / reps) ** 2
      const de = G.build({ w: [3, 3, 4], mu: [10, 20, 30], sd: [5, 5, 5], m, rho100: Math.round(rho * 100), nInd: 1000 }).parts[3].answer
      expect(Math.abs(v * C * m - de) / de).toBeLessThan(0.05)
    }
  }, 120000)
})

// ---------- H ----------
describe('generator H against independent computation', () => {
  it('spending function by integrating the normal tail and by simulation; chi-square and p-value; missing share (300 seeds)', () => {
    const dens = (x: number) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI)
    for (const s of seeds('H', 300)) {
      const p = H.sample(makeRng(s))
      const ans = answers(H.build(p))
      const tail = (t: number) => 2 * simpson(dens, 1.96 / Math.sqrt(t), 12, 20000)
      close(ans[0], tail(p.t1), 1e-6)
      close(ans[1], tail(p.t2) - tail(p.t1), 1e-6)
      const nC = p.N - p.nT
      const chi = (p.nT - p.N * p.r) ** 2 / (p.N * p.r * (1 - p.r))
      close(ans[2], chi, 1e-6)
      close(ans[3], 1 - erf(Math.sqrt(chi / 2)), 1e-6)
      close(ans[4], (nC * p.r / (1 - p.r) - p.nT) / (nC * p.r / (1 - p.r)), 1e-12)
      expect(ans[3], s).toBeGreaterThan(0)
      expect(ans[3], s).toBeLessThan(0.05)
    }
  })
  it('the spent alpha equals the simulated probability that a Brownian path is already beyond the boundary at time t', () => {
    const rng = makeRng('H-mc')
    for (const t of [0.5, 0.8]) {
      const reps = 400000
      let hit = 0
      for (let r = 0; r < reps; r++) if (Math.abs(Math.sqrt(t) * gauss(rng)) >= 1.96) hit++
      expect(Math.abs(hit / reps - H.spent(t)), String(t)).toBeLessThan(0.002)
    }
  }, 120000)
})
