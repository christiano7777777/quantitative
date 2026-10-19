// Tests of the generators used only by lecture quizzes (bay lectures 5 and 4). Every answer is recomputed by a
// different method from the generator's own:
//  I: the Beta prior parameter and posterior means by numerical integration of likelihood times prior; the prior
//     weight from the posterior mean by solving the weighted-average identity.
//  J: posterior mean and sd by integrating the density on a grid; the MAP by ternary search of the log density;
//     the tail probability by integrating the density from c to 1.
import { describe, expect, it } from 'vitest'
import { topics } from '../../../../data'
import { makeRng } from '../../../../lib/rng'
import * as I from './i-prior'
import * as J from './j-summary'

const lectures = topics.find((t) => t.id === 'bay')!.lectures.length
const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const close = (got: number, want: number, tol: number, what = '') => expect(Math.abs(got - want), `${what}: got ${got}, want ${want}`).toBeLessThan(tol)
const simpson = (f: (x: number) => number, a: number, b: number, n = 20000) => {
  const h = (b - a) / n
  let s = f(a) + f(b)
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2)
  return (s * h) / 3
}
/** moments of an unnormalised Beta(a,b) density by integration */
const betaMoments = (a: number, b: number) => {
  const g = (x: number) => (x <= 0 || x >= 1 ? 0 : x ** (a - 1) * (1 - x) ** (b - 1))
  const z = simpson(g, 0, 1)
  const m1 = simpson((x) => x * g(x), 0, 1) / z
  const m2 = simpson((x) => x * x * g(x), 0, 1) / z
  return { z, mean: m1, sd: Math.sqrt(m2 - m1 * m1), g }
}

const gens = [
  ['I', (s: string) => I.build(I.sample(makeRng(s))), 5],
  ['J', (s: string) => J.build(J.sample(makeRng(s))), 4],
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

describe('lecture-quiz generator I against independent computation', () => {
  it('Beta prior parameter, posterior means, prior weight, sensitivity (300 seeds)', () => {
    let weightChecked = 0
    for (const s of seeds('I', 300)) {
      const P = I.sample(makeRng(s))
      const ans = I.build(P).parts.map((p) => p.answer)
      const a = ans[0], b = P.s - a
      // the prior Beta(a,b) has mean p0 (by integration) and a+b = s
      // a can be below 1 (density singular at 0), where Simpson is only accurate to about 1e-3
      close(betaMoments(a, b).mean, P.p0, 2e-3, `${s} prior mean`)
      const informative = betaMoments(a + P.k, b + P.n - P.k).mean
      close(ans[1], informative, 1e-5, `${s} informative posterior mean`)
      const jeffreys = betaMoments(P.k + 0.5, P.n - P.k + 0.5).mean
      close(ans[3], jeffreys, 1e-5, `${s} Jeffreys posterior mean`)
      close(ans[4], informative - jeffreys, 2e-5, `${s} difference`)
      // posterior mean = w * p0 + (1-w) * k/n, solved for w from the integrated posterior mean
      const phat = P.k / P.n
      if (Math.abs(P.p0 - phat) > 0.03) {
        close(ans[2], (informative - phat) / (P.p0 - phat), 1e-4, `${s} weight`)
        weightChecked++
      }
    }
    expect(weightChecked).toBeGreaterThan(200)
  })
})

describe('lecture-quiz generator J against independent computation', () => {
  it('posterior mean, MAP, sd, normal-approximation interval, tail probability (300 seeds)', () => {
    for (const s of seeds('J', 300)) {
      const P = J.sample(makeRng(s))
      const ans = J.build(P).parts.map((p) => p.answer)
      const a = P.k + 1, b = P.n - P.k + 1
      const mom = betaMoments(a, b)
      close(ans[0], mom.mean, 1e-6, `${s} mean`)
      close(ans[2], mom.sd, 1e-6, `${s} sd`)
      close(ans[3], mom.mean + 1.96 * mom.sd, 1e-5, `${s} interval end`)
      // MAP: ternary search of the log density on (0,1)
      let lo = 1e-9, hi = 1 - 1e-9
      const lf = (x: number) => (a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x)
      for (let i = 0; i < 200; i++) {
        const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3
        if (lf(m1) < lf(m2)) lo = m1
        else hi = m2
      }
      close(ans[1], (lo + hi) / 2, 1e-6, `${s} MAP`)
      // P(theta > c) = integral of the density from c to 1
      close(ans[4], simpson(mom.g, P.c, 1) / mom.z, 1e-6, `${s} tail probability`)
    }
  })
})
