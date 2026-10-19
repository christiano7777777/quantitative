// Tests of the generators used only by lecture quizzes (inf lectures 10, 13 and 18). Every answer is recomputed by a
// different method from the generator's own:
//  J: the MLE of the normal variance by numerical maximisation of the log-likelihood; the natural parameter from a
//     second difference of the log density; the conditional probability by enumerating all 0/1 sequences with the
//     given total, at two different values of p (the sufficiency property).
//  K: Fisher information as the expected squared score (finite-difference score, exact expectation over {0,1});
//     the bound for p^2 with a finite-difference derivative; the efficiency from the exact variance of the mean of
//     the first m observations; the log-odds information from the likelihood written in the log-odds.
//  L: the bootstrap standard error and bias by enumerating all n^n equally likely resamples; the number of distinct
//     resamples by counting the multisets of size n.
import { describe, expect, it } from 'vitest'
import { topics } from '../../../../data'
import { makeRng } from '../../../../lib/rng'
import * as J from './j-sufficiency'
import * as K from './k-information'
import * as L from './l-bootstrap'

const lectures = topics.find((t) => t.id === 'inf')!.lectures.length
const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const close = (got: number, want: number, tol: number, what = '') => expect(Math.abs(got - want), `${what}: got ${got}, want ${want}`).toBeLessThan(tol)

const gens = [
  ['J', (s: string) => J.build(J.sample(makeRng(s))), 10],
  ['K', (s: string) => K.build(K.sample(makeRng(s))), 13],
  ['L', (s: string) => L.build(L.sample(makeRng(s))), 18],
] as const

describe.each(gens)('lecture-quiz generator %s: generic rules', (name, make, lec) => {
  it('has 5 well-formed parts tagged with its lecture (300 seeds)', () => {
    expect(lec).toBeLessThanOrEqual(lectures)
    for (const s of seeds(name, 300)) {
      const inst = make(s)
      expect(inst.parts, s).toHaveLength(5)
      for (const text of [inst.intro, ...inst.parts.flatMap((p) => [p.prompt, p.explanation])]) {
        expect(text, s).not.toMatch(/NaN|undefined|Infinity|\[object/)
        expect(/[\u0000-\u001f\u007f]/.test(text), s).toBe(false)
        expect((text.match(/\$/g) ?? []).length % 2, `${s}: ${text}`).toBe(0)
      }
      for (const p of inst.parts) {
        expect(Number.isFinite(p.answer), s).toBe(true)
        expect(p.lecture).toBe(lec)
        expect(p.tolerance?.abs).toBeGreaterThan(0)
      }
    }
  })
})

const ternaryMax = (f: (x: number) => number, lo: number, hi: number) => {
  for (let i = 0; i < 300; i++) {
    const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3
    if (f(m1) < f(m2)) lo = m1
    else hi = m2
  }
  return (lo + hi) / 2
}

describe('lecture-quiz generator J against independent computation', () => {
  it('sums, MLE of the variance, natural parameter, conditional probability (300 seeds)', () => {
    for (const s of seeds('J', 300)) {
      const P = J.sample(makeRng(s))
      const ans = J.build(P).parts.map((p) => p.answer)
      const { x, nb, t } = P
      const n = x.length
      // sums: the second through the identity sum x^2 = sum (x - xbar)^2 + n xbar^2
      const xbar = x.reduce((a, v) => a + v, 0) / n
      close(ans[0], n * xbar, 1e-9, `${s} sum`)
      close(ans[1], x.reduce((a, v) => a + (v - xbar) ** 2, 0) + n * xbar * xbar, 1e-9, `${s} sum of squares`)
      // MLE of (mu, sigma^2) by alternating one-dimensional maximisations of the log-likelihood
      const ll = (mu: number, v: number) => x.reduce((a, xi) => a - 0.5 * Math.log(2 * Math.PI * v) - (xi - mu) ** 2 / (2 * v), 0)
      let mu = 0, v = 1
      for (let r = 0; r < 12; r++) {
        mu = ternaryMax((m) => ll(m, v), -50, 50)
        v = ternaryMax((w) => ll(mu, w), 1e-6, 400)
      }
      close(ans[2], v, 1e-5, `${s} MLE of sigma^2`)
      // natural parameter eta2 as the coefficient of x^2 in the log density: second difference over x
      const logf = (xx: number) => -0.5 * Math.log(2 * Math.PI * v) - (xx - mu) ** 2 / (2 * v)
      const h = 1
      close(ans[3], (logf(2 + h) - 2 * logf(2) + logf(2 - h)) / (2 * h * h), 1e-6, `${s} natural parameter`)
      // conditional probability by enumeration, identical for two different values of p
      const conditional = (p: number) => {
        let num = 0, den = 0
        for (let m = 0; m < 2 ** nb; m++) {
          const bits = Array.from({ length: nb }, (_, i) => (m >> i) & 1)
          if (bits.reduce((a, b) => a + b, 0) !== t) continue
          const pr = bits.reduce((a, b) => a * (b ? p : 1 - p), 1)
          den += pr
          if (bits[0] === 1 && bits[1] === 0) num += pr
        }
        return num / den
      }
      close(ans[4], conditional(0.3), 1e-9, `${s} conditional (p=0.3)`)
      close(conditional(0.3), conditional(0.85), 1e-9, `${s} free of p`)
    }
  })
})

describe('lecture-quiz generator K against independent computation', () => {
  it('information, bounds, efficiency and log-odds information (300 seeds)', () => {
    for (const s of seeds('K', 300)) {
      const P = K.sample(makeRng(s))
      const ans = K.build(P).parts.map((p) => p.answer)
      const { p, n, m } = P
      // Fisher information = E[score^2] with a finite-difference score and exact expectation over {0, 1}
      const logl = (pp: number, xx: number) => (xx ? Math.log(pp) : Math.log(1 - pp))
      const score = (xx: number, pp = p, e = 1e-6) => (logl(pp + e, xx) - logl(pp - e, xx)) / (2 * e)
      const info = p * score(1) ** 2 + (1 - p) * score(0) ** 2
      close(ans[0], info, 1e-4, `${s} information`)
      close(ans[1], 1 / (n * info), 1e-6, `${s} bound for p`)
      // bound for g(p) = p^2 with a finite-difference derivative of g
      const g = (pp: number) => pp * pp
      const dg = (g(p + 1e-6) - g(p - 1e-6)) / 2e-6
      close(ans[2], (dg * dg) / (n * info), 1e-6, `${s} bound for p^2`)
      // efficiency of the mean of the first m observations, from its exact variance under Bin(m, p)
      let c = 1, varM = 0
      for (let j = 0; j <= m; j++) {
        if (j > 0) c = (c * (m - j + 1)) / j
        varM += c * p ** j * (1 - p) ** (m - j) * (j / m - p) ** 2
      }
      close(ans[3], 1 / (n * info) / varM, 1e-9, `${s} efficiency`)
      // information about the log-odds, from the likelihood written in eta: l = x eta - log(1 + e^eta)
      const eta0 = Math.log(p / (1 - p))
      const le = (eta: number, xx: number) => xx * eta - Math.log(1 + Math.exp(eta))
      const se = (xx: number) => (le(eta0 + 1e-6, xx) - le(eta0 - 1e-6, xx)) / 2e-6
      close(ans[4], p * se(1) ** 2 + (1 - p) * se(0) ** 2, 1e-4, `${s} information about the log-odds`)
    }
  })
})

describe('lecture-quiz generator L against independent computation', () => {
  it('plug-in variance, bootstrap SE and bias by full enumeration of resamples, distinct resamples (300 seeds)', () => {
    for (const s of seeds('L', 300)) {
      const P = L.sample(makeRng(s))
      const ans = L.build(P).parts.map((p) => p.answer)
      const { x } = P
      const n = x.length
      const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length
      const plugVar = (v: number[]) => { const m = mean(v); return v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length }
      close(ans[0], plugVar(x), 1e-9, `${s} plug-in variance`)
      // all n^n equally likely ordered resamples
      const total = n ** n
      let sumMean = 0, sumMean2 = 0, sumVar = 0
      const seen = new Set<string>()
      for (let code = 0; code < total; code++) {
        const idx: number[] = []
        for (let c = code, i = 0; i < n; i++, c = Math.floor(c / n)) idx.push(c % n)
        const r = idx.map((i) => x[i])
        const m = mean(r)
        sumMean += m
        sumMean2 += m * m
        sumVar += plugVar(r)
        seen.add([...idx].sort((a, b) => a - b).join(','))
      }
      const eMean = sumMean / total
      close(eMean, mean(x), 1e-9, `${s} bootstrap mean`)
      close(ans[1], Math.sqrt(sumMean2 / total - eMean * eMean), 1e-9, `${s} bootstrap SE`)
      const bias = sumVar / total - plugVar(x)
      close(ans[2], bias, 1e-9, `${s} bootstrap bias`)
      close(ans[3], plugVar(x) - bias, 1e-9, `${s} corrected`)
      expect(ans[4], `${s} distinct resamples`).toBe(seen.size)
    }
  })
})
