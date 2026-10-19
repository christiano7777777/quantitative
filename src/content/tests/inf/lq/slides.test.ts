// Independent checks of the generators written from the HKU STAT3602 lecture notes (LQ-M to LQ-T). Every answer is
// recomputed by a DIFFERENT method from the generator's own:
//  M: all rules enumerated; risks as an exact expectation over both outcomes with probabilities as fractions.
//  N: Bayes risk over the joint distribution of (theta, X) in exact fractions; the Bayes action at x = 1 must equal the action
//     of the rule with the smallest Bayes risk among all rules; the unbiasedness gap in exact fractions.
//  O: the equalising mixture by a ternary search of the maximum risk; the tie prior by bisection on the Bayes risk difference.
//  P: the Beta moments, the odds mean and P(theta <= 1/2) by numerical integration of the posterior density.
//  Q: exact fractions; the smallest set by trying every subset of the three values.
//  R: natural parameters by second differences of the log density; the variance of the natural statistic as a numerical
//     second derivative of A_n(eta).
//  S: the conditional law from the joint Poisson pmfs, P(S = k, Y = t - k) / P(T = t), at two different rate scales.
//  T: likelihoods evaluated directly at several parameter values; binomial and negative binomial likelihoods compared.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import { F, Fr } from '../../../shared/fraction'
import * as M from './m-decision'
import * as N from './n-bayes'
import * as O from './o-riskset'
import * as P from './p-bayestest'
import * as Q from './q-nuisance'
import * as R from './r-expfam'
import * as S from './s-natural'
import * as T from './t-likelihood'
import * as U from './u-decision'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const close = (got: number, want: number, tol = 1e-9, what = '') => expect(Math.abs(got - want), `${what}: got ${got}, want ${want}`).toBeLessThan(tol)
const simpson = (f: (x: number) => number, a: number, b: number, n = 20000) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3 }
const frac = (x: number) => F(Math.round(x * 1000), 1000)

describe('generator M against independent computation', () => {
  it('rule count and risks as exact expectations (300 seeds)', () => {
    for (const s of seeds('M', 300)) {
      const P0 = M.sample(makeRng(s))
      const ans = M.build(P0).parts.map((p) => p.answer)
      const { k, loss, p, d, e } = P0
      let rules = 0
      for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) rules++
      expect(ans[0]).toBe(rules)
      const R = (t: 0 | 1, rule: [number, number]) => {
        let tot = F(0)
        for (const x of [0, 1]) tot = tot.add((x === 1 ? frac(p[t]) : F(1).sub(frac(p[t]))).mul(F(loss[t][rule[x]])))
        return tot.num
      }
      close(ans[1], R(0, d), 1e-12); close(ans[2], R(1, d), 1e-12)
      close(ans[3], R(0, e), 1e-12); close(ans[4], R(1, e), 1e-12)
    }
  })
})

describe('generator N against independent computation', () => {
  it('Bayes risk over the joint law, the Bayes action agrees with the minimum Bayes risk rule, unbiasedness gap (300 seeds)', () => {
    for (const s of seeds('N', 300)) {
      const P0 = N.sample(makeRng(s))
      const ans = N.build(P0).parts.map((p) => p.answer)
      const { loss, p, w, d } = P0
      const pi = [F(Math.round(w[0] * 1e6), 1e6), F(Math.round(w[1] * 1e6), 1e6)]
      const pr = (t: number, x: number) => (x === 1 ? frac(p[t]) : F(1).sub(frac(p[t])))
      const bayes = (rule: [number, number]) => { let r = F(0); for (const t of [0, 1]) for (const x of [0, 1]) r = r.add(pi[t].mul(pr(t, x)).mul(F(loss[t][rule[x]]))); return r }
      close(ans[0], bayes(d).num, 1e-5, `${s} Bayes risk`)
      const joint1 = pi[0].mul(pr(0, 1)), joint2 = pi[1].mul(pr(1, 1))
      const post1 = joint1.div(joint1.add(joint2))
      close(ans[1], post1.num, 1e-5, `${s} posterior`)
      const el = (a: number) => post1.mul(F(loss[0][a])).add(F(1).sub(post1).mul(F(loss[1][a]))).num
      close(ans[2], el(0), 1e-4); close(ans[3], el(1), 1e-4)
      // the rule with the smallest Bayes risk uses the action with the smaller posterior expected loss at x = 1
      let best: [number, number] = [0, 0], br = bayes(best).num
      for (const r0 of [0, 1]) for (const r1 of [0, 1]) { const b = bayes([r0, r1]).num; if (b < br - 1e-12) { br = b; best = [r0, r1] } }
      if (Math.abs(el(0) - el(1)) > 1e-6) expect(best[1], s).toBe(el(0) < el(1) ? 0 : 1)
      const gap = F(loss[0][d[0]]).mul(F(1).sub(frac(p[1]))).add(F(loss[0][d[1]]).mul(frac(p[1]))).sub(F(loss[0][d[0]]).mul(F(1).sub(frac(p[0]))).add(F(loss[0][d[1]]).mul(frac(p[0]))))
      close(ans[4], gap.num, 1e-9, `${s} gap`)
    }
  })
})

describe('generator O against independent computation', () => {
  it('mixture risks, the equalising mixture by ternary search, the tie prior by bisection (300 seeds)', () => {
    for (const s of seeds('O', 300)) {
      const P0 = O.sample(makeRng(s))
      const ans = O.build(P0).parts.map((p) => p.answer)
      const { a, b, q } = P0
      const R1 = (p: number) => p * a[0] + (1 - p) * b[0], R2 = (p: number) => p * a[1] + (1 - p) * b[1]
      close(ans[0], R1(q), 1e-12); close(ans[1], R2(q), 1e-12)
      // minimise the maximum risk over mixtures
      let lo = 0, hi = 1
      for (let i = 0; i < 200; i++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (Math.max(R1(m1), R2(m1)) < Math.max(R1(m2), R2(m2))) hi = m2; else lo = m1 }
      const pStar = (lo + hi) / 2
      close(ans[2], pStar, 1e-6, `${s} p*`)
      close(ans[3], Math.max(R1(pStar), R2(pStar)), 1e-6, `${s} minimax risk`)
      // tie prior: Bayes risk difference w(a0 - b0) + (1-w)(a1 - b1) changes sign once on [0, 1]
      const diff = (w: number) => w * (a[0] - b[0]) + (1 - w) * (a[1] - b[1])
      let l2 = 0, h2 = 1
      for (let i = 0; i < 200; i++) { const m = (l2 + h2) / 2; if (diff(l2) * diff(m) <= 0) h2 = m; else l2 = m }
      close(ans[4], (l2 + h2) / 2, 1e-9, `${s} tie prior`)
    }
  })
})

describe('generator P against independent computation', () => {
  it('Beta moments, odds mean and P(H0) by numerical integration, expected posterior losses (300 seeds)', () => {
    for (const s of seeds('P', 300)) {
      const P0 = P.sample(makeRng(s))
      const ans = P.build(P0).parts.map((p) => p.answer)
      const A = P0.a + P0.x, B = P0.b + P0.n - P0.x
      const dens = (t: number) => (t <= 0 || t >= 1 ? 0 : t ** (A - 1) * (1 - t) ** (B - 1))
      const z = simpson(dens, 0, 1)
      close(ans[0], simpson((t) => t * dens(t), 0, 1) / z, 1e-7, `${s} mean`)
      close(ans[1], simpson((t) => (t >= 1 ? 0 : (t / (1 - t)) * dens(t)), 0, 1) / z, 1e-5, `${s} odds mean`)
      const p0 = simpson(dens, 0, 0.5) / z
      close(ans[2], 0 + p0, 1e-7, `${s} P(H0)`)
      close(ans[3], P0.L1 * (1 - p0), 1e-6); close(ans[4], P0.L0 * p0, 1e-6)
    }
  })
})

describe('generator Q against independent computation', () => {
  it('normalising constant, marginal, smallest set by subset search, predictive, mean (300 seeds)', () => {
    for (const s of seeds('Q', 300)) {
      const P0 = Q.sample(makeRng(s))
      const ans = Q.build(P0).parts.map((p) => p.answer)
      const { w, level } = P0
      const tot = F(w.flat().reduce((a, b) => a + b, 0))
      expect(ans[0]).toBe(tot.num)
      const marg = w.map((r) => F(r[0] + r[1]).div(tot))
      close(ans[1], marg[1].num, 1e-12)
      let best = 4
      for (let mask = 1; mask < 8; mask++) {
        let pr = F(0), size = 0
        for (let i = 0; i < 3; i++) if (mask & (1 << i)) { pr = pr.add(marg[i]); size++ }
        if (pr.num >= level - 1e-12 && size < best) best = size
      }
      expect(ans[2], s).toBe(best)
      close(ans[3], marg.reduce((a, m, i) => a.add(m.mul(F(i + 1, 4))), F(0)).num, 1e-12)
      close(ans[4], marg.reduce((a, m, i) => a.add(m.mul(F(i + 1))), F(0)).num, 1e-12)
    }
  })
})

describe('generator R against independent computation', () => {
  it('natural parameters by second differences of the log density, variance by numerical A\'\' (300 seeds)', () => {
    for (const s of seeds('R', 300)) {
      const P0 = R.sample(makeRng(s))
      const ans = R.build(P0).parts.map((p) => p.answer)
      close(ans[0], Math.log(P0.lam), 1e-12)
      expect(ans[1]).toBe(P0.x.reduce((a, b) => a + b, 0))
      const logf = (x: number) => -0.5 * Math.log(2 * Math.PI * P0.s2) - (x - P0.mu) ** 2 / (2 * P0.s2)
      const h = 0.5
      close(ans[2], (logf(1 + h) - 2 * logf(1) + logf(1 - h)) / (2 * h * h), 1e-9, `${s} eta1`)
      // eta2 as the slope of log f(x) - eta1 x^2 in x
      const eta1 = ans[2]
      const g = (x: number) => logf(x) - eta1 * x * x
      close(ans[3], (g(2) - g(1)), 1e-9, `${s} eta2`)
      const eta = Math.log(P0.p / (1 - P0.p))
      const A = (e: number) => P0.n * Math.log(1 + Math.exp(e))
      const d = 1e-3
      close(ans[4], (A(eta + d) - 2 * A(eta) + A(eta - d)) / (d * d), 1e-5, `${s} variance`)
    }
  })
})

describe('generator S against independent computation', () => {
  it('conditional law from the joint Poisson pmfs, at two rate scales (300 seeds)', () => {
    const pois = (mean: number, j: number) => { let lf = -mean + j * Math.log(mean); for (let i = 2; i <= j; i++) lf -= Math.log(i); return Math.exp(lf) }
    for (const s of seeds('S', 300)) {
      const P0 = S.sample(makeRng(s))
      const ans = S.build(P0).parts.map((p) => p.answer)
      const { m, n, lam, mu, t, k } = P0
      close(ans[0], Math.log(lam / mu), 1e-12)
      const cond = (l: number, mm: number, j: number) => pois(m * l, j) * pois(n * mm, t - j) / pois(m * l + n * mm, t)
      let ex = 0
      for (let j = 0; j <= t; j++) ex += j * cond(lam, mu, j)
      close(ans[1], ex / t, 1e-9, `${s} success probability`)
      close(ans[4], ex, 1e-9, `${s} conditional mean`)
      // under H0 the conditional law does not depend on the common rate
      close(ans[2], cond(1, 1, k), 1e-9, `${s} P(S=k) at rate 1`)
      close(ans[2], cond(2.7, 2.7, k), 1e-9, `${s} P(S=k) at rate 2.7`)
      let tail = 0
      for (let j = k; j <= t; j++) tail += cond(0.8, 0.8, j)
      close(ans[3], tail, 1e-9, `${s} tail`)
    }
  })
})

describe('generator T against independent computation', () => {
  it('likelihood ratios evaluated directly; binomial and negative binomial give the same ratio (300 seeds)', () => {
    const logfact = (k: number) => { let f = 0; for (let i = 2; i <= k; i++) f += Math.log(i); return f }
    const logPois = (x: number[], l: number) => x.reduce((a, v) => a - l + v * Math.log(l) - logfact(v), 0)
    const choose = (n: number, k: number) => Math.exp(logfact(n) - logfact(k) - logfact(n - k))
    for (const s of seeds('T', 300)) {
      const P0 = T.sample(makeRng(s))
      const ans = T.build(P0).parts.map((p) => p.answer)
      for (const l of [0.7, 1.9, 4.2]) close(ans[0], Math.exp(logPois(P0.A, l) - logPois(P0.B, l)), 1e-9, `${s} equal-sum ratio at ${l}`)
      close(ans[1], Math.exp(logPois(P0.A, P0.lam0) - logPois(P0.C, P0.lam0)), 1e-9, `${s} unequal ratio`)
      const n = P0.mx.length
      const L = (th: number) => (P0.mx.every((v) => v <= th) ? th ** -n : 0)
      close(ans[2], L(P0.th[0]), 5e-7, `${s} uniform likelihood`)
      close(ans[3], L(P0.th[1]) / L(P0.th[0]), 1e-9, `${s} uniform ratio`)
      const [p1, p2] = P0.p
      const Lb = (p: number) => choose(12, P0.r) * p ** P0.r * (1 - p) ** (12 - P0.r)
      const Ln = (p: number) => choose(11, P0.r - 1) * p ** P0.r * (1 - p) ** (12 - P0.r)
      close(ans[4], Lb(p1) / Lb(p2), 1e-9, `${s} binomial ratio`)
      close(ans[4], Ln(p1) / Ln(p2), 1e-9, `${s} negative binomial ratio`)
    }
  })
})

void Fr

describe('generator U (the single question of lecture 1) against independent computation', () => {
  it('rule count, exact risks, the dominated rule and the minimax value, and the promises it makes (300 seeds)', () => {
    const t = (x: number) => F(Math.round(x * 100), 100)
    for (const s of seeds('U', 300)) {
      const P0 = U.sample(makeRng(s))
      const ans = U.build(P0).parts.map((p) => p.answer)
      const { k, loss, p, rules } = P0
      let count = 0
      for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) count++
      expect(ans[0]).toBe(count)
      const R = (th: 0 | 1, d: [number, number]) => F(loss[th][d[0]]).mul(F(1).sub(t(p[th]))).add(F(loss[th][d[1]]).mul(t(p[th])))
      close(ans[1], R(0, rules[0]).num, 1e-12, `${s} R1`)
      close(ans[2], R(1, rules[0]).num, 1e-12, `${s} R2`)
      const risks = rules.map((d) => [R(0, d), R(1, d)])
      const dom = (a: Fr[], b: Fr[]) => a[0].cmp(b[0]) <= 0 && a[1].cmp(b[1]) <= 0 && (a[0].cmp(b[0]) < 0 || a[1].cmp(b[1]) < 0)
      const dominated = risks.map((r, i) => risks.some((q, j) => j !== i && dom(q, r)) ? i : -1).filter((i) => i >= 0)
      expect(dominated, `${s} exactly one dominated rule`).toHaveLength(1)
      expect(ans[3]).toBe(dominated[0] + 1)
      const maxes = risks.map((r) => (r[0].cmp(r[1]) >= 0 ? r[0] : r[1]))
      let best = maxes[0]
      for (const m of maxes) if (m.cmp(best) < 0) best = m
      expect(maxes.filter((m) => m.cmp(best) === 0), `${s} unique minimax`).toHaveLength(1)
      expect(maxes[dominated[0]].cmp(best), `${s} dominated rule is not the minimax one`).toBeGreaterThan(0)
      close(ans[4], best.num, 1e-12, `${s} minimax value`)
    }
  })
})
