// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: exact fractions via the raw-moment identity for sample autocovariances; Monte Carlo of a 3-term filter; a long truncated sum for the MA(infinity) variance.
//  B: the spectral integral of |theta(e^{iw})|^2 (a discrete Fourier sum); the invertible MA(1) from the quadratic for rho(1); Monte Carlo of the MA(2).
//  C: exact 3x3 solve of the Yule-Walker system for (gamma0, gamma1, gamma2); psi-weight sums for rho(3); exact 2x2 solve for the estimates; Monte Carlo of an AR(2).
//  D: psi-weight sums for the ACF, a 2x2 Toeplitz solve for the PACF, Monte Carlo of the ARMA(1,1) and of the 95% band under white noise.
//  E: conditional means by running the recursion with zero future noise, variances from unit-shock impulse responses, Monte Carlo of the future paths.
//  F: exact fractions; the CLS estimate by golden-section minimisation of the RSS; the MA(1) moment equation checked by substitution; Monte Carlo of the Ljung-Box mean.
//  G: differences by operator convolution, the DF regression by minimising the RSS and the identity RSS = sum(d^2) - gamma * sum(d x).
//  H: the expanded MA polynomial and its autocovariances by direct summation, Monte Carlo of the seasonal MA, AIC and BIC computed model by model.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import type { Rng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { F, solveFr } from '../../../shared/fraction'
import * as A from './a-sample'
import * as B from './b-ma'
import * as C from './c-ar'
import * as D from './d-arma'
import * as E from './e-forecast'
import * as Fe from './f-estimation'
import * as G from './g-differencing'
import * as H from './h-seasonal'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const lectures = topics.find((t) => t.id === 'ts1')!.lectures.length
const gauss = (rng: Rng) => Math.sqrt(-2 * Math.log(1 - rng.next())) * Math.cos(2 * Math.PI * rng.next())
const d10 = (x: number) => F(Math.round(x * 10), 10)

const gens: [string, LQGenerator, number][] = [
  ['A', { id: 'A', generate: (r) => A.build(A.sample(r)) }, 5],
  ['B', { id: 'B', generate: (r) => B.build(B.sample(r)) }, 5],
  ['C', { id: 'C', generate: (r) => C.build(C.sample(r)) }, 5],
  ['D', { id: 'D', generate: (r) => D.build(D.sample(r)) }, 5],
  ['E', { id: 'E', generate: (r) => E.build(E.sample(r)) }, 5],
  ['F', { id: 'F', generate: (r) => Fe.build(Fe.sample(r)) }, 5],
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

/** Autocovariances sigma2 * sum_j c_j c_{j+h} of a moving average with coefficient list c. */
const maAcov = (c: number[], sigma2: number, h: number) => { let s = 0; for (let j = 0; j + h < c.length; j++) s += c[j] * c[j + h]; return sigma2 * s }

// ---------- A ----------
describe('generator A against independent computation', () => {
  it('sample autocovariances by the raw-moment identity in exact fractions (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      const n = p.x.length
      const S = p.x.reduce((a, v) => a + v, 0)
      const xbar = F(S, n)
      const gam = (h: number) => {
        let prod = F(0), first = 0, last = 0
        for (let t = 0; t + h < n; t++) { prod = prod.add(F(p.x[t] * p.x[t + h])); first += p.x[t]; last += p.x[t + h] }
        return prod.sub(xbar.mul(F(first + last))).add(F(n - h).mul(xbar).mul(xbar)).div(F(n))
      }
      close(ans[0], gam(0).num, 1e-12)
      close(ans[1], gam(1).div(gam(0)).num, 1e-12)
      close(ans[2], gam(2).div(gam(0)).num, 1e-12)
      // the MA(infinity) variance as a long sum, the filter autocovariance by the coefficient list
      let v = 0
      for (let j = 0; j < 400; j++) v += p.phi ** (2 * j)
      close(ans[4], p.sigma2 * v, 1e-9)
      close(ans[3], maAcov([1, p.psi1, p.psi2], p.sigma2, 1), 1e-12)
    }
  })
  it('Monte Carlo: the lag-1 autocovariance of a simulated 3-term filter (6 seeds)', () => {
    for (const s of seeds('A', 6)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      const rng = makeRng('simA' + s)
      const sd = Math.sqrt(p.sigma2)
      let z2 = sd * gauss(rng), z1 = sd * gauss(rng), yPrev = 0, acc = 0
      const N = 1_500_000
      for (let t = 0; t < N; t++) {
        const z0 = sd * gauss(rng)
        const y = z0 + p.psi1 * z1 + p.psi2 * z2
        if (t > 0) acc += y * yPrev
        yPrev = y; z2 = z1; z1 = z0
      }
      close(acc / (N - 1), ans[3], 0.012 * p.sigma2)
    }
  }, 60000)
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  /** gamma(h) = sigma2/(2 pi) * integral of |1 + t1 e^{iw} + t2 e^{2iw}|^2 cos(h w) dw, as an exact discrete Fourier sum. */
  const spectral = (c: number[], sigma2: number, h: number) => {
    const M = 128
    let acc = 0
    for (let m = 0; m < M; m++) {
      const w = (2 * Math.PI * m) / M
      let re = 0, im = 0
      c.forEach((cj, j) => { re += cj * Math.cos(j * w); im += cj * Math.sin(j * w) })
      acc += (re * re + im * im) * Math.cos(h * w)
    }
    return (sigma2 * acc) / M
  }
  it('MA(2) autocovariances by the spectral sum; the invertible MA(1) from the moment equations (300 seeds)', () => {
    for (const s of seeds('B', 300)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      const c = [1, p.t1, p.t2]
      const g0 = spectral(c, p.sigma2, 0)
      close(ans[0], g0, 1e-9)
      close(ans[1], spectral(c, p.sigma2, 1) / g0, 1e-9)
      close(ans[2], spectral(c, p.sigma2, 2) / g0, 1e-9)
      expect(Math.abs(spectral(c, p.sigma2, 3)), s).toBeLessThan(1e-9)
      // MA(1) with theta and sigma2b: match gamma(0), gamma(1) with an invertible root
      const gA0 = spectral([1, p.theta], p.sigma2b, 0), gA1 = spectral([1, p.theta], p.sigma2b, 1)
      const rho = gA1 / gA0
      const thStar = (1 - Math.sqrt(1 - 4 * rho * rho)) / (2 * rho)
      expect(Math.abs(thStar), s).toBeLessThan(1)
      close(ans[3], thStar, 1e-9)
      const sStar = gA0 / (1 + thStar * thStar)
      close(ans[4], sStar, 1e-9)
      close(maAcov([1, ans[3]], ans[4], 1), gA1, 1e-9)
    }
  })
  it('Monte Carlo: the MA(2) variance and lag-1 autocorrelation (6 seeds)', () => {
    for (const s of seeds('B', 6)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      const rng = makeRng('simB' + s)
      const sd = Math.sqrt(p.sigma2)
      let z1 = sd * gauss(rng), z2 = sd * gauss(rng), prev = 0, c0 = 0, c1 = 0
      const N = 1_500_000
      for (let t = 0; t < N; t++) {
        const z0 = sd * gauss(rng)
        const x = z0 + p.t1 * z1 + p.t2 * z2
        c0 += x * x; if (t > 0) c1 += x * prev
        prev = x; z2 = z1; z1 = z0
      }
      close(c0 / N, ans[0], 0.02 * ans[0])
      close(c1 / N / (c0 / N), ans[1], 0.01)
    }
  }, 60000)
})

// ---------- C ----------
describe('generator C against independent computation', () => {
  it('3x3 Yule-Walker solve in exact fractions, psi-weight sums, 2x2 solve for the estimates (300 seeds)', () => {
    for (const s of seeds('C', 300)) {
      const p = C.sample(makeRng(s))
      const ans = answers(C.build(p))
      const f1 = d10(p.p1), f2 = d10(p.p2), sg = F(p.sigma2)
      const [g0, g1, g2] = solveFr(
        [[F(1), F(0).sub(f1), F(0).sub(f2)], [F(0).sub(f1), F(1).sub(f2), F(0)], [F(0).sub(f2), F(0).sub(f1), F(1)]],
        [sg, F(0), F(0)],
      )
      close(ans[0], g1.div(g0).num, 1e-12)
      close(ans[1], g2.div(g0).num, 1e-12)
      close(ans[3], g0.num, 1e-12)
      // psi weights: gamma(h) = sigma2 sum psi_j psi_{j+h}
      const psi = [1, p.p1]
      for (let j = 2; j < 3000; j++) psi.push(p.p1 * psi[j - 1] + p.p2 * psi[j - 2])
      const gam = (h: number) => { let a = 0; for (let j = 0; j + h < psi.length; j++) a += psi[j] * psi[j + h]; return p.sigma2 * a }
      close(ans[3], gam(0), 1e-8)
      close(ans[2], gam(3) / gam(0), 1e-8)
      // Yule-Walker estimate: solve [[1,r1],[r1,1]] (a,b) = (r1,r2)
      const r1 = d10(p.r1), r2 = d10(p.r2)
      const [a] = solveFr([[F(1), r1], [r1, F(1)]], [r1, r2])
      close(ans[4], a.num, 1e-12)
    }
  })
  it('Monte Carlo: simulated AR(2) paths have the stated variance and autocorrelations (5 seeds)', () => {
    for (const s of seeds('C', 5)) {
      const p = C.sample(makeRng(s))
      const ans = answers(C.build(p))
      const rng = makeRng('simC' + s)
      const sd = Math.sqrt(p.sigma2)
      let x1 = 0, x2 = 0, c0 = 0, c1 = 0, c2 = 0, c3 = 0, x3 = 0
      const N = 2_000_000
      for (let t = 0; t < N + 200; t++) {
        const x = p.p1 * x1 + p.p2 * x2 + sd * gauss(rng)
        if (t >= 200) { c0 += x * x; c1 += x * x1; c2 += x * x2; c3 += x * x3 }
        x3 = x2; x2 = x1; x1 = x
      }
      close(c0 / N, ans[3], 0.04 * ans[3])
      close(c1 / c0, ans[0], 0.015)
      close(c2 / c0, ans[1], 0.02)
      close(c3 / c0, ans[2], 0.03)
    }
  }, 90000)
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('psi-weight sums for the ACF, a 2x2 Toeplitz solve for the PACF (300 seeds)', () => {
    for (const s of seeds('D', 300)) {
      const p = D.sample(makeRng(s))
      const ans = answers(D.build(p))
      const psi = [1, p.phi + p.theta]
      for (let j = 2; j < 2500; j++) psi.push(p.phi * psi[j - 1])
      const gam = (h: number) => { let a = 0; for (let j = 0; j + h < psi.length; j++) a += psi[j] * psi[j + h]; return p.sigma2 * a }
      const r1 = gam(1) / gam(0), r2 = gam(2) / gam(0)
      close(ans[0], r1, 1e-9)
      close(ans[1], r2, 1e-9)
      // PACF at lag 2: second coefficient of the best linear predictor from [[1,r1],[r1,1]] (a,b) = (r1,r2)
      const det = 1 - r1 * r1
      close(ans[2], (r2 - r1 * r1) / det, 1e-9)
      close(ans[3], gam(0), 1e-7)
    }
  })
  it('Monte Carlo: ARMA(1,1) paths have the stated variance and lag-1 autocorrelation (5 seeds)', () => {
    for (const s of seeds('D', 5)) {
      const p = D.sample(makeRng(s))
      const ans = answers(D.build(p))
      const rng = makeRng('simD' + s)
      const sd = Math.sqrt(p.sigma2)
      let x = 0, z = 0, c0 = 0, c1 = 0
      const N = 2_500_000
      for (let t = 0; t < N + 200; t++) {
        const z1 = sd * gauss(rng)
        const xn = p.phi * x + z1 + p.theta * z
        if (t >= 200) { c0 += xn * xn; c1 += xn * x }
        x = xn; z = z1
      }
      close(c0 / N, ans[3], 0.05 * ans[3])
      close(c1 / c0, ans[0], 0.02)
    }
  }, 90000)
  it('Monte Carlo: about 5% of white-noise lag-1 autocorrelations fall outside the stated band', () => {
    for (const n of [100, 144, 225, 400]) {
      const band = answers(D.build({ phi: 0.5, theta: 0.4, sigma2: 1, n }))[4]
      const rng = makeRng('band' + n)
      let out = 0
      const R = 5000
      for (let r = 0; r < R; r++) {
        const e = Array.from({ length: n }, () => gauss(rng))
        let num = 0, den = 0
        for (let t = 0; t < n; t++) { den += e[t] * e[t]; if (t > 0) num += e[t] * e[t - 1] }
        if (Math.abs(num / den) > band) out++
      }
      expect(out / R, `n=${n}`).toBeGreaterThan(0.035)
      expect(out / R, `n=${n}`).toBeLessThan(0.065)
    }
  }, 60000)
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  /** Run the ARMA(1,1) recursion forward from (X_T, Z_T) with the given future innovations. */
  const run = (p: E.Params, future: number[]) => {
    let x = p.xT, z = p.zT
    const out: number[] = []
    for (const e of future) { x = p.mu + p.phi * (x - p.mu) + e + p.theta * z; z = e; out.push(x) }
    return out
  }
  it('conditional means from the recursion with zero noise, variances from unit-shock responses (300 seeds)', () => {
    for (const s of seeds('E', 300)) {
      const p = E.sample(makeRng(s))
      const ans = answers(E.build(p))
      const path = run(p, [0, 0, 0])
      close(ans[0], path[0], 1e-10)
      close(ans[1], path[2], 1e-10)
      const variance = (h: number) => {
        let acc = 0
        for (let k = 1; k <= h; k++) {
          const shocks = [0, 0, 0].map((_, i) => (i + 1 === k ? 1 : 0))
          const base = run(p, [0, 0, 0])
          const shocked = run(p, shocks)
          acc += (shocked[h - 1] - base[h - 1]) ** 2
        }
        return p.sigma2 * acc
      }
      close(ans[2], variance(2), 1e-9)
      close(ans[3], variance(3), 1e-9)
      close(ans[4], 1.96 * Math.sqrt(variance(3)), 1e-9)
    }
  })
  it('Monte Carlo: simulated futures have the stated conditional mean and error variance (6 seeds)', () => {
    for (const s of seeds('E', 6)) {
      const p = E.sample(makeRng(s))
      const ans = answers(E.build(p))
      const rng = makeRng('simE' + s)
      const sd = Math.sqrt(p.sigma2)
      let m = 0, m2 = 0
      const N = 400_000
      for (let i = 0; i < N; i++) {
        const x3 = run(p, [sd * gauss(rng), sd * gauss(rng), sd * gauss(rng)])[2]
        m += x3; m2 += x3 * x3
      }
      m /= N
      const v = m2 / N - m * m
      close(m, ans[1], 0.02 * Math.sqrt(ans[3]) + 0.01)
      close(v, ans[3], 0.03 * ans[3])
    }
  }, 60000)
})

// ---------- F ----------
describe('generator F against independent computation', () => {
  it('exact fractions, golden-section minimisation of the RSS, the MA(1) moment equation, exact Ljung-Box (300 seeds)', () => {
    for (const s of seeds('F', 300)) {
      const p = Fe.sample(makeRng(s))
      const ans = answers(Fe.build(p))
      const x = p.x.map(d10)
      const m = x.length
      // Yule-Walker: lag-1 sample autocorrelation of a series with known zero mean
      let c1 = F(0), c0 = F(0)
      for (let t = 0; t < m; t++) { c0 = c0.add(x[t].mul(x[t])); if (t > 0) c1 = c1.add(x[t].mul(x[t - 1])) }
      close(ans[0], c1.div(c0).num, 1e-12)
      // CLS: minimise the RSS numerically
      const rss = (f: number) => { let a = 0; for (let t = 1; t < m; t++) a += (p.x[t] - f * p.x[t - 1]) ** 2; return a }
      let lo = -3, hi = 3
      const gr = (Math.sqrt(5) - 1) / 2
      for (let i = 0; i < 200; i++) {
        const a = hi - gr * (hi - lo), b = lo + gr * (hi - lo)
        if (rss(a) < rss(b)) hi = b; else lo = a
      }
      const best = (lo + hi) / 2
      close(ans[1], best, 1e-6)
      close(ans[2], rss(best) / (m - 1), 1e-8)
      // MA(1): substitute back
      expect(Math.abs(ans[3]), s).toBeLessThan(1)
      close(ans[3] / (1 + ans[3] * ans[3]), p.r1, 1e-9)
      // Ljung-Box with exact fractions
      let q = F(0)
      p.r.forEach((rk, i) => { const r = d10(rk * 10).div(F(10)); q = q.add(r.mul(r).div(F(p.n - (i + 1)))) })
      close(ans[4], q.mul(F(p.n * (p.n + 2))).num, 1e-9)
    }
  })
  it('Monte Carlo: the Ljung-Box statistic has mean about 4 (chi-square with 4 df) for white noise', () => {
    for (const n of [50, 60, 80, 100]) {
      const rng = makeRng('lb' + n)
      let total = 0
      const R = 20000
      for (let r = 0; r < R; r++) {
        const e = Array.from({ length: n }, () => gauss(rng))
        const mean = e.reduce((a, v) => a + v, 0) / n
        const d = e.map((v) => v - mean)
        const den = d.reduce((a, v) => a + v * v, 0)
        let q = 0
        for (let k = 1; k <= 4; k++) { let num = 0; for (let t = k; t < n; t++) num += d[t] * d[t - k]; q += (num / den) ** 2 / (n - k) }
        total += q * n * (n + 2)
      }
      expect(total / R, `n=${n}`).toBeGreaterThan(3.9)
      expect(total / R, `n=${n}`).toBeLessThan(4.1)
    }
  }, 60000)
  it('Monte Carlo: the Yule-Walker AR(1) estimate has the approximate standard error sqrt((1-phi^2)/n)', () => {
    // sanity of the estimator itself: it is centred near phi for a long series
    const rng = makeRng('ywmc')
    for (const phi of [0.5, -0.6]) {
      let sum = 0, sq = 0
      const R = 2000, n = 400
      for (let r = 0; r < R; r++) {
        let x = 0, num = 0, den = 0
        for (let t = 0; t < n + 50; t++) { const xn = phi * x + gauss(rng); if (t >= 50) { num += xn * x; den += xn * xn }; x = xn }
        const est = num / den
        sum += est; sq += est * est
      }
      const mean = sum / R
      close(mean, phi, 0.01)
      close(Math.sqrt(sq / R - mean * mean), Math.sqrt((1 - phi * phi) / n), 0.006)
    }
  }, 60000)
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  it('differences by operator convolution, the DF regression by minimisation and by the RSS identity (300 seeds)', () => {
    for (const s of seeds('G', 300)) {
      const p = G.sample(makeRng(s))
      const ans = answers(G.build(p))
      const x = p.x
      const conv = (a: number[], b: number[]) => { const o = new Array(a.length + b.length - 1).fill(0); a.forEach((u, i) => b.forEach((v, j) => (o[i + j] += u * v))); return o }
      const apply = (poly: number[]) => poly.reduce((acc, c, k) => acc + c * x[7 - k], 0)
      const nabla = [1, -1]
      close(ans[0], x.slice(1).map((v, i) => v - x[i]).reduce((a, v) => a + v, 0) / 7, 1e-12)
      close(ans[1], apply(conv(nabla, nabla)), 1e-12)
      close(ans[4], apply(conv(nabla, [1, 0, 0, 0, -1])), 1e-12)
      // DF regression
      const d = x.slice(1).map((v, i) => v - x[i])
      const lag = x.slice(0, 7)
      const rss = (g: number) => d.reduce((a, di, i) => a + (di - g * lag[i]) ** 2, 0)
      let lo = -2, hi = 2
      const gr = (Math.sqrt(5) - 1) / 2
      for (let i = 0; i < 200; i++) {
        const a = hi - gr * (hi - lo), b = lo + gr * (hi - lo)
        if (rss(a) < rss(b)) hi = b; else lo = a
      }
      const g = (lo + hi) / 2
      close(ans[2], g, 1e-7)
      const sdd = d.reduce((a, v) => a + v * v, 0), sdx = d.reduce((a, v, i) => a + v * lag[i], 0), sxx = lag.reduce((a, v) => a + v * v, 0)
      const rss2 = sdd - g * sdx
      close(rss2, rss(g), 1e-6 * Math.max(1, rss2))
      close(ans[3], g / Math.sqrt(rss2 / 6 / sxx), 1e-5)
    }
  })
  it('Monte Carlo: for a simulated random walk the statistic has the one-sided Dickey-Fuller shape (about 5% below -1.95 for long series)', () => {
    // the statistic for a long driftless random walk, computed with the generator formulas on blocks of 8, is skewed to the left
    const rng = makeRng('df')
    let below = 0
    const R = 6000
    for (let r = 0; r < R; r++) {
      const x = [20]
      for (let t = 1; t < 8; t++) x.push(x[t - 1] + gauss(rng))
      const ans = G.build({ x }).parts[3].answer
      if (ans < -1.95) below++
    }
    expect(below / R).toBeLessThan(0.1)
    expect(below / R).toBeGreaterThan(0.005)
  }, 60000)
})

// ---------- H ----------
describe('generator H against independent computation', () => {
  it('expanded MA polynomial and direct autocovariance sums; AIC and BIC model by model (300 seeds)', () => {
    for (const s of seeds('H', 300)) {
      const p = H.sample(makeRng(s))
      const ans = answers(H.build(p))
      const a = [1, p.theta], b = new Array(p.s + 1).fill(0)
      b[0] = 1; b[p.s] = p.Theta
      const c = new Array(a.length + b.length - 1).fill(0)
      a.forEach((u, i) => b.forEach((v, j) => (c[i + j] += u * v)))
      const g = (h: number) => maAcov(c, 1, h)
      close(ans[0], g(1) / g(0), 1e-12)
      close(ans[1], g(p.s) / g(0), 1e-12)
      close(ans[2], g(p.s + 1) / g(0), 1e-12)
      close(g(p.s - 1) / g(0), ans[2], 1e-12)
      const aic = (v: number, k: number) => p.n * Math.log(v) + 2 * k
      const bic = (v: number, k: number) => p.n * Math.log(v) + k * Math.log(p.n)
      close(ans[3], aic(p.v1, p.k1) - aic(p.v2, p.k2), 1e-9)
      close(ans[4], bic(p.v1, p.k1) - bic(p.v2, p.k2), 1e-9)
    }
  })
  it('Monte Carlo: simulated seasonal MA autocorrelations (s = 4, 5 seeds)', () => {
    let done = 0
    for (const sd of seeds('H', 200)) {
      const p = H.sample(makeRng(sd))
      if (p.s !== 4 || done >= 5) continue
      done++
      const ans = answers(H.build(p))
      const rng = makeRng('simH' + sd)
      const z: number[] = Array.from({ length: 6 }, () => gauss(rng))
      const hist: number[] = []
      const N = 2_000_000
      for (let t = 0; t < N; t++) {
        z.push(gauss(rng))
        const L = z.length
        hist.push(z[L - 1] + p.theta * z[L - 2] + p.Theta * z[L - 1 - p.s] + p.theta * p.Theta * z[L - 2 - p.s])
        z.shift()
      }
      const cov = (h: number) => { let a = 0; for (let t = h; t < N; t++) a += hist[t] * hist[t - h]; return a / (N - h) }
      const c0 = cov(0)
      close(cov(1) / c0, ans[0], 0.01)
      close(cov(4) / c0, ans[1], 0.01)
      close(cov(5) / c0, ans[2], 0.01)
    }
    expect(done).toBe(5)
  }, 90000)
})
