// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: exact fractions for sample moments; Monte Carlo of an ARCH(1) process for its variance and kurtosis.
//  B: the variance recursion iterated step by step; Monte Carlo of a GARCH(1,1) path for the long-run variance.
//  D: exact fractions; Monte Carlo of noisy intraday prices for the bias of realised variance.
//  E: eigenvalue by bisection on the characteristic polynomial; forecasts and impulse response by iterating the recursion; mean by iteration and exact solve.
//  F: exact normal equations; the spread recursion iterated; the half-life checked by powering.
//  G: posterior mean and variance by numerical integration of prior times likelihood; Monte Carlo of the variances.
//  H: Bayes by enumerating the joint law of the two regimes; Monte Carlo of run lengths; the stationary law by powering the transition matrix.
//  I: the discrete Fourier sum with cosines and sines; the AR(1) spectrum as a Fourier series of its autocovariances.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import type { Rng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { F, solveFr } from '../../../shared/fraction'
import * as A from './a-returns'
import * as B from './b-garch'
import * as D from './d-realised'
import * as E from './e-var'
import * as Fc from './f-cointegration'
import * as G from './g-kalman'
import * as H from './h-regime'
import * as I from './i-spectral'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const rel = (got: number, want: number, r: number) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(r * Math.abs(want))
const lectures = topics.find((t) => t.id === 'ts2')!.lectures.length
const gauss = (rng: Rng) => Math.sqrt(-2 * Math.log(1 - rng.next())) * Math.cos(2 * Math.PI * rng.next())

const gens: [string, LQGenerator, number][] = [
  ['A', { id: 'A', generate: (r) => A.build(A.sample(r)) }, 5],
  ['B', { id: 'B', generate: (r) => B.build(B.sample(r)) }, 5],
  ['D', { id: 'D', generate: (r) => D.build(D.sample(r)) }, 5],
  ['E', { id: 'E', generate: (r) => E.build(E.sample(r)) }, 5],
  ['F', { id: 'F', generate: (r) => Fc.build(Fc.sample(r)) }, 5],
  ['G', { id: 'G', generate: (r) => G.build(G.sample(r)) }, 5],
  ['H', { id: 'H', generate: (r) => H.build(H.sample(r)) }, 5],
  ['I', { id: 'I', generate: (r) => I.build(I.sample(r)) }, 5],
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
  it('sample variance and kurtosis by exact fractions, ARCH formulas (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      const n = p.tenths.length
      const sum = p.tenths.reduce((a, v) => a + v, 0), sq = p.tenths.reduce((a, v) => a + v * v, 0)
      // sum (r - mean)^2 = (n sum x^2 - (sum x)^2) / n in tenths, then scaled by 1/100
      const ss = F(n * sq - sum * sum, n * 100)
      close(ans[0], ss.div(F(n - 1)).num, 1e-9)
      const mean = F(sum, 10 * n)
      let c2 = F(0), c4 = F(0)
      for (const t of p.tenths) { const d = F(t, 10).sub(mean); c2 = c2.add(d.mul(d)); c4 = c4.add(d.mul(d).mul(d).mul(d)) }
      const m2 = c2.div(F(n)), m4 = c4.div(F(n))
      close(ans[1], m4.div(m2.mul(m2)).num, 1e-9)
      const w = F(Math.round(p.omega * 10), 10), a = F(Math.round(p.alpha * 10), 10)
      const last = F(p.tenths[n - 1], 10)
      close(ans[2], w.add(a.mul(last).mul(last)).num, 1e-12)
      close(ans[3], w.div(F(1).sub(a)).num, 1e-12)
      close(ans[4], F(3).mul(F(1).sub(a.mul(a))).div(F(1).sub(F(3).mul(a).mul(a))).num, 1e-12)
    }
  })
  it('Monte Carlo: an ARCH(1) process has the stated unconditional variance and kurtosis', () => {
    for (const alpha of [0.1, 0.2, 0.3]) {
      const omega = 0.2
      const ans = answers(A.build({ tenths: [1, 2, 3, 5, -4, 6, -2, 8], omega, alpha }))
      const rng = makeRng('arch' + alpha)
      let e = 0, m2 = 0, m4 = 0
      const N = 3_000_000
      for (let t = 0; t < N; t++) {
        const eps = Math.sqrt(omega + alpha * e * e) * gauss(rng)
        e = eps
        m2 += eps * eps; m4 += eps ** 4
      }
      rel(m2 / N, ans[3], 0.03)
      rel(m4 / N / (m2 / N) ** 2, ans[4], 0.12)
    }
  }, 60000)
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  it('the recursion iterated step by step reproduces next-period, long-run, h-step and GJR values (300 seeds)', () => {
    for (const s of seeds('B', 300)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      const next = p.omega + p.alpha * p.r ** 2 + p.beta * p.sig2
      close(ans[0], next, 1e-12)
      // long run: iterate E[sigma^2] = omega + (alpha + beta) E[sigma^2] to its fixed point
      let v = 1
      for (let i = 0; i < 20000; i++) v = p.omega + (p.alpha + p.beta) * v
      close(ans[1], v, 1e-6)
      // h-step: step the conditional expectation (E eps^2 = sigma^2 beyond T+1)
      let s2 = next
      for (let k = 2; k <= p.h; k++) s2 = p.omega + (p.alpha + p.beta) * s2
      close(ans[2], s2, 1e-9)
      const gjr = (shock: number) => p.omega + p.alpha * shock ** 2 + (shock < 0 ? p.gamma * shock ** 2 : 0) + p.beta * p.sig2
      close(ans[3], gjr(-p.r), 1e-12)
      close(ans[4], gjr(p.r), 1e-12)
      expect(ans[3]).toBeGreaterThan(ans[4])
    }
  })
  it('Monte Carlo: the average squared shock of a simulated GARCH(1,1) path is the long-run variance (4 seeds)', () => {
    let done = 0
    for (const s of seeds('B', 200)) {
      const p = B.sample(makeRng(s))
      if (p.alpha + p.beta > 0.93 || done >= 4) continue
      done++
      const ans = answers(B.build(p))
      const rng = makeRng('sim' + s)
      let s2 = ans[1], sum = 0
      const N = 1_500_000
      for (let t = 0; t < N; t++) {
        const e = Math.sqrt(s2) * gauss(rng)
        sum += e * e
        s2 = p.omega + p.alpha * e * e + p.beta * s2
      }
      rel(sum / N, ans[1], 0.06)
    }
    expect(done).toBe(4)
  }, 60000)
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('exact sums and the jump-robust estimator (300 seeds)', () => {
    for (const s of seeds('D', 300)) {
      const p = D.sample(makeRng(s))
      const ans = answers(D.build(p))
      const rv = p.tenths.reduce((a, t) => a.add(F(t * t, 100)), F(0))
      close(ans[0], rv.num, 1e-12)
      let bp = 0
      for (let i = 1; i < 6; i++) bp += (Math.abs(p.tenths[i]) * Math.abs(p.tenths[i - 1])) / 100
      close(ans[1], (Math.PI * bp) / 2, 1e-12)
      close(ans[2], rv.num - (Math.PI * bp) / 2, 1e-12)
      close(ans[3], p.iv + 2 * p.n * p.w2, 1e-12)
      close(ans[4], Math.sqrt(252) * Math.sqrt(rv.num), 1e-9)
    }
  })
  it('Monte Carlo: noisy prices inflate realised variance by 2 n omega^2', () => {
    for (const [iv, n, w2] of [[1, 78, 0.0005], [2, 156, 0.0002], [1.5, 78, 0.001]] as const) {
      const rng = makeRng(`noise${iv}${n}${w2}`)
      let total = 0
      const runs = 8000
      for (let r = 0; r < runs; r++) {
        let price = 0, eta = Math.sqrt(w2) * gauss(rng), prev = eta, rv = 0
        for (let i = 0; i < n; i++) {
          price += Math.sqrt(iv / n) * gauss(rng)
          eta = Math.sqrt(w2) * gauss(rng)
          const obs = price + eta
          rv += (obs - prev) ** 2
          prev = obs
        }
        total += rv
      }
      rel(total / runs, iv + 2 * n * w2, 0.03)
    }
  }, 60000)
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  it('eigenvalue by bisection, forecasts and impulse response by iteration, mean by exact solve (300 seeds)', () => {
    for (const s of seeds('E', 300)) {
      const p = E.sample(makeRng(s))
      const ans = answers(E.build(p))
      const { A: M, c, y } = p
      const det = (l: number) => (M[0][0] - l) * (M[1][1] - l) - M[0][1] * M[1][0]
      const bigRoot = (() => { let a = Math.max(M[0][0], M[1][1]), b = 2; for (let it = 0; it < 200; it++) { const m = (a + b) / 2; if (det(m) < 0) a = m; else b = m } return (a + b) / 2 })()
      close(ans[0], bigRoot, 1e-9)
      // iterate the forecast recursion
      let cur = [...y]
      const step = (v: number[]) => [c[0] + M[0][0] * v[0] + M[0][1] * v[1], c[1] + M[1][0] * v[0] + M[1][1] * v[1]]
      cur = step(cur); close(ans[1], cur[0], 1e-12)
      cur = step(cur); close(ans[2], cur[1], 1e-12)
      // impulse response: two paths from zero, one shocked in component 2 at time 1, without constants and noise
      let base = [0, 0], shocked = [0, 1]
      const lin = (v: number[]) => [M[0][0] * v[0] + M[0][1] * v[1], M[1][0] * v[0] + M[1][1] * v[1]]
      shocked = lin(shocked); base = lin(base)
      shocked = lin(shocked)
      close(ans[3], shocked[0] - base[0], 1e-12)
      // mean: exact solve and long iteration agree with the answer
      const sol = solveFr([[F(Math.round((1 - M[0][0]) * 10), 10), F(-Math.round(M[0][1] * 10), 10)], [F(-Math.round(M[1][0] * 10), 10), F(Math.round((1 - M[1][1]) * 10), 10)]], [F(Math.round(c[0] * 10), 10), F(Math.round(c[1] * 10), 10)])
      close(ans[4], sol[0].num, 1e-9)
      let it2 = [0, 0]
      for (let i = 0; i < 5000; i++) it2 = step(it2)
      close(ans[4], it2[0], 1e-6)
    }
  })
})

// ---------- F ----------
describe('generator F against independent computation', () => {
  it('exact normal equations, error-correction step, spread recursion and half-life (300 seeds)', () => {
    for (const s of seeds('F', 300)) {
      const p = Fc.sample(makeRng(s))
      const ans = answers(Fc.build(p))
      const n = 6
      const X = p.x.map((v) => F(v)), Y = p.y.map((v) => F(Math.round(v * 10), 10))
      const sx = X.reduce((a, v) => a.add(v), F(0)), sy = Y.reduce((a, v) => a.add(v), F(0))
      const sxx = X.reduce((a, v) => a.add(v.mul(v)), F(0)), sxy = X.reduce((a, v, i) => a.add(v.mul(Y[i])), F(0))
      const sol = solveFr([[F(n), sx], [sx, sxx]], [sy, sxy])
      const [a0, b0] = [sol[0], sol[1]]
      close(ans[0], b0.num, 1e-12)
      const e = Y[5].sub(a0).sub(b0.mul(X[5]))
      close(ans[1], e.num, 1e-9)
      close(ans[2], p.ay * e.num, 1e-9)
      // iterate the spread: z = y - b x moves by dy - b dx, with dy = ay e, dx = ax e
      const z0 = 1
      const dy = p.ay * z0, dx = p.ax * z0
      const phi = (z0 + dy - b0.num * dx) / z0
      close(ans[3], phi, 1e-12)
      close(phi ** ans[4], 0.5, 1e-9)
    }
  })
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  it('posterior by numerical integration of prior times likelihood (300 seeds)', () => {
    const simpson = (f: (x: number) => number, a: number, b: number, n = 4000) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3 }
    for (const s of seeds('G', 300)) {
      const p = G.sample(makeRng(s))
      const ans = answers(G.build(p))
      const lo = p.a - 12 * Math.sqrt(p.P), hi = p.a + 12 * Math.sqrt(p.P)
      const post = (x: number) => Math.exp(-0.5 * (x - p.a) ** 2 / p.P - 0.5 * (p.y - x) ** 2 / p.R)
      const z = simpson(post, lo, hi)
      const m = simpson((x) => x * post(x), lo, hi) / z
      const v = simpson((x) => (x - m) ** 2 * post(x), lo, hi) / z
      close(ans[2], m, 1e-6)
      close(ans[3], v, 1e-6)
      if (p.y !== p.a) close(ans[1], (m - p.a) / (p.y - p.a), 1e-6)
      close(ans[4], v + p.Q, 1e-6)
    }
  })
  it('Monte Carlo: the variance of the prediction error is P + R and the gain is the regression slope of the state on y', () => {
    const rng = makeRng('kalman')
    const P = 2, R = 4, N = 400000
    let sy = 0, syy = 0, sa = 0, say = 0
    for (let t = 0; t < N; t++) {
      const alpha = Math.sqrt(P) * gauss(rng), y = alpha + Math.sqrt(R) * gauss(rng)
      sy += y; syy += y * y; sa += alpha; say += alpha * y
    }
    const ans = answers(G.build({ a: 0, P, Q: 1, R, y: 1 }))
    rel(syy / N - (sy / N) ** 2, ans[0], 0.02)
    rel((say / N - (sa / N) * (sy / N)) / (syy / N - (sy / N) ** 2), ans[1], 0.02)
  }, 60000)
})

// ---------- H ----------
describe('generator H against independent computation', () => {
  it('Bayes by enumerating the joint law, stationary law by powering the matrix (300 seeds)', () => {
    const pdf = (y: number, m: number, sd: number) => Math.exp(-((y - m) ** 2) / (2 * sd * sd)) / Math.sqrt(2 * Math.PI * sd * sd)
    for (const s of seeds('H', 300)) {
      const p = H.sample(makeRng(s))
      const ans = answers(H.build(p))
      const T = [[p.p11, 1 - p.p11], [1 - p.p22, p.p22]]
      const prev = [p.pi, 1 - p.pi]
      const joint = [0, 1].map((j) => [0, 1].map((i) => prev[i] * T[i][j] * pdf(p.y, j === 0 ? p.mu1 : p.mu2, j === 0 ? p.s1 : p.s2)))
      const tot = joint.flat().reduce((a, v) => a + v, 0)
      const priorProb = [0, 1].reduce((a, i) => a + prev[i] * T[i][0], 0)
      close(ans[0], priorProb, 1e-12)
      close(ans[1], pdf(p.y, p.mu1, p.s1) / pdf(p.y, p.mu2, p.s2), 1e-9 * Math.max(1, ans[1]))
      close(ans[2], (joint[0][0] + joint[0][1]) / tot, 1e-10)
      // stationary law by powering the transition matrix
      let d = [0.5, 0.5]
      for (let k = 0; k < 5000; k++) d = [d[0] * T[0][0] + d[1] * T[1][0], d[0] * T[0][1] + d[1] * T[1][1]]
      close(ans[4], d[0], 1e-9)
    }
  })
  it('Monte Carlo: the mean run length of regime 1 is 1/(1-p11)', () => {
    for (const p11 of [0.9, 0.95, 0.98]) {
      const ans = answers(H.build({ mu1: 1, s1: 1, mu2: -1, s2: 2, p11, p22: 0.9, pi: 0.5, y: 0 }))
      const rng = makeRng('dur' + p11)
      let total = 0
      const runs = 100000
      for (let r = 0; r < runs; r++) { let len = 1; while (rng.next() < p11) len++; total += len }
      rel(total / runs, ans[3], 0.03)
    }
  }, 60000)
})

// ---------- I ----------
describe('generator I against independent computation', () => {
  it('periodogram by the cosine and sine sums, AR(1) spectrum as a Fourier series (300 seeds)', () => {
    for (const s of seeds('I', 300)) {
      const p = I.sample(makeRng(s))
      const ans = answers(I.build(p))
      const n = 4
      const per = (w: number) => {
        let re = 0, im = 0
        p.x.forEach((v, t) => { re += v * Math.cos(w * t); im -= v * Math.sin(w * t) })
        return (re * re + im * im) / (2 * Math.PI * n)
      }
      close(ans[0], per(0), 1e-9)
      close(ans[1], per(Math.PI / 2), 1e-9)
      close(ans[2], per(Math.PI), 1e-9)
      const spec = (w: number) => {
        let sum = 0
        for (let h = -3000; h <= 3000; h++) sum += ((p.sig2 * p.phi ** Math.abs(h)) / (1 - p.phi * p.phi)) * Math.cos(w * h)
        return sum / (2 * Math.PI)
      }
      close(ans[3], spec(0), 1e-7)
      close(ans[4], spec(Math.PI), 1e-7)
    }
  })
})
