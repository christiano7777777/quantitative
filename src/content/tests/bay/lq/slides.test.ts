// Independent checks of the generators written from the HKU STAT4610 lecture notes and tutorials (LQ-K to LQ-R). Every
// answer is recomputed by a DIFFERENT method from the generator's own:
//  K: the normal posterior mean and variance by numerical integration of likelihood times prior; the predictive variance as
//     sampling variance plus the integrated posterior variance; the pseudo-count identity m = (n0 mu0 + n ybar)/(n0 + n).
//  L: the Dirichlet predictive probability as a ratio of Dirichlet-multinomial marginal likelihoods; the Gamma-Weibull posterior
//     by numerical integration of likelihood times prior (mean and mode).
//  M: posterior means by numerical integration of the kernels; the prior mean times the effective sample size.
//  N: every draw checked through the cdf: F(x) = 1 - u for the exponential and Weibull, F(x) = u for the others.
//  O: normalised weights computed directly; the effective sample size as 1 / sum of squared normalised weights.
//  P: the stationary distribution by solving the linear system in exact fractions; two-step probabilities by exact matrix
//     multiplication; the long-run average from a high power of the matrix.
//  Q: responsibilities by log-sum-exp; the counts and the Beta update recomputed directly.
//  R: the required n by a search; the standard errors recomputed; the grid size by repeated multiplication.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import { F, solveFr } from '../../../shared/fraction'
import * as K from './k-normal'
import * as L from './l-conjugate'
import * as M from './m-jeffreys'
import * as N from './n-inverse'
import * as O from './o-is'
import * as P from './p-markov'
import * as Q from './q-cavi'
import * as R from './r-mc'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const close = (got: number, want: number, tol = 1e-9, what = '') => expect(Math.abs(got - want), `${what}: got ${got}, want ${want}`).toBeLessThan(tol)
const simpson = (f: (x: number) => number, a: number, b: number, n = 20000) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3 }
const lgamma = (x: number) => { let s = 0; while (x < 8) { s -= Math.log(x); x += 1 } const z = 1 / (x * x); return s + (x - 0.5) * Math.log(x) - x + 0.5 * Math.log(2 * Math.PI) + (1 / x) * (1 / 12 - z * (1 / 360 - z / 1260)) }

describe('generator K against independent computation', () => {
  it('normal-normal posterior by numerical integration, predictive variance, pseudo-count (300 seeds)', () => {
    for (const s of seeds('K', 300)) {
      const P0 = K.sample(makeRng(s))
      const ans = K.build(P0).parts.map((p) => p.answer)
      const { mu0, s0, sigma2, n, ybar } = P0
      const dens = (m: number) => Math.exp(-((ybar - m) ** 2) / (2 * (sigma2 / n)) - ((m - mu0) ** 2) / (2 * s0))
      const lo = Math.min(mu0, ybar) - 12, hi = Math.max(mu0, ybar) + 12
      const z = simpson(dens, lo, hi)
      const mean = simpson((m) => m * dens(m), lo, hi) / z
      const variance = simpson((m) => (m - mean) ** 2 * dens(m), lo, hi) / z
      close(ans[0], sigma2 / n, 1e-12)
      close(ans[1], mean, 1e-7, `${s} m_n`)
      close(ans[2], variance, 1e-7, `${s} s_n^2`)
      close(ans[3], sigma2 + variance, 1e-7, `${s} predictive variance`)
      const n0 = ans[4]
      close(mean, (n0 * mu0 + n * ybar) / (n0 + n), 1e-7, `${s} pseudo-count identity`)
    }
  })
})

describe('generator L against independent computation', () => {
  it('Dirichlet predictive from marginal likelihoods; Gamma-Weibull posterior numerically (300 seeds)', () => {
    for (const s of seeds('L', 300)) {
      const P0 = L.sample(makeRng(s))
      const ans = L.build(P0).parts.map((p) => p.answer)
      const { alpha, counts, a, b, T } = P0
      expect(ans[0]).toBe(alpha[0] + counts[0])
      // Dirichlet-multinomial marginal likelihood of the counts (up to the multinomial coefficient)
      const ml = (c: number[]) => { const a0 = alpha.reduce((x, y) => x + y, 0), n = c.reduce((x, y) => x + y, 0); return lgamma(a0) - lgamma(a0 + n) + c.reduce((acc, ci, i) => acc + lgamma(alpha[i] + ci) - lgamma(alpha[i]), 0) }
      const next = counts.map((c, i) => (i === 1 ? c + 1 : c))
      close(ans[1], Math.exp(ml(next) - ml(counts)), 1e-9, `${s} predictive`)
      // Gamma-Weibull posterior on a grid
      const logPost = (l: number) => (a - 1) * Math.log(l) - b * l + T.reduce((acc, t) => acc + Math.log(l * 2 * t) - l * t * t, 0)
      const dens = (l: number) => (l <= 0 ? 0 : Math.exp(logPost(l)))
      const z = simpson(dens, 0, 60, 60000)
      const mean = simpson((l) => l * dens(l), 0, 60, 60000) / z
      const alphaN = a + T.length
      close(ans[2], alphaN / mean, 1e-5, `${s} posterior rate`)
      close(ans[3], mean, 1e-5, `${s} posterior mean`)
      let best = 0, bl = 0
      for (let i = 1; i <= 60000; i++) { const l = i * 0.001; const v = logPost(l); if (best === 0 || v > best) { best = v; bl = l } }
      close(ans[4], bl, 2e-3, `${s} posterior mode`)
    }
  })
})

describe('generator M against independent computation', () => {
  it('Jeffreys and power-prior posteriors by numerical integration; effective sample sizes (300 seeds)', () => {
    for (const s of seeds('M', 300)) {
      const P0 = M.sample(makeRng(s))
      const ans = M.build(P0).parts.map((p) => p.answer)
      const { ys, m, x, delta, n, y } = P0
      const sy = ys.reduce((a, b) => a + b, 0)
      const dl = (l: number) => (l <= 0 ? 0 : l ** (sy + 0.5 - 1) * Math.exp(-ys.length * l))
      const zl = simpson(dl, 0, 80, 40000)
      close(ans[0], simpson((l) => l * dl(l), 0, 80, 40000) / zl, 1e-5, `${s} Jeffreys mean`)
      // power prior kernel p^(delta x - 1) (1-p)^(delta (m-x) - 1)
      const pk = (p: number) => (p <= 0 || p >= 1 ? 0 : p ** (delta * x - 1) * (1 - p) ** (delta * (m - x) - 1))
      const zp = simpson(pk, 0, 1), mp = simpson((p) => p * pk(p), 0, 1) / zp
      close(ans[2], delta * m, 1e-12)
      close(ans[1], mp * ans[2], 1e-3, `${s} first Beta parameter via prior mean times ESS`)
      const pp = (p: number) => (p <= 0 || p >= 1 ? 0 : p ** (delta * x - 1 + y) * (1 - p) ** (delta * (m - x) - 1 + n - y))
      const z2 = simpson(pp, 0, 1)
      close(ans[3], simpson((p) => p * pp(p), 0, 1) / z2, 1e-3, `${s} posterior mean`)
      close(ans[4], ans[2] + n, 1e-12)
    }
  })
})

describe('generator N against independent computation', () => {
  it('each draw satisfies the cdf identity (300 seeds)', () => {
    for (const s of seeds('N', 300)) {
      const P0 = N.sample(makeRng(s))
      const ans = N.build(P0).parts.map((p) => p.answer)
      const { u, lam, lamW } = P0
      close(1 - Math.exp(-lam * ans[0]), 1 - u[0], 1e-9, `${s} exponential`)
      close(1 - Math.exp(-lamW * ans[1] ** 2), 1 - u[1], 1e-9, `${s} Weibull`)
      close(1 / (1 + Math.exp(-ans[2])), u[2], 1e-9, `${s} logistic`)
      close(0.5 + Math.atan(ans[3]) / Math.PI, u[3], 1e-9, `${s} Cauchy`)
      const lapCdf = (x: number) => (x < 0 ? 0.5 * Math.exp(x) : 1 - 0.5 * Math.exp(-x))
      close(lapCdf(ans[4]), u[4], 1e-9, `${s} Laplace`)
    }
  })
})

describe('generator O against independent computation', () => {
  it('normalised weights, SNIS estimate, ESS as 1 / sum of squared normalised weights (300 seeds)', () => {
    for (const s of seeds('O', 300)) {
      const P0 = O.sample(makeRng(s))
      const ans = O.build(P0).parts.map((p) => p.answer)
      const { x, r } = P0
      const f = (v: number) => v * v * Math.exp(-v)
      const g = (v: number) => r * Math.exp(-r * v)
      const w = x.map((v) => f(v) / g(v))
      close(ans[0], w[0], 1e-12)
      const tot = w.reduce((a, b) => a + b, 0)
      close(ans[1], tot, 1e-12)
      const nw = w.map((v) => v / tot)
      close(ans[2], nw.reduce((a, b, i) => a + b * x[i], 0), 1e-9, `${s} SNIS`)
      close(ans[3], 1 / nw.reduce((a, b) => a + b * b, 0), 1e-9, `${s} ESS`)
      close(ans[4], Math.max(...nw), 1e-12)
    }
  })
})

describe('generator P against independent computation', () => {
  it('exact two-step probabilities, stationary distribution from the linear system, long-run average (300 seeds)', () => {
    for (const s of seeds('P', 300)) {
      const P0 = P.sample(makeRng(s))
      const ans = P.build(P0).parts.map((p) => p.answer)
      const t = (v: number) => F(Math.round(v * 10), 10)
      const Pm = [[F(1).sub(t(P0.a)), t(P0.a), F(0)], [t(P0.b), F(1).sub(t(P0.b)).sub(t(P0.c)), t(P0.c)], [F(0), t(P0.d), F(1).sub(t(P0.d))]]
      const mul = (A: typeof Pm, B: typeof Pm) => A.map((row) => [0, 1, 2].map((j) => row.reduce((acc, v, k) => acc.add(v.mul(B[k][j])), F(0))))
      const P2 = mul(Pm, Pm)
      close(ans[0], P2[0][2].num, 1e-12); close(ans[1], P2[1][1].num, 1e-12)
      // pi (P - I) = 0 with the last equation replaced by sum(pi) = 1
      const A = [0, 1, 2].map((j) => [0, 1, 2].map((i) => Pm[i][j].sub(i === j ? F(1) : F(0))))
      A[2] = [F(1), F(1), F(1)]
      const pi = solveFr(A, [F(0), F(0), F(1)])
      close(ans[2], pi[0].num, 1e-12, `${s} pi1`); close(ans[3], pi[2].num, 1e-12, `${s} pi3`)
      // power iteration
      const fm = Pm.map((row) => row.map((v) => v.num))
      const fmul = (A: number[][], B: number[][]) => A.map((row) => [0, 1, 2].map((j) => row.reduce((acc, v, k) => acc + v * B[k][j], 0)))
      let Pn = fm
      for (let i = 0; i < 9; i++) Pn = fmul(Pn, Pn)
      const longRun = [0, 1, 2].reduce((acc, j) => acc + (j + 1) * Pn[0][j], 0)
      close(ans[4], longRun, 1e-6, `${s} long-run mean`)
    }
  })
})

describe('generator Q against independent computation', () => {
  it('responsibilities by log-sum-exp, expected count, Beta update (300 seeds)', () => {
    const lf = (k: number) => { let f = 0; for (let i = 2; i <= k; i++) f += Math.log(i); return f }
    const logPois = (lam: number, y: number) => -lam + y * Math.log(lam) - lf(y)
    for (const s of seeds('Q', 300)) {
      const P0 = Q.sample(makeRng(s))
      const ans = Q.build(P0).parts.map((p) => p.answer)
      const { y, pi1, l1, l2, a1, a2 } = P0
      const resp = y.map((v) => { const u1 = Math.log(pi1) + logPois(l1, v), u2 = Math.log(1 - pi1) + logPois(l2, v); const m = Math.max(u1, u2); return Math.exp(u1 - m) / (Math.exp(u1 - m) + Math.exp(u2 - m)) })
      close(ans[0], resp[0], 1e-9); close(ans[1], resp[1], 1e-9)
      const N1 = resp.reduce((a, b) => a + b, 0)
      close(ans[2], N1, 1e-9)
      close(ans[3], a1 + N1, 1e-9)
      close(ans[4], (a1 + N1) / (a1 + a2 + y.length), 1e-9)
    }
  })
})

describe('generator R against independent computation', () => {
  it('required n by search, pi estimate and its error, grid size by repeated multiplication (300 seeds)', () => {
    for (const s of seeds('R', 300)) {
      const P0 = R.sample(makeRng(s))
      const ans = R.build(P0).parts.map((p) => p.answer)
      const { n, sd, eps, N, inside, g, d } = P0
      close(ans[0], Math.sqrt(sd * sd / n), 1e-12)
      let need = 1
      while (1.96 * sd / Math.sqrt(need) > eps + 1e-12) need++
      expect(ans[1]).toBe(need)
      close(ans[2], (4 * inside) / N, 1e-12)
      const p = inside / N
      close(ans[3], Math.sqrt(16 * p * (1 - p) / N), 1e-12)
      let grid = 1
      for (let i = 0; i < d; i++) grid *= g
      expect(ans[4]).toBe(grid)
    }
    // sanity: the circle estimate really estimates pi, with the stated standard error
    const rng = makeRng('pi'), Nn = 400000
    let hit = 0
    for (let i = 0; i < Nn; i++) { const x = 2 * rng.next() - 1, y = 2 * rng.next() - 1; if (x * x + y * y <= 1) hit++ }
    close((4 * hit) / Nn, Math.PI, 5 * 4 * Math.sqrt((Math.PI / 4) * (1 - Math.PI / 4) / Nn), 'simulated pi')
  })
})
