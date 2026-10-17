// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: exact normal equations for the fit; gradient descent by its closed-form linear recursion; the logistic gradient by finite differences of the loss.
//  B: brute-force neighbours; exact formulas.
//  C: the distance of a point to the decision line by projection; hinge losses and the support count recomputed.
//  D: Gini as 2p(1-p) and entropy from natural logarithms.
//  E: Monte Carlo for the variance of an average of correlated predictors; posterior as a logistic function of the log-odds; naive Bayes by enumeration.
//  F: eigenvalues of the covariance matrix by Jacobi rotations; orthogonality of the eigenvectors.
//  G: nearest centres by explicit argmin; the final partition has no improving single-point move.
//  H: the AUC as the area under the ROC curve built from thresholds (trapezoid rule).
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import type { Rng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { F, solveFr } from '../../../shared/fraction'
import * as A from './a-linear'
import * as B from './b-selection'
import * as C from './c-svm'
import * as D from './d-trees'
import * as E from './e-ensemble'
import * as Fp from './f-pca'
import * as G from './g-kmeans'
import * as H from './h-metrics'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const rel = (got: number, want: number, r: number) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(r * Math.abs(want))
const lectures = topics.find((t) => t.id === 'ml')!.lectures.length
const gauss = (rng: Rng) => Math.sqrt(-2 * Math.log(1 - rng.next())) * Math.cos(2 * Math.PI * rng.next())

const gens: [string, LQGenerator, number][] = [
  ['A', { id: 'A', generate: (r) => A.build(A.sample(r)) }, 5],
  ['B', { id: 'B', generate: (r) => B.build(B.sample(r)) }, 5],
  ['C', { id: 'C', generate: (r) => C.build(C.sample(r)) }, 5],
  ['D', { id: 'D', generate: (r) => D.build(D.sample(r)) }, 5],
  ['E', { id: 'E', generate: (r) => E.build(E.sample(r)) }, 5],
  ['F', { id: 'F', generate: (r) => Fp.build(Fp.sample(r)) }, 5],
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
        expect(/[\u0000-\u001f\u007f]/.test(text.replace(/\n/g, ' ')), `${s}: control character in ${JSON.stringify(text)}`).toBe(false)
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

function jacobi(M: number[][]): number[] {
  const n = M.length
  const a = M.map((r) => [...r])
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] ** 2
    if (off < 1e-20) break
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(a[p][q]) < 1e-300) continue
      const th = (a[q][q] - a[p][p]) / (2 * a[p][q])
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1))
      const c = 1 / Math.sqrt(t * t + 1), s = t * c
      for (let k = 0; k < n; k++) { const kp = a[k][p], kq = a[k][q]; a[k][p] = c * kp - s * kq; a[k][q] = s * kp + c * kq }
      for (let k = 0; k < n; k++) { const pk = a[p][k], qk = a[q][k]; a[p][k] = c * pk - s * qk; a[q][k] = s * pk + c * qk }
    }
  }
  return a.map((r, i) => r[i]).sort((x, y) => y - x)
}

// ---------- A ----------
describe('generator A against independent computation', () => {
  it('exact normal equations; gradient descent by its linear recursion; logistic gradient by finite differences (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      const n = 6
      const sx = p.xs.reduce((a, v) => a.add(F(v)), F(0)), sy = p.ys.reduce((a, v) => a.add(F(v)), F(0))
      const sxx = p.xs.reduce((a, v) => a.add(F(v * v)), F(0)), sxy = p.xs.reduce((a, v, i) => a.add(F(v * p.ys[i])), F(0))
      const [a0, b0] = solveFr([[F(n), sx], [sx, sxx]], [sy, sxy]).map((v) => v.num)
      const mse = (x: number[], y: number[]) => x.reduce((q, v, i) => q + (y[i] - a0 - b0 * v) ** 2, 0) / x.length
      close(ans[0], mse(p.xs, p.ys), 1e-9)
      close(ans[1], mse(p.xt, p.yt), 1e-9)
      // gradient descent for squared loss without intercept: w' = (1 - 2 eta Sxx/n) w + 2 eta Sxy/n
      const Sxx = sxx.num, Sxy = sxy.num
      let w = 0
      for (let t = 0; t < p.steps; t++) w = (1 - (2 * p.eta * Sxx) / n) * w + (2 * p.eta * Sxy) / n
      close(ans[2], w, 1e-9)
      const loss = (ww: number) => -p.lx.reduce((q, v, i) => q + p.ly[i] * Math.log(1 / (1 + Math.exp(-ww * v))) + (1 - p.ly[i]) * Math.log(1 - 1 / (1 + Math.exp(-ww * v))), 0) / p.lx.length
      const h = 1e-6
      close(ans[3], (loss(p.w0 + h) - loss(p.w0 - h)) / (2 * h), 1e-6)
      close(ans[4], loss(p.w0), 1e-9)
    }
  })
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  it('minimiser of the table, fold mean, neighbours by sorting, kernel value (300 seeds)', () => {
    for (const s of seeds('B', 300)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      let bi = 0
      p.cv.forEach((v, i) => { if (v < p.cv[bi]) bi = i })
      close(ans[0], p.lams[bi], 1e-12)
      close(ans[1], p.folds.reduce((a, v) => a + v, 0) / 5, 1e-12)
      close(ans[2], Math.exp(-p.gamma * ((p.u[0] - p.v[0]) ** 2 + (p.u[1] - p.v[1]) ** 2)), 1e-12)
      const order = p.xs.map((x, i) => ({ d: Math.abs(x - p.x0), i })).sort((a, b) => a.d - b.d)
      expect(order[p.k - 1].d).toBeLessThan(order[p.k].d)
      const near = order.slice(0, p.k).map((o) => o.i)
      close(ans[3], near.reduce((a, i) => a + p.ys[i], 0) / p.k, 1e-12)
      close(ans[4], near.reduce((a, i) => a + p.cls[i], 0) / p.k, 1e-12)
    }
  })
})

// ---------- C ----------
describe('generator C against independent computation', () => {
  it('margins by projection onto the decision line; hinge and support counts (300 seeds)', () => {
    for (const s of seeds('C', 300)) {
      const p = C.sample(makeRng(s))
      const ans = answers(C.build(p))
      const nrm = Math.sqrt(p.w[0] ** 2 + p.w[1] ** 2)
      close(ans[0], 2 / nrm, 1e-12)
      const fm = p.pts.map((q, i) => p.y[i] * (p.w[0] * q[0] + p.w[1] * q[1] + p.b))
      expect(ans[1]).toBe(fm[0])
      close(ans[2], fm.reduce((a, m) => a + Math.max(0, 1 - m), 0), 1e-12)
      expect(ans[3]).toBe(fm.filter((m) => m <= 1).length)
      // distance from the point to the line w.x + b = 0 via the foot of the perpendicular
      const k = fm.indexOf(Math.min(...fm))
      const q = p.pts[k]
      const t = -(p.w[0] * q[0] + p.w[1] * q[1] + p.b) / (nrm * nrm)
      const foot = [q[0] + t * p.w[0], q[1] + t * p.w[1]]
      close(ans[4], Math.hypot(q[0] - foot[0], q[1] - foot[1]), 1e-9)
      expect(p.y.every((yy, i) => yy * (p.w[0] * p.pts[i][0] + p.w[1] * p.pts[i][1] + p.b) > 0)).toBe(true)
    }
  })
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('Gini as 2p(1-p), entropy from natural logs, gains (300 seeds)', () => {
    for (const s of seeds('D', 300)) {
      const p = D.sample(makeRng(s))
      const ans = answers(D.build(p))
      const g2 = (c: number[]) => { const n = c[0] + c[1]; const q = c[1] / n; return 2 * q * (1 - q) }
      const e2 = (c: number[]) => { const n = c[0] + c[1]; return -[c[0], c[1]].filter((v) => v > 0).reduce((a, v) => a + (v / n) * (Math.log(v / n) / Math.LN2), 0) }
      const par = [p.l[0] + p.r[0], p.l[1] + p.r[1]]
      const wl = (p.l[0] + p.l[1]) / (par[0] + par[1]), wr = 1 - wl
      close(ans[0], g2(par), 1e-12)
      close(ans[1], wl * g2(p.l) + wr * g2(p.r), 1e-12)
      close(ans[2], g2(par) - wl * g2(p.l) - wr * g2(p.r), 1e-12)
      close(ans[3], e2(par), 1e-12)
      close(ans[4], e2(par) - wl * e2(p.l) - wr * e2(p.r), 1e-12)
      expect(ans[2]).toBeGreaterThan(0)
    }
  })
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  it('posterior as a logistic function; the boundary has posterior one half; naive Bayes by enumeration (300 seeds)', () => {
    for (const s of seeds('E', 300)) {
      const p = E.sample(makeRng(s))
      const ans = answers(E.build(p))
      close(ans[0], p.rho * p.s2 + ((1 - p.rho) * p.s2) / p.B, 1e-12)
      close(ans[1], p.rho * p.s2, 1e-12)
      const lo = Math.log(p.pi1 / (1 - p.pi1)) + ((p.m1 - p.m0) * (p.x - (p.m0 + p.m1) / 2)) / (p.sd * p.sd)
      close(ans[2], 1 / (1 + Math.exp(-lo)), 1e-12)
      const bx = ans[3]
      const lob = Math.log(p.pi1 / (1 - p.pi1)) + ((p.m1 - p.m0) * (bx - (p.m0 + p.m1) / 2)) / (p.sd * p.sd)
      close(lob, 0, 1e-9)
      // naive Bayes: enumerate all four feature patterns and normalise the joint with the observed pattern
      const joint = (cls: number) => { let tot = 0; for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) { const pr = cls ? p.q : p.r; tot += (a ? pr[0] : 1 - pr[0]) * (b ? pr[1] : 1 - pr[1]) }; return tot }
      expect(joint(0)).toBeCloseTo(1, 12)
      expect(joint(1)).toBeCloseTo(1, 12)
      const pr1 = (p.obs[0] ? p.q[0] : 1 - p.q[0]) * (p.obs[1] ? p.q[1] : 1 - p.q[1]) * p.pi1
      const pr0 = (p.obs[0] ? p.r[0] : 1 - p.r[0]) * (p.obs[1] ? p.r[1] : 1 - p.r[1]) * (1 - p.pi1)
      close(ans[4], pr1 / (pr1 + pr0), 1e-12)
    }
  })
  it('Monte Carlo: the variance of an average of correlated predictors', () => {
    for (const [B, s2, rho] of [[10, 2, 0.3], [25, 1, 0.5], [100, 4, 0.1]] as const) {
      const ans = answers(E.build({ B, s2, rho, m0: 0, m1: 2, sd: 1, pi1: 0.3, x: 1, q: [0.5, 0.5], r: [0.2, 0.2], obs: [1, 1] }))
      const rng = makeRng(`bag${B}`)
      let sum = 0, sq = 0
      const N = 40000
      for (let t = 0; t < N; t++) {
        const common = Math.sqrt(rho * s2) * gauss(rng)
        let avg = 0
        for (let b = 0; b < B; b++) avg += common + Math.sqrt((1 - rho) * s2) * gauss(rng)
        avg /= B
        sum += avg; sq += avg * avg
      }
      rel(sq / N - (sum / N) ** 2, ans[0], 0.04)
    }
  }, 60000)
})

// ---------- F ----------
describe('generator F against independent computation', () => {
  it('eigenvalues by Jacobi rotations; eigenvector orthogonality; scores (300 seeds)', () => {
    for (const s of seeds('F', 300)) {
      const p = Fp.sample(makeRng(s))
      const ans = answers(Fp.build(p))
      const eig = jacobi([[p.a, p.b], [p.b, p.d]])
      close(ans[0], eig[0], 1e-9)
      close(ans[1], eig[1], 1e-9)
      close(ans[2], eig[0] / (eig[0] + eig[1]), 1e-9)
      // unit eigenvector: S v = lambda v
      const v0 = ans[3], v1 = Math.sqrt(1 - v0 * v0)
      close(p.a * v0 + p.b * v1, eig[0] * v0, 1e-9)
      close(p.b * v0 + p.d * v1, eig[0] * v1, 1e-9)
      close(ans[4], p.px * v0 + p.py * v1, 1e-9)
    }
  })
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  it('nearest centres by argmin; the converged partition cannot be improved by moving a point (300 seeds)', () => {
    for (const s of seeds('G', 300)) {
      const p = G.sample(makeRng(s))
      const ans = answers(G.build(p))
      let c = [...p.c]
      const results: { g: number[]; c: number[]; w: number }[] = []
      for (let it = 0; it < 2; it++) {
        const g = p.x.map((v) => (Math.abs(v - c[0]) <= Math.abs(v - c[1]) ? 0 : 1))
        const nc = [0, 1].map((j) => { const m = p.x.filter((_, i) => g[i] === j); return m.reduce((a, v) => a + v, 0) / m.length })
        c = nc
        results.push({ g, c: nc, w: p.x.reduce((a, v, i) => a + (v - nc[g[i]]) ** 2, 0) })
      }
      expect(ans[0]).toBe(results[0].g.filter((v) => v === 0).length)
      close(ans[1], results[0].c[0], 1e-12)
      close(ans[2], results[0].c[1], 1e-12)
      close(ans[3], results[0].w, 1e-9)
      close(ans[4], results[1].w, 1e-9)
      expect(ans[4]).toBeLessThanOrEqual(ans[3] + 1e-9)
    }
    // after enough iterations the partition is a local optimum: no single point can move and lower the within-cluster sum of squares
    const p = G.sample(makeRng('conv'))
    let c = [...p.c], g: number[] = []
    for (let it = 0; it < 50; it++) { g = p.x.map((v) => (Math.abs(v - c[0]) <= Math.abs(v - c[1]) ? 0 : 1)); c = [0, 1].map((j) => { const m = p.x.filter((_, i) => g[i] === j); return m.length ? m.reduce((a, v) => a + v, 0) / m.length : c[j] }) }
    const wc = (gg: number[]) => [0, 1].reduce((a, j) => { const m = p.x.filter((_, i) => gg[i] === j); if (!m.length) return a; const mu = m.reduce((q, v) => q + v, 0) / m.length; return a + m.reduce((q, v) => q + (v - mu) ** 2, 0) }, 0)
    for (let i = 0; i < 6; i++) { const alt = [...g]; alt[i] = 1 - alt[i]; expect(wc(alt)).toBeGreaterThanOrEqual(wc(g) - 1e-9) }
  })
})

// ---------- H ----------
describe('generator H against independent computation', () => {
  it('AUC as the trapezoid area under the ROC curve; threshold metrics by counting (300 seeds)', () => {
    for (const s of seeds('H', 300)) {
      const p = H.sample(makeRng(s))
      const ans = answers(H.build(p))
      const P = p.labels.filter((l) => l === 1).length, N = 8 - P
      // ROC points: sweep the threshold downwards through the sorted scores
      const order = p.scores.map((sc, i) => ({ sc, l: p.labels[i] })).sort((a, b) => b.sc - a.sc)
      let tp = 0, fp = 0, area = 0, prevT = 0, prevF = 0
      for (const o of order) { if (o.l === 1) tp++; else fp++; const t = tp / P, f = fp / N; area += ((f - prevF) * (t + prevT)) / 2; prevT = t; prevF = f }
      close(ans[0], area, 1e-12)
      const pred = p.scores.map((sc) => sc >= p.thr)
      const TP = pred.filter((q, i) => q && p.labels[i] === 1).length, FP = pred.filter((q, i) => q && p.labels[i] === 0).length, FN = P - TP
      close(ans[1], TP / (TP + FP), 1e-12)
      close(ans[2], TP / (TP + FN), 1e-12)
      close(ans[3], (2 * TP) / (2 * TP + FP + FN), 1e-12)
      close(ans[4], (8 - FP - FN) / 8, 1e-12)
    }
  })
})
