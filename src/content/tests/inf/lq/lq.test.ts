// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: the natural-parameter MLE by golden-section search of the log-likelihood; the UMVUEs as conditional expectations given the total, computed from Poisson pmf ratios and Binomial sums; the variance of the UMVUE by summing over the Poisson law of T.
//  B: Fisher information as the variance of a finite-difference score integrated over the density; efficiency from numerical integration over the Gamma density; Wald and score statistics from finite-difference derivatives of the log-likelihood.
//  C: risks by numerical integration over the normal law of the sample mean; crossing point by bisection; minimax linear rule by golden-section search of the maximum risk.
//  D: posterior moments by numerical integration; Bayes risk by exact enumeration of the beta-binomial marginal; constant risk of the minimax estimator by enumeration over the binomial law at several theta.
//  E: posterior by numerical integration of likelihood times prior on a grid.
//  F: the test as the Neyman-Pearson knapsack (outcomes sorted by likelihood ratio, budget alpha) in exact fractions.
//  G: conditional probabilities from Poisson pmf ratios; Fisher's p-value by enumerating all subsets of the margins.
//  H: coverage and expected length of the uniform interval by simulation and integration; the median interval by enumerating sign patterns; the bootstrap by enumerating all n^n resamples.
//  I: log-likelihood of the Poisson total maximised by golden-section search (likelihood ratio, two-sample statistic); Wald and score from finite-difference derivatives of the log-likelihood; the interval endpoint by grid scan and interpolation; null rejection rates of the statistics by Monte Carlo.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { F, Fr } from '../../../shared/fraction'
import * as A from './a-poisson'
import * as B from './b-exponential'
import * as C from './c-risk'
import * as D from './d-bayes-minimax'
import * as E from './e-gamma-poisson'
import * as Ff from './f-ump'
import * as G from './g-conditional'
import * as H from './h-confidence-bootstrap'
import * as I from './i-wilks'
import * as J from './j-sufficiency'
import * as K from './k-information'
import * as L from './l-bootstrap'
import * as M from './m-decision'
import * as N from './n-bayes'
import * as O from './o-riskset'
import * as P from './p-bayestest'
import * as Q from './q-nuisance'
import * as R from './r-expfam'
import * as S from './s-natural'
import * as T from './t-likelihood'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const lectures = topics.find((t) => t.id === 'inf')!.lectures.length
const simpson = (f: (x: number) => number, a: number, b: number, n = 6000) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3 }
const lgam = (x: number) => { let s = 0; for (let i = 2; i < x; i++) s += Math.log(i); return s } // log (x-1)! for integer x
const logFact = (k: number) => { let s = 0; for (let i = 2; i <= k; i++) s += Math.log(i); return s }
const poisPmf = (mu: number, k: number) => Math.exp(-mu + k * Math.log(mu) - logFact(k))
const golden = (f: (x: number) => number, lo: number, hi: number, maximise: boolean) => {
  const g = (x: number) => (maximise ? -f(x) : f(x)); const phi = (Math.sqrt(5) - 1) / 2
  let a = lo, b = hi, c = b - phi * (b - a), d = a + phi * (b - a)
  for (let i = 0; i < 120; i++) { if (g(c) < g(d)) b = d; else a = c; c = b - phi * (b - a); d = a + phi * (b - a) }
  return (a + b) / 2
}

const gens: [string, LQGenerator, number][] = [
  ['A', { id: 'A', generate: (r) => A.build(A.sample(r)) }, 5],
  ['B', { id: 'B', generate: (r) => B.build(B.sample(r)) }, 5],
  ['C', { id: 'C', generate: (r) => C.build(C.sample(r)) }, 5],
  ['D', { id: 'D', generate: (r) => D.build(D.sample(r)) }, 5],
  ['E', { id: 'E', generate: (r) => E.build(E.sample(r)) }, 5],
  ['F', { id: 'F', generate: (r) => Ff.build(Ff.sample(r)) }, 5],
  ['G', { id: 'G', generate: (r) => G.build(G.sample(r)) }, 5],
  ['H', { id: 'H', generate: (r) => H.build(H.sample(r)) }, 5],
  ['I', { id: 'I', generate: (r) => I.build(I.sample(r)) }, 5],
  ['J', { id: 'J', generate: (r) => J.build(J.sample(r)) }, 5],
  ['K', { id: 'K', generate: (r) => K.build(K.sample(r)) }, 5],
  ['L', { id: 'L', generate: (r) => L.build(L.sample(r)) }, 5],
  ['M', { id: 'M', generate: (r) => M.build(M.sample(r)) }, 5],
  ['N', { id: 'N', generate: (r) => N.build(N.sample(r)) }, 5],
  ['O', { id: 'O', generate: (r) => O.build(O.sample(r)) }, 5],
  ['P', { id: 'P', generate: (r) => P.build(P.sample(r)) }, 5],
  ['Q', { id: 'Q', generate: (r) => Q.build(Q.sample(r)) }, 5],
  ['R', { id: 'R', generate: (r) => R.build(R.sample(r)) }, 5],
  ['S', { id: 'S', generate: (r) => S.build(S.sample(r)) }, 5],
  ['T', { id: 'T', generate: (r) => T.build(T.sample(r)) }, 5],
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
        expect((p.tolerance?.abs ?? 0) + (p.tolerance?.rel ?? 0)).toBeGreaterThan(0)
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
  it('MLE of eta by search; UMVUEs as conditional expectations; variance by summing over T (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      const { n, total: t, lam0 } = p
      // 1: maximise the log-likelihood t*eta - n*exp(eta) over eta
      close(ans[0], golden((e) => t * e - n * Math.exp(e), -6, 6, true), 1e-6)
      // 2: E[X1(X1-1) | T=t] with X1 | T=t binomial (computed from Poisson pmf ratios)
      const lam = 1.3
      const cond = (k: number) => (poisPmf(lam, k) * poisPmf((n - 1) * lam, t - k)) / poisPmf(n * lam, t)
      let e2 = 0
      for (let k = 0; k <= t; k++) e2 += cond(k) * k * (k - 1)
      close(ans[1], e2, 1e-9)
      // 3, 4: P(X1=0 | T=t), P(X1=1 | T=t)
      close(ans[2], cond(0), 1e-9)
      close(ans[3], cond(1), 1e-9)
      // 5: variance of T(T-1)/n^2 under Poisson(n lam0)
      const mu = n * lam0
      let m1 = 0, m2 = 0
      for (let k = 0; k < 500; k++) { const u = (k * (k - 1)) / (n * n); const w = poisPmf(mu, k); m1 += w * u; m2 += w * u * u }
      close(m1, lam0 * lam0, 1e-9) // unbiasedness of the estimator
      close(ans[4], m2 - m1 * m1, 1e-7)
    }
  })
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  it('information by integrating the squared score; efficiency by integrating the Gamma law; Wald and score from log-likelihood derivatives (300 seeds)', () => {
    for (const s of seeds('B', 300)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      const { n, xbar, th0, th1 } = p
      const logf = (x: number, th: number) => -Math.log(th) - x / th
      // 1: I_1 = integral of (d/dtheta log f)^2 f, by central differences; bound = g'^2 / (n I_1)
      const h = 1e-5
      const I1 = simpson((x) => ((logf(x, th1 + h) - logf(x, th1 - h)) / (2 * h)) ** 2 * Math.exp(logf(x, th1)), 0, 80 * th1, 20000)
      close(ans[0], (2 * th1) ** 2 / (n * I1), 2e-3)
      // 2: efficiency of the UMVUE T^2/(n(n+1)); T ~ Gamma(n, theta), theta = 1.7 (the ratio does not depend on theta)
      const th = 1.7
      const dens = (x: number) => Math.exp((n - 1) * Math.log(x) - x / th - n * Math.log(th) - lgam(n))
      const Eu = simpson((x) => (x * x) / (n * (n + 1)) * dens(x), 1e-12, 12 * n * th, 30000)
      const Eu2 = simpson((x) => ((x * x) / (n * (n + 1))) ** 2 * dens(x), 1e-12, 12 * n * th, 30000)
      close(Eu, th * th, 1e-5)
      close(ans[1], ((4 * th ** 4) / n) / (Eu2 - Eu * Eu), 2e-4)
      // 3, 4: observed information at the MLE by a second difference of the log-likelihood
      const ll = (t: number) => -n * Math.log(t) - (n * xbar) / t
      const d = 1e-3
      const obs = -(ll(xbar + d) - 2 * ll(xbar) + ll(xbar - d)) / (d * d)
      close(ans[2], 1 / Math.sqrt(obs), 1e-4)
      close(ans[3], (xbar - th0) ** 2 * obs, 2e-3)
      // 5: score at theta0 by a first difference; expected information as the variance of the score over S ~ Gamma(n, th0)
      const score0 = (ll(th0 + 1e-5) - ll(th0 - 1e-5)) / 2e-5
      const sc = (S: number) => -n / th0 + S / (th0 * th0)
      const densS = (x: number) => Math.exp((n - 1) * Math.log(x) - x / th0 - n * Math.log(th0) - lgam(n))
      const varScore = simpson((S) => sc(S) ** 2 * densS(S), 1e-12, 12 * n * th0, 30000)
      close(ans[4], (score0 * score0) / varScore, 2e-3)
    }
  }, 300000)
})

// ---------- C ----------
describe('generator C against independent computation', () => {
  it('risks by integrating over the normal law of the sample mean; crossing point; best linear rule (200 seeds)', () => {
    for (const s of seeds('C', 200)) {
      const p = C.sample(makeRng(s))
      const ans = answers(C.build(p))
      const { s2, n, a, theta1, p: pr, m } = p
      const v = s2 / n, sd = Math.sqrt(v)
      const risk = (c: number, th: number, pts = 4000) => simpson((x) => (c * x - th) ** 2 * Math.exp(-((x - th) ** 2) / (2 * v)) / Math.sqrt(2 * Math.PI * v), th - 10 * sd, th + 10 * sd, pts)
      close(ans[0], pr * risk(1, theta1) + (1 - pr) * theta1 ** 2, 1e-6)
      close(ans[1], risk(a, theta1), 1e-6)
      // crossing: bisection on risk(a, th) - risk(1, th), which increases in |th|
      let lo = 0, hi = 50
      for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (risk(a, mid, 1500) < risk(1, mid, 1500)) lo = mid; else hi = mid }
      close(ans[2], (lo + hi) / 2, 1e-4)
      // maximum over a grid of theta in [-m, m]
      let mx = 0
      for (let i = 0; i <= 20; i++) mx = Math.max(mx, risk(a, -m + (2 * m * i) / 20, 1500))
      close(ans[3], mx, 1e-6)
      // best linear rule: minimise the maximum risk over the grid
      const maxRisk = (c: number) => { let r = 0; for (let i = 0; i <= 8; i++) r = Math.max(r, risk(c, -m + (2 * m * i) / 8, 800)); return r }
      close(ans[4], golden(maxRisk, 0, 1, false), 1e-4)
    }
  }, 300000)
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('posterior moments by integration; Bayes risk by exact enumeration; minimax estimate has constant risk (300 seeds)', () => {
    const fact = (k: number) => { let r = 1n; for (let i = 2n; i <= BigInt(k); i++) r *= i; return r }
    const chooseB = (nn: number, k: number) => fact(nn) / (fact(k) * fact(nn - k))
    const beta = (a: number, b: number) => new Fr(fact(a - 1) * fact(b - 1), fact(a + b - 1)) // B(a, b), integer arguments
    for (const s of seeds('D', 300)) {
      const p = D.sample(makeRng(s))
      const ans = answers(D.build(p))
      const { n, x, al, be } = p
      const a = al + x, b = be + n - x
      const kern = (th: number) => th ** (a - 1) * (1 - th) ** (b - 1)
      const Z = simpson(kern, 0, 1, 4000)
      const mean = simpson((th) => th * kern(th), 0, 1, 4000) / Z
      const vr = simpson((th) => (th - mean) ** 2 * kern(th), 0, 1, 4000) / Z
      close(ans[0], mean, 1e-9)
      close(ans[1], vr, 1e-9)
      // Bayes risk: sum over x' of marginal probability times posterior variance, in exact fractions
      let risk = F(0)
      for (let xx = 0; xx <= n; xx++) {
        const marg = new Fr(chooseB(n, xx), 1n).mul(beta(al + xx, be + n - xx)).div(beta(al, be))
        const aa = al + xx, bb = be + n - xx
        const pv = F(aa * bb, (aa + bb) ** 2 * (aa + bb + 1))
        risk = risk.add(marg.mul(pv))
      }
      close(ans[2], risk.num, 1e-12)
      // minimax: recover the estimator (x'+s)/(n+2s) from the answer, then check its risk is constant in theta and equals the answer
      const est = ans[3]
      const sh = Math.abs(2 * est - 1) < 1e-9 ? Math.sqrt(n) / 2 : (x - est * n) / (2 * est - 1)
      close(sh, Math.sqrt(n) / 2, 1e-6)
      for (const th of [0.05, 0.2, 0.5, 0.8, 0.97]) {
        let r = 0
        for (let xx = 0; xx <= n; xx++) r += Number(chooseB(n, xx)) * th ** xx * (1 - th) ** (n - xx) * ((xx + sh) / (n + 2 * sh) - th) ** 2
        close(ans[4], r, 1e-9)
      }
    }
  }, 300000)
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  it('posterior summaries by numerical integration of likelihood times prior (200 seeds)', () => {
    for (const s of seeds('E', 200)) {
      const p = E.sample(makeRng(s))
      const ans = answers(E.build(p))
      const { n, total, a, b } = p
      const logk = (l: number) => (total + a - 1) * Math.log(l) - (n + b) * l
      const top = Math.max(...Array.from({ length: 400 }, (_, i) => logk(0.01 + i * 0.05)))
      const k = (l: number) => (l <= 0 ? 0 : Math.exp(logk(l) - top))
      const L = 80
      const Z = simpson(k, 0, L, 80000)
      const mean = simpson((l) => l * k(l), 0, L, 80000) / Z
      const vr = simpson((l) => (l - mean) ** 2 * k(l), 0, L, 80000) / Z
      close(ans[0], mean, 1e-6)
      close(ans[1], vr, 1e-6)
      const xb = total / n
      if (Math.abs(xb - a / b) > 0.05) close(ans[2], (mean - a / b) / (xb - a / b), 1e-5)
      close(ans[3], simpson((l) => Math.exp(-l) * k(l), 0, L, 80000) / Z, 1e-6)
      close(ans[4], mean - 1.96 * Math.sqrt(vr), 1e-5)
    }
  }, 300000)
})

// ---------- F ----------
describe('generator F against independent computation', () => {
  it('Neyman-Pearson knapsack over outcomes sorted by likelihood ratio, in exact fractions (all parameter combinations)', () => {
    const choose = (nn: number, k: number) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (nn - k + i)) / i; return Math.round(r) }
    const pmfF = (nn: number, p: Fr, k: number) => { let r = F(choose(nn, k)); for (let i = 0; i < k; i++) r = r.mul(p); const q = F(1).sub(p); for (let i = 0; i < nn - k; i++) r = r.mul(q); return r }
    const p0s: [number, number][] = [[1, 4], [1, 3], [1, 2]], p1s: [number, number][] = [[2, 3], [3, 4], [4, 5]], als: [number, number][] = [[1, 20], [1, 10]]
    for (let n = 8; n <= 12; n++) for (const q0 of p0s) for (const q1 of p1s) for (const al of als) {
      const ans = answers(Ff.build({ n, p0: q0, p1: q1, alpha: al }))
      const P0 = F(q0[0], q0[1]), P1 = F(q1[0], q1[1]), alpha = F(al[0], al[1])
      const f0 = Array.from({ length: n + 1 }, (_, y) => pmfF(n, P0, y)), f1 = Array.from({ length: n + 1 }, (_, y) => pmfF(n, P1, y))
      const order = Array.from({ length: n + 1 }, (_, y) => y).sort((u, v) => f1[v].mul(f0[u]).cmp(f1[u].mul(f0[v]))) // decreasing likelihood ratio
      const phi: Fr[] = Array.from({ length: n + 1 }, () => F(0))
      let budget = alpha
      for (const y of order) {
        if (budget.zero) break
        if (f0[y].cmp(budget) <= 0) { phi[y] = F(1); budget = budget.sub(f0[y]) } else { phi[y] = budget.div(f0[y]); budget = F(0) }
      }
      const cStar = Math.max(...phi.map((v, y) => (v.cmp(F(1)) < 0 ? y : -1)))
      expect(ans[0]).toBe(cStar)
      let size = F(0), power = F(0)
      for (let y = 0; y <= n; y++) { size = size.add(phi[y].mul(f0[y])); power = power.add(phi[y].mul(f1[y])) }
      expect(size.cmp(alpha)).toBe(0)
      let tail = F(0)
      for (let y = cStar + 1; y <= n; y++) tail = tail.add(f0[y])
      close(ans[1], tail.num, 1e-12)
      close(ans[2], phi[cStar].num, 1e-12)
      close(ans[3], power.num, 1e-12)
      close(ans[4], f1[cStar].div(f0[cStar]).num, 1e-9 * Math.max(1, f1[cStar].div(f0[cStar]).num))
    }
  })
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  it('conditional probabilities from Poisson pmf ratios; Fisher p-value by enumerating subsets of the margins (300 seeds)', () => {
    for (const s of seeds('G', 300)) {
      const p = G.sample(makeRng(s))
      const ans = answers(G.build(p))
      const { m, x, rho, r1, r2, a, b } = p
      const cond = (l1: number, l2: number, k: number) => (poisPmf(l1, k) * poisPmf(l2, m - k)) / poisPmf(l1 + l2, m)
      for (const lam of [0.8, 2.5]) {
        close(ans[0], cond(lam, lam, x), 1e-9)
        let up = 0, lowTail = 0
        for (let k = x; k <= m; k++) up += cond(lam, lam, k)
        for (let k = 0; k <= m - x; k++) lowTail += cond(lam, lam, k)
        close(ans[1], up, 1e-9)
        close(ans[2], up + lowTail, 1e-9)
      }
      close(ans[4], cond(rho * 0.7, 0.7, x), 1e-9)
      // Fisher: enumerate all subsets of size c1 of the N units (first r1 units are group 1)
      const N = r1 + r2, c1 = a + b
      let hit = 0, tot = 0
      for (let mask = 0; mask < 1 << N; mask++) {
        let bits = 0, g1 = 0
        for (let i = 0; i < N; i++) if (mask & (1 << i)) { bits++; if (i < r1) g1++ }
        if (bits !== c1) continue
        tot++
        if (g1 >= a) hit++
      }
      close(ans[3], hit / tot, 1e-12)
    }
  })
  it('the two-sided p-value is the sum of both tails and the null law is symmetric', () => {
    for (const s of seeds('G', 50)) {
      const p = G.sample(makeRng(s))
      expect(p.x).toBeGreaterThan(p.m / 2)
    }
  })
})

// ---------- H ----------
describe('generator H against independent computation', () => {
  it('coverage by simulation, expected length by integration, median interval by sign patterns, bootstrap by full enumeration (200 seeds)', () => {
    for (const s of seeds('H', 200)) {
      const p = H.sample(makeRng(s))
      const ans = answers(H.build(p))
      const { n, mx, alpha, th, n2, k, data } = p
      const c = ans[0] / mx
      expect(c).toBeGreaterThan(1)
      // 1: simulated coverage of [M, cM] for true theta = 1 should be 1 - alpha
      const rng = makeRng('sim' + s)
      let cov = 0
      const sims = 20000
      for (let i = 0; i < sims; i++) { let M = 0; for (let j = 0; j < n; j++) M = Math.max(M, rng.next()); if (M <= 1 && c * M >= 1) cov++ }
      expect(Math.abs(cov / sims - (1 - alpha)), `coverage ${cov / sims} for alpha ${alpha}`).toBeLessThan(0.012)
      // 2: expected length by integrating over the density of the maximum
      close(ans[1], simpson((x) => (c - 1) * x * ((n * x ** (n - 1)) / th ** n), 0, th, 4000), 1e-9)
      // 3: median interval covers iff at least k observations lie below and at least k above the median; enumerate sign patterns
      let good = 0
      for (let mask = 0; mask < 1 << n2; mask++) { let neg = 0; for (let i = 0; i < n2; i++) if (mask & (1 << i)) neg++; if (neg >= k && n2 - neg >= k) good++ }
      close(ans[2], good / 2 ** n2, 1e-12)
      // 4, 5: enumerate all n^n bootstrap resamples
      const nb = data.length
      const means: number[] = [], vars: number[] = []
      const idx = new Array(nb).fill(0)
      for (let r = 0; r < nb ** nb; r++) {
        let t = r
        for (let i = 0; i < nb; i++) { idx[i] = t % nb; t = Math.floor(t / nb) }
        const vals = idx.map((i) => data[i])
        const mu = vals.reduce((u, v) => u + v, 0) / nb
        means.push(mu); vars.push(vals.reduce((u, v) => u + (v - mu) ** 2, 0) / nb)
      }
      const em = means.reduce((u, v) => u + v, 0) / means.length
      close(ans[3], Math.sqrt(means.reduce((u, v) => u + (v - em) ** 2, 0) / means.length), 1e-9)
      const mu0 = data.reduce((u, v) => u + v, 0) / nb
      const plug = data.reduce((u, v) => u + (v - mu0) ** 2, 0) / nb
      close(ans[4], vars.reduce((u, v) => u + v, 0) / vars.length - plug, 1e-9)
    }
  }, 300000)
})

// ---------- I ----------
describe('generator I against independent computation', () => {
  // log-likelihood of the Poisson total T over n observations (the factorial constant is kept, it cancels in differences)
  const ll = (T: number, n: number, lam: number) => -n * lam + T * Math.log(n * lam) - logFact(T)
  const mle = (T: number, n: number) => golden((l) => ll(T, n, l), 0.01, 40, true)
  const poisDraw = (rng: ReturnType<typeof makeRng>, mu: number) => { const u = rng.next(); let k = 0, p = Math.exp(-mu), c = p; while (u > c && k < 1000) { k++; p *= mu / k; c += p } return k }
  it('likelihood ratio by maximising the log-likelihood; Wald and score by finite differences; endpoint by scanning; two-sample statistic by golden-section search (300 seeds)', () => {
    for (const s of seeds('I', 300)) {
      const p = I.sample(makeRng(s))
      const ans = answers(I.build(p))
      const { n, lam0, T, n2, T2 } = p
      const hat = mle(T, n)
      close(hat, T / n, 1e-5)
      close(ans[0], 2 * (ll(T, n, hat) - ll(T, n, lam0)), 1e-6)
      // Wald: observed information from the second difference at the MLE
      const h = 1e-3
      const info = -(ll(T, n, hat + h) - 2 * ll(T, n, hat) + ll(T, n, hat - h)) / (h * h)
      close(ans[1], (hat - lam0) ** 2 * info, 1e-3)
      // score: derivative at lambda0 by central difference, expected information n / lambda0
      const u = (ll(T, n, lam0 + h) - ll(T, n, lam0 - h)) / (2 * h)
      close(ans[2], (u * u) / (n / lam0), 1e-5)
      // upper endpoint: scan upward from the MLE until the deviance crosses the critical value, then interpolate
      const dv = (l: number) => 2 * (ll(T, n, hat) - ll(T, n, l))
      let l = hat; const step = 1e-3
      while (dv(l + step) <= I.CRIT) l += step
      const frac = (I.CRIT - dv(l)) / (dv(l + step) - dv(l))
      close(ans[3], l + frac * step, 2e-3)
      // two-sample: pooled MLE by search of the joint log-likelihood against the separate MLEs
      const common = golden((x) => ll(T, n, x) + ll(T2, n2, x), 0.01, 40, true)
      const sep = ll(T, n, mle(T, n)) + ll(T2, n2, mle(T2, n2))
      close(ans[4], 2 * (sep - ll(T, n, common) - ll(T2, n2, common)), 1e-5)
    }
  }, 300000)
  it('Wilks: the one-degree-of-freedom statistics reject at about 5% under the null (Monte Carlo)', () => {
    for (const s of seeds('I', 12)) {
      const p = I.sample(makeRng(s)); const rng = makeRng('mc' + s)
      let rej1 = 0, rej2 = 0; const sims = 12000
      for (let i = 0; i < sims; i++) {
        const t = poisDraw(rng, p.n * p.lam0)
        if (t > 0 && I.dev(t, p.n, p.lam0) > I.CRIT) rej1++
        const a = poisDraw(rng, p.n * p.lam0), b = poisDraw(rng, p.n2 * p.lam0)
        if (a > 0 && b > 0) { const pooled = (a + b) / (p.n + p.n2); if (2 * (a * Math.log(a / p.n / pooled) + b * Math.log(b / p.n2 / pooled)) > I.CRIT) rej2++ }
      }
      expect(Math.abs(rej1 / sims - 0.05), `one-sample rejection ${rej1 / sims}`).toBeLessThan(0.02)
      expect(Math.abs(rej2 / sims - 0.05), `two-sample rejection ${rej2 / sims}`).toBeLessThan(0.015)
    }
  }, 120000)
})
