// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: variances and covariances as quadratic forms of the exact matrix min(t_i,t_j); the hitting probability by integrating the first-passage density;
//     the joint maximum/endpoint probability by the strong Markov property (first-passage density times a normal cdf); the Wiener variance by Simpson integration of the squared integrand.
//  B: quadratic variation and the left sum from exact tenths (left sum via the identity (W_T^2 - QV)/2); the arcsine law by integrating the zero-free probability from a starting point;
//     E[W_p^2 W_q^2] by a two-dimensional Simpson integral over independent normal pieces.
//  C: moments by Simpson integration against the normal density; drift and noise coefficient from small-time-step moments of f(t+h, x+sqrt(h)Z); E[(W1 W2)^2] by two-dimensional integration.
//  D: mean, probability, median (bisection on the tail), standard deviation and power moment by Simpson integration over the lognormal.
//  E: OU mean, variance and covariance by RK4 on the moment ODEs; Feynman-Kac values by Simpson integration, plus the PDE residual of the closed form by finite differences.
//  F: theta by the risk-neutral drift identity; the density from a ratio of normal densities; E_P[Z W^2] by Simpson integration; probabilities by tail integrals.
//  G: the PDE exponent by the finite-difference residual of the PDE; the power price, call price by Simpson integration; delta by a price difference in S; theta as minus a price difference in T.
//  H: the representation integrand as a derivative of the integrated conditional expectation; the ratio volatility from Cholesky vectors; the numeraire density as a density ratio;
//     the asset-or-nothing and exchange-option prices by (nested) Simpson integration under Q.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { F } from '../../../shared/fraction'
import { normalCdf } from '../../../shared/format'
import * as A from './a-bm'
import * as B from './b-ito-sum'
import * as C from './c-ito-formula'
import * as D from './d-gbm'
import * as E from './e-ou-fk'
import * as Ff from './f-girsanov'
import * as G from './g-bs'
import * as H from './h-numeraire'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const lectures = topics.find((t) => t.id === 'sc')!.lectures.length
const simpson = (f: (x: number) => number, a: number, b: number, n = 2000) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3 }
const phi = (x: number) => Math.exp(-(x * x) / 2) / Math.sqrt(2 * Math.PI)
/** E[g(Z)] for a standard normal Z */
const Eg = (g: (z: number) => number) => simpson((z) => g(z) * phi(z), -10, 10, 2000)
/** P(Z > c) by integrating the density */
const tail = (c: number) => simpson(phi, Math.min(c, 10), 10, 2000)
const frac = (x: number, d: number) => F(Math.round(x * d), d) // x exactly representable with denominator d

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

it('the normal cdf helper agrees with integration of the density', () => {
  for (const z of [-3, -1.7, -0.4, 0, 0.9, 2.2]) close(normalCdf(z), 1 - tail(z), 5e-7)
})

// ---------- A ----------
describe('generator A against independent computation', () => {
  it('quadratic forms of the exact covariance matrix; first-passage integrals; Simpson variance of a Wiener integral (200 seeds)', () => {
    for (const s of seeds('A', 200)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      // exact: Sigma_ij = min(t_i, t_j) on the times (s, t, u)
      const times = [frac(p.s, 2), frac(p.t, 2), frac(p.u, 2)]
      const sigma = times.map((ti) => times.map((tj) => (ti.cmp(tj) < 0 ? ti : tj)))
      const form = (x: number[], y: number[]) => {
        let tot = F(0)
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) tot = tot.add(F(x[i] * y[j]).mul(sigma[i][j]))
        return tot.num
      }
      close(ans[0], form([p.a, p.b, 0], [p.a, p.b, 0]), 1e-12)
      close(ans[1], form([p.a, p.b, 0], [0, p.c, p.d]), 1e-12)
      // hitting probability: integrate the first-passage density of level lev over [0, T]
      const dens = (r: number) => (r <= 0 ? 0 : (p.lev / Math.sqrt(2 * Math.PI * r ** 3)) * Math.exp(-(p.lev * p.lev) / (2 * r)))
      close(ans[2], simpson(dens, 0, p.T, 40000), 2e-4)
      // joint: hit at time r, then the fresh Brownian motion must end below low - lev in the remaining time
      const joint = (r: number) => (r >= p.T ? 0 : dens(r) * normalCdf((p.low - p.lev) / Math.sqrt(p.T - r)))
      close(ans[3], simpson(joint, 0, p.T, 40000), 2e-4)
      // Wiener integral variance by integrating the squared integrand
      close(ans[4], simpson((t) => (p.alpha * t + p.beta) ** 2, 0, p.Tw, 200), 1e-9)
    }
  })
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  it('exact tenths for the sums; arcsine law by integrating the zero-free probability; a 2D integral for the fourth moment (60 seeds)', () => {
    for (const s of seeds('B', 60)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      const k = p.inc.map((x) => Math.round(x * 10))
      const sumK = k.reduce((a, b) => a + b, 0)
      const sumK2 = k.reduce((a, b) => a + b * b, 0)
      const T = F(Math.round(p.h * 4) * k.length, 4)
      const qv = F(sumK2, 100)
      close(ans[0], qv.num, 1e-12)
      // left sum from the identity: sum W_i dW_i = (W_T^2 - sum dW^2) / 2
      close(ans[1], F(sumK * sumK, 100).sub(qv).div(F(2)).num, 1e-12)
      close(ans[2], F(sumK * sumK, 100).sub(T).div(F(2)).num, 1e-12)
      // arcsine law: E over W_s of P(no zero in the remaining time t - s)
      const sd = Math.sqrt(p.s0)
      close(ans[3], simpson((x) => (2 * normalCdf(Math.abs(x) / Math.sqrt(p.t0 - p.s0)) - 1) * phi(x / sd) / sd, -10 * sd, 10 * sd, 4000), 1e-4)
      // E[W_p^2 W_q^2] with W_q = W_p + sqrt(q-p) Z2
      const m = simpson((z1) => simpson((z2) => (p.p * z1 * z1) * (Math.sqrt(p.p) * z1 + Math.sqrt(p.q - p.p) * z2) ** 2 * phi(z2), -9, 9, 300) * phi(z1), -9, 9, 300)
      close(ans[4], m, 1e-6)
    }
  })
})

// ---------- C ----------
describe('generator C against independent computation', () => {
  it('moments by Simpson; coefficients from small-step moments of f(t+h, x+sqrt(h)Z); the 2D integral for the correlated pair (100 seeds)', () => {
    for (const s of seeds('C', 100)) {
      const p = C.sample(makeRng(s))
      const ans = answers(C.build(p))
      close(ans[0], Eg((z) => Math.exp(p.a * Math.sqrt(p.T) * z)), 1e-8)
      close(ans[1], Eg((z) => (Math.sqrt(p.Tm) * z) ** 6), 1e-6)
      const f = (t: number, x: number) => p.p * t * x * x + p.q * x ** 3
      const h = 1e-6
      const f0 = f(p.t0, p.x0)
      const drift = Eg((z) => f(p.t0 + h, p.x0 + Math.sqrt(h) * z) - f0) / h
      close(ans[2], drift, 2e-3)
      const sig2 = Eg((z) => (f(p.t0 + h, p.x0 + Math.sqrt(h) * z) - f0) ** 2) / h
      close(ans[3] / sig2, 1, 2e-3)
      const r = p.rho, c = Math.sqrt(1 - r * r)
      const m = simpson((z1) => simpson((z2) => (Math.sqrt(p.Tc) * z1 * Math.sqrt(p.Tc) * (r * z1 + c * z2)) ** 2 * phi(z2), -9, 9, 300) * phi(z1), -9, 9, 300)
      close(ans[4], m, 1e-6)
    }
  })
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('lognormal mean, tail probability, median by bisection, sd and power moment by Simpson (100 seeds)', () => {
    for (const s of seeds('D', 100)) {
      const p = D.sample(makeRng(s))
      const ans = answers(D.build(p))
      const m = (p.mu - 0.5 * p.sigma ** 2) * p.T, v = p.sigma * Math.sqrt(p.T)
      const ST = (z: number) => p.s0 * Math.exp(m + v * z)
      close(ans[0], Eg(ST), 1e-6)
      const zstar = (Math.log(p.K / p.s0) - m) / v
      close(ans[1], tail(zstar), 5e-5)
      // median: the level x with P(S_T > x) = 1/2 by bisection on the tail of z
      let lo = 0, hi = p.s0 * 10
      for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; ;(tail((Math.log(mid / p.s0) - m) / v) > 0.5 ? (lo = mid) : (hi = mid)) }
      close(ans[2], (lo + hi) / 2, 5e-4)
      const mean = Eg(ST)
      close(ans[3], Math.sqrt(Eg((z) => ST(z) ** 2) - mean * mean), 1e-4)
      close(ans[4], Eg((z) => (ST(z) / p.s0) ** p.pw), 1e-7)
    }
  })
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  it('RK4 on the moment ODEs; Simpson for the Feynman-Kac values; PDE residuals of the closed forms (100 seeds)', () => {
    for (const s of seeds('E', 100)) {
      const p = E.sample(makeRng(s))
      const ans = answers(E.build(p))
      // m' = theta (mu - m), v' = -2 theta v + sigma^2, c' = -theta c, integrated with RK4
      const rk4 = (f: (y: number) => number, y0: number, T: number, n = 4000) => { const h = T / n; let y = y0; for (let i = 0; i < n; i++) { const k1 = f(y), k2 = f(y + (h / 2) * k1), k3 = f(y + (h / 2) * k2), k4 = f(y + h * k3); y += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4) } return y }
      close(ans[0], rk4((m) => p.theta * (p.m - m), p.x0, p.T), 1e-8)
      close(ans[1], rk4((v) => -2 * p.theta * v + p.sigma ** 2, 0, p.T), 1e-8)
      const vS = rk4((v) => -2 * p.theta * v + p.sigma ** 2, 0, p.s)
      close(ans[2], rk4((c) => -p.theta * c, vS, p.T - p.s), 1e-8)
      // Feynman-Kac by integration
      close(ans[3], Eg((z) => (p.y + p.vol * Math.sqrt(p.Tp) * z) ** 4), 1e-6)
      close(ans[4], Math.exp(-p.r * p.Tp) * Eg((z) => Math.exp(p.x1 + p.mu * p.Tp + p.vol * Math.sqrt(p.Tp) * z)), 1e-8)
      // PDE residuals of the answers' closed forms, via finite differences
      const U4 = (t: number, x: number) => x ** 4 + 6 * x * x * p.vol ** 2 * (p.Tp - t) + 3 * p.vol ** 4 * (p.Tp - t) ** 2
      const U5 = (t: number, x: number) => Math.exp(x + (p.mu + 0.5 * p.vol ** 2 - p.r) * (p.Tp - t))
      const d = 1e-3, t = 0.3 * p.Tp, x = p.y
      const res4 = (U4(t + d, x) - U4(t - d, x)) / (2 * d) + 0.5 * p.vol ** 2 * ((U4(t, x + d) - 2 * U4(t, x) + U4(t, x - d)) / (d * d))
      expect(Math.abs(res4)).toBeLessThan(1e-4)
      close(ans[3], U4(0, p.y), 1e-9)
      const res5 = (U5(t + d, x) - U5(t - d, x)) / (2 * d) + p.mu * ((U5(t, x + d) - U5(t, x - d)) / (2 * d)) + 0.5 * p.vol ** 2 * ((U5(t, x + d) - 2 * U5(t, x) + U5(t, x - d)) / (d * d)) - p.r * U5(t, x)
      expect(Math.abs(res5)).toBeLessThan(1e-5)
      close(ans[4], U5(0, p.x1), 1e-9)
    }
  })
})

// ---------- F ----------
describe('generator F against independent computation', () => {
  it('risk-neutral drift identity; density ratio; Simpson integrals under P and Q (100 seeds)', () => {
    for (const s of seeds('F', 100)) {
      const p = Ff.sample(makeRng(s))
      const ans = answers(Ff.build(p))
      close(p.mu - p.sigma * ans[0], p.r, 1e-9)
      // Z_T = density of N(-theta T, T) at w over density of N(0, T) at w: the law of W_T under Q over its law under P
      const dens = (x: number, mean: number) => Math.exp(-((x - mean) ** 2) / (2 * p.T)) / Math.sqrt(2 * Math.PI * p.T)
      close(ans[1], dens(p.w, -ans[0] * p.T) / dens(p.w, 0), 1e-9)
      // E_P[Z W^2] = integral of w^2 * density under Q
      close(ans[2], simpson((w) => w * w * dens(w, -ans[0] * p.T), -12 * Math.sqrt(p.T) - 5, 12 * Math.sqrt(p.T) + 5, 4000), 1e-6)
      const sq = p.sigma * Math.sqrt(p.T)
      close(ans[3], tail((Math.log(p.K / p.s0) - (p.mu - 0.5 * p.sigma ** 2) * p.T) / sq), 5e-4)
      close(ans[4], Math.exp(-p.r * p.T) * tail((Math.log(p.K / p.s0) - (p.r - 0.5 * p.sigma ** 2) * p.T) / sq), 5e-4)
    }
  })
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  it('PDE residual for lambda; Simpson prices; delta and theta as finite differences of the price (60 seeds)', () => {
    for (const s of seeds('G', 60)) {
      const p = G.sample(makeRng(s))
      const ans = answers(G.build(p))
      // lambda: the PDE residual of V = S^pw exp(-lambda (T - t)) must vanish
      const V = (t: number, S: number) => S ** p.pw * Math.exp(-ans[0] * (p.T - t))
      const t = 0.3 * p.T, S = p.s0, d = 1e-3, dS = S * 1e-3
      const res = (V(t + d, S) - V(t - d, S)) / (2 * d) + 0.5 * p.sigma ** 2 * S * S * ((V(t, S + dS) - 2 * V(t, S) + V(t, S - dS)) / (dS * dS)) + p.r * S * ((V(t, S + dS) - V(t, S - dS)) / (2 * dS)) - p.r * V(t, S)
      expect(Math.abs(res / V(t, S)), 'PDE residual').toBeLessThan(1e-5)
      // price of the power contract: discounted risk-neutral expectation
      close(ans[1], Math.exp(-p.r * p.T) * Eg((z) => Math.exp(p.pw * ((p.r - 0.5 * p.sigma ** 2) * p.T + p.sigma * Math.sqrt(p.T) * z))), 1e-8)
      // call price by integrating the discounted payoff over the lognormal
      const call = (S0: number, T: number) => {
        const m = (p.r - 0.5 * p.sigma ** 2) * T, v = p.sigma * Math.sqrt(T)
        const zs = (Math.log(p.K / S0) - m) / v
        return Math.exp(-p.r * T) * simpson((z) => (S0 * Math.exp(m + v * z) - p.K) * phi(z), Math.min(zs, 10), 10, 4000)
      }
      close(ans[2], call(p.s0, p.T), 1e-3) // the A-S normal cdf is accurate to 2e-7, times a price of order 100
      close(ans[3], (call(p.s0 + 0.5, p.T) - call(p.s0 - 0.5, p.T)) / 1, 3e-4)
      close(ans[4], -(call(p.s0, p.T + 1e-3) - call(p.s0, p.T - 1e-3)) / 2e-3, 1e-4)
    }
  })
})

// ---------- H ----------
describe('generator H against independent computation', () => {
  it('derivative of the conditional expectation; Cholesky vectors; density ratio; Simpson prices (40 seeds)', () => {
    for (const s of seeds('H', 40)) {
      const p = H.sample(makeRng(s))
      const ans = answers(H.build(p))
      // representation integrand = derivative in w of m(t, w) = E[exp(a (w + sqrt(T - t) Z))]
      const mf = (w: number) => Eg((z) => Math.exp(p.a * (w + Math.sqrt(p.T - p.t0) * z)))
      const dh = 1e-4
      close(ans[0] / ((mf(p.w + dh) - mf(p.w - dh)) / (2 * dh)), 1, 1e-6)
      // ratio volatility from Cholesky vectors
      const v1 = [p.sig1, 0], v2 = [p.sig2 * p.rho, p.sig2 * Math.sqrt(1 - p.rho ** 2)]
      close(ans[1], Math.hypot(v1[0] - v2[0], v1[1] - v2[1]), 1e-12)
      // numeraire density = law of W under Q^{S1} (drift +sig1) over the law under Q
      const dens = (x: number, mean: number) => Math.exp(-((x - mean) ** 2) / (2 * p.T)) / Math.sqrt(2 * Math.PI * p.T)
      close(ans[2], dens(p.w, p.sig1 * p.T) / dens(p.w, 0), 1e-9)
      // asset-or-nothing price under Q
      const m1 = (p.r - 0.5 * p.sig1 ** 2) * p.T, sd1 = p.sig1 * Math.sqrt(p.T)
      close(ans[3], Math.exp(-p.r * p.T) * simpson((z) => p.s1 * Math.exp(m1 + sd1 * z) * phi(z), Math.min((Math.log(p.K / p.s1) - m1) / sd1, 10), 10, 4000), 5e-4)
      // exchange option: nested integral under Q; S1 > S2 iff z2 < zstar(z1)
      const c = Math.sqrt(1 - p.rho ** 2), sT = Math.sqrt(p.T)
      const lnS1 = (z1: number) => Math.log(p.s1) + (p.r - 0.5 * p.sig1 ** 2) * p.T + p.sig1 * sT * z1
      const lnS2 = (z1: number, z2: number) => Math.log(p.s2) + (p.r - 0.5 * p.sig2 ** 2) * p.T + p.sig2 * sT * (p.rho * z1 + c * z2)
      const inner = (z1: number) => {
        const zstar = (lnS1(z1) - lnS2(z1, 0)) / (p.sig2 * sT * c)
        return simpson((z2) => (Math.exp(lnS1(z1)) - Math.exp(lnS2(z1, z2))) * phi(z2), -10, Math.max(-10, Math.min(zstar, 10)), 400)
      }
      const price = Math.exp(-p.r * p.T) * simpson((z1) => inner(z1) * phi(z1), -9, 9, 400)
      close(ans[4], price, 2e-3)
    }
  }, 120000)
})

