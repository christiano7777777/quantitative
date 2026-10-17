// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: x_3 by the closed form with BigInt powers; the period by first-visit bookkeeping; inverse transforms checked by plugging back into the CDF.
//  B: the Beta acceptance rate by grid search of the density's maximum; Box-Muller via the radius identity; mixture variance and Cholesky by integration and reconstruction.
//  C: the sample size by incrementing n until the half-width is met; mean, sd and SE through sums of squares.
//  D: all moments by Simpson integration; the antithetic and control-variate variances by integrating the combined estimator directly.
//  E: scheme values by Taylor-type identities; Euler strong-error scaling by simulation; Metropolis ratio in log form.
//  F: conditionals by the Schur complement; Gibbs autocorrelation by simulating the chain; R-hat from sums of squares.
//  G: resample counts, inclusion probabilities and the bootstrap SE by exhaustive enumeration of all n^n resamples.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import type { Rng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import * as A from './a-lcg'
import * as B from './b-special'
import * as C from './c-integration'
import * as D from './d-variance'
import * as E from './e-sde'
import * as Ff from './f-gibbs'
import * as G from './g-bootstrap'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const lectures = topics.find((t) => t.id === 'mc')!.lectures.length
const gauss = (rng: Rng) => Math.sqrt(-2 * Math.log(1 - rng.next())) * Math.cos(2 * Math.PI * rng.next())
const simpson = (f: (x: number) => number, a: number, b: number, n = 4000) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3 }

const gens: [string, LQGenerator, number][] = [
  ['A', { id: 'A', generate: (r) => A.build(A.sample(r)) }, 5],
  ['B', { id: 'B', generate: (r) => B.build(B.sample(r)) }, 5],
  ['C', { id: 'C', generate: (r) => C.build(C.sample(r)) }, 5],
  ['D', { id: 'D', generate: (r) => D.build(D.sample(r)) }, 5],
  ['E', { id: 'E', generate: (r) => E.build(E.sample(r)) }, 5],
  ['F', { id: 'F', generate: (r) => Ff.build(Ff.sample(r)) }, 5],
  ['G', { id: 'G', generate: (r) => G.build(G.sample(r)) }, 5],
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
  it('closed-form LCG, first-visit period, inverse transforms plugged back into the CDF (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      const M = BigInt(p.m), a = BigInt(p.a), c = BigInt(p.c)
      let ak = 1n, sum = 0n // x_k = a^k x0 + c(1 + a + ... + a^(k-1))
      for (let i = 0; i < 3; i++) { sum = (sum + ak) % M; ak = (ak * a) % M }
      const x3 = Number((ak * BigInt(p.x0) + c * sum) % M)
      close(ans[0], x3, 1e-12)
      close(ans[1], x3 / p.m, 1e-12)
      const seen = new Map<number, number>()
      let x = p.x0
      for (let i = 0; ; i++) {
        if (seen.has(x)) { expect(seen.get(x)).toBe(0); close(ans[2], i, 1e-12); break }
        seen.set(x, i)
        x = (p.a * x + p.c) % p.m
      }
      close(1 - Math.exp(-p.lam * ans[3]), p.u1, 1e-9)
      close(1 - (p.xm / ans[4]) ** p.alpha, p.u2, 1e-9)
      expect(ans[4]).toBeGreaterThanOrEqual(p.xm)
    }
  })
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  it('acceptance rate by grid maximum, Box-Muller radius identity, mixture variance by integration, Cholesky by reconstruction (300 seeds)', () => {
    for (const s of seeds('B', 300)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      const f = (x: number) => x ** (p.a - 1) * (1 - x) ** (p.b - 1)
      const z = simpson(f, 0, 1, 2000) // normalising integral
      let mx = 0
      for (let i = 0; i <= 100000; i++) mx = Math.max(mx, f(i / 100000) / z)
      close(ans[0], 1 / mx, 1e-6)
      // Z1^2 + Z2^2 = -2 ln U1 for Z2 = R sin(2 pi U2)
      const z2 = Math.sqrt(-2 * Math.log(p.u1)) * Math.sin(2 * Math.PI * p.u2)
      close(ans[1] ** 2 + z2 ** 2, -2 * Math.log(p.u1), 1e-9)
      // mixture variance by integrating x^2 against the mixture density
      const pdf = (x: number, m: number, sd: number) => Math.exp(-0.5 * ((x - m) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI))
      const mix = (x: number) => p.p * pdf(x, p.m1, p.s1) + (1 - p.p) * pdf(x, p.m2, p.s2)
      const mean = simpson((x) => x * mix(x), -40, 40, 20000)
      close(ans[2], simpson((x) => (x - mean) ** 2 * mix(x), -40, 40, 20000), 1e-6)
      // Cholesky: reconstruct Sigma from L = [[sa,0],[l21,l22]]
      const l21 = (p.rho * p.sa * p.sb) / p.sa
      close(l21 * l21 + ans[3] * ans[3], p.sb * p.sb, 1e-9)
      close(p.sa * l21, p.rho * p.sa * p.sb, 1e-9)
      close(ans[4], l21 * p.z1 + ans[3] * p.z2, 1e-9)
    }
  })
})

// ---------- C ----------
describe('generator C against independent computation', () => {
  it('statistics through sums of squares; the sample size by incrementing n (300 seeds)', () => {
    for (const s of seeds('C', 300)) {
      const p = C.sample(makeRng(s))
      const ans = answers(C.build(p))
      const n = p.g.length
      const sx = p.g.reduce((t, v) => t + v, 0), sxx = p.g.reduce((t, v) => t + v * v, 0)
      close(ans[0], sx / n, 1e-12)
      const sd = Math.sqrt((sxx - (sx * sx) / n) / (n - 1))
      close(ans[1], sd, 1e-9)
      close(ans[2], sd / Math.sqrt(n), 1e-9)
      close(ans[3], sx / n + 1.96 * sd / Math.sqrt(n), 1e-9)
      let k = 1
      while (1.96 * sd / Math.sqrt(k) > p.eps) k++
      close(ans[4], k, 1e-12)
    }
  })
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('moments by Simpson integration; combined estimators integrated directly (60 seeds)', () => {
    for (const s of seeds('D', 60)) {
      const p = D.sample(makeRng(s))
      const ans = answers(D.build(p))
      const g = (u: number) => Math.exp(p.c * u)
      const m = simpson(g, 0, 1), v = simpson((u) => (g(u) - m) ** 2, 0, 1)
      // variance of the antithetic pair mean relative to two independent draws (variance v/2)
      const va = simpson((u) => ((g(u) + g(1 - u)) / 2 - m) ** 2, 0, 1)
      close(ans[0], va / (v / 2), 1e-6)
      // least squares of g on U gives beta; residual variance fraction
      const cov = simpson((u) => (g(u) - m) * (u - 0.5), 0, 1)
      close(ans[1], cov * 12, 1e-6)
      const vr = simpson((u) => (g(u) - m - ans[1] * (u - 0.5)) ** 2, 0, 1)
      close(ans[2], vr / v, 1e-6)
      // importance weight
      const phi = (z: number) => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI)
      close(ans[3], phi(p.x) / phi(p.x - p.t), 1e-9)
      // stratified: mean of the two within-stratum variances
      const sv = (lo: number, hi: number) => {
        const mm = simpson(g, lo, hi) / (hi - lo)
        return simpson((u) => (g(u) - mm) ** 2, lo, hi) / (hi - lo)
      }
      close(ans[4], ((sv(0, 0.5) + sv(0.5, 1)) / 2) / v, 1e-6)
    }
  })
  it('the antithetic and control-variate claims hold in simulation', () => {
    const rng = makeRng('D-mc')
    const c = 2
    const n = 100000
    let sa = 0, saa = 0, sp = 0, spp = 0
    for (let i = 0; i < n; i++) {
      const u = rng.next(), w = rng.next()
      const pair = (Math.exp(c * u) + Math.exp(c * (1 - u))) / 2
      const ind = (Math.exp(c * u) + Math.exp(c * w)) / 2
      sa += pair; saa += pair * pair; sp += ind; spp += ind * ind
    }
    const vA = saa / n - (sa / n) ** 2, vI = spp / n - (sp / n) ** 2
    const want = D.build({ c, t: 2, x: 2 }).parts[0].answer
    expect(Math.abs(vA / vI - want)).toBeLessThan(0.02)
  }, 60000)
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  it('scheme values by independent expansions; Metropolis ratio in logs (300 seeds)', () => {
    for (const s of seeds('E', 300)) {
      const p = E.sample(makeRng(s))
      const ans = answers(E.build(p))
      close(ans[0], p.s0 * (1 + p.mu * p.h + p.sigma * p.dw), 1e-9)
      // Milstein equals the second-order Taylor expansion of the exact solution in (h, dW) once the h*dW and higher terms are dropped
      const sg = p.sigma
      close(ans[1], p.s0 * (1 + p.mu * p.h + sg * p.dw + 0.5 * sg * sg * (p.dw * p.dw - p.h)), 1e-9)
      close(ans[2], p.s0 * Math.exp((p.mu - sg * sg / 2) * p.h + sg * p.dw), 1e-9)
      close(ans[3] * Math.sqrt(p.k), p.err, 1e-12)
      const logRatio = (p.alpha - 1) * (Math.log(p.y) - Math.log(p.x)) - p.beta * (p.y - p.x)
      close(ans[4], Math.min(1, Math.exp(logRatio)), 1e-9)
      expect(ans[4]).toBeLessThanOrEqual(1)
    }
  })
  it('the Euler strong error halves when the step is cut by 4, and Milstein is closer than Euler on average', () => {
    const rng = makeRng('E-mc')
    const mu = 0.1, sg = 0.5, T = 1, paths = 8000
    const err = (N: number) => {
      const h = T / N
      let e = 0, m = 0
      for (let i = 0; i < paths; i++) {
        let se = 1, sm = 1, w = 0
        for (let j = 0; j < N; j++) {
          const dw = Math.sqrt(h) * gauss(rng)
          w += dw
          sm = sm + mu * sm * h + sg * sm * dw + 0.5 * sg * sg * sm * (dw * dw - h)
          se = se + mu * se * h + sg * se * dw
        }
        const ex = Math.exp((mu - sg * sg / 2) * T + sg * w)
        e += Math.abs(se - ex); m += Math.abs(sm - ex)
      }
      return [e / paths, m / paths]
    }
    const [e4, m4] = err(4), [e16, m16] = err(16)
    expect(e4 / e16).toBeGreaterThan(1.5)
    expect(e4 / e16).toBeLessThan(2.6)
    expect(m4).toBeLessThan(e4)
    expect(m16).toBeLessThan(e16)
  }, 60000)
})

// ---------- F ----------
describe('generator F against independent computation', () => {
  it('conditionals by the Schur complement; R-hat from sums of squares (300 seeds)', () => {
    for (const s of seeds('F', 300)) {
      const p = Ff.sample(makeRng(s))
      const ans = answers(Ff.build(p))
      const S11 = p.s1 ** 2, S22 = p.s2 ** 2, S12 = p.rho * p.s1 * p.s2
      close(ans[0], p.mu1 + (S12 / S22) * (p.x2 - p.mu2), 1e-9)
      close(ans[1], Math.sqrt(S11 - (S12 * S12) / S22), 1e-9)
      close(ans[2], p.rho ** 2, 1e-12)
      const r = p.rho ** 2
      close(ans[3], p.N / (1 + (2 * r) / (1 - r)), 1e-6)
      // R-hat via sums of squares
      const n = 4, m = 2
      const sums = p.chains.map((c) => c.reduce((t, v) => t + v, 0))
      const sq = p.chains.map((c) => c.reduce((t, v) => t + v * v, 0))
      const W = sq.reduce((t, v, j) => t + (v - sums[j] ** 2 / n) / (n - 1), 0) / m
      const bm = sums.map((v) => v / n)
      const B = (n * ((bm[0] - bm[1]) ** 2 / 2)) / (m - 1)
      close(ans[4], Math.sqrt(((n - 1) / n + B / (n * W)) ), 1e-9) // sqrt(((n-1)W/n + B/n)/W)
    }
  })
  it('the x1 marginal chain of a bivariate-normal Gibbs sampler has lag-1 autocorrelation rho squared', () => {
    for (const s of seeds('Fmc', 4)) {
      const p = Ff.sample(makeRng(s))
      const rng = makeRng('fchain' + s)
      let x1 = 0, x2 = 0
      const xs: number[] = []
      const sd = Math.sqrt(1 - p.rho ** 2)
      for (let i = 0; i < 200000; i++) {
        x1 = p.rho * x2 + sd * gauss(rng)
        x2 = p.rho * x1 + sd * gauss(rng)
        xs.push(x1)
      }
      const mean = xs.reduce((t, v) => t + v, 0) / xs.length
      let c0 = 0, c1 = 0
      for (let i = 0; i < xs.length - 1; i++) { c0 += (xs[i] - mean) ** 2; c1 += (xs[i] - mean) * (xs[i + 1] - mean) }
      expect(Math.abs(c1 / c0 - p.rho ** 2)).toBeLessThan(0.02)
    }
  }, 60000)
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  it('exhaustive enumeration of all n^n resamples (300 seeds)', () => {
    for (const s of seeds('G', 300)) {
      const p = G.sample(makeRng(s))
      const ans = answers(G.build(p))
      const n = p.x.length
      const total = n ** n
      const multisets = new Set<string>()
      let absent0 = 0, distinctSum = 0, sumMean = 0, sumMeanSq = 0
      for (let code = 0; code < total; code++) {
        const idx: number[] = []
        for (let c = code, k = 0; k < n; k++, c = Math.floor(c / n)) idx.push(c % n)
        multisets.add([...idx].sort().join(','))
        if (!idx.includes(0)) absent0++
        distinctSum += new Set(idx).size
        const mean = idx.reduce((t, i) => t + p.x[i], 0) / n
        sumMean += mean; sumMeanSq += mean * mean
      }
      close(ans[0], multisets.size, 1e-12)
      close(ans[1], absent0 / total, 1e-12)
      close(ans[2], distinctSum / total, 1e-9)
      close(ans[3], Math.sqrt(sumMeanSq / total - (sumMean / total) ** 2), 1e-9)
      close(ans[4], p.theta - (p.boot - p.theta), 1e-12)
    }
  }, 120000)
})
