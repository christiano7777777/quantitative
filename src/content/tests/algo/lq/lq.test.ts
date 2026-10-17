// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: IR via a variance decomposition; momentum via log returns; the z-score via sums of squares; carry via the forward-price identity.
//  B: the hedge ratio by OLS on constructed data; the half-life by simulating the decay of a deviation; the profit by marking the two legs.
//  C: leg returns by sorting; the rank correlation as a Pearson correlation of ranks.
//  D: survivorship bias by re-summing; net return by simulating period-by-period costs; the impact by a squared identity.
//  E: Sharpe through sums of squares; drawdown by exhaustive pairs; Calmar and turnover by direct arithmetic.
//  F: the Sharpe/t-statistic identity, Bonferroni via the union bound, window count by explicit sliding.
//  G: Kelly by numerical maximisation of the growth rate; vol targeting by realised-vol after scaling.
//  H: schedules by summing slices; VaR from the normal quantile scaled linearly; the buffer by the equity needed to reach the limit.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import * as A from './a-signals'
import * as B from './b-pairs'
import * as C from './c-crosssection'
import * as D from './d-costs'
import * as E from './e-performance'
import * as Ff from './f-overfit'
import * as G from './g-sizing'
import * as H from './h-execution'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const lectures = topics.find((t) => t.id === 'algo')!.lectures.length

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

// ---------- A ----------
describe('generator A against independent computation', () => {
  it('IR identity, log-return momentum, sums-of-squares z-score, forward-price carry (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      close(ans[0] ** 2, p.ic ** 2 * p.br, 1e-9)
      close(Math.exp(Math.log(p.p1) - Math.log(p.p12)) - 1, ans[1], 1e-9)
      const n = p.sig.length
      const sx = p.sig.reduce((t, v) => t + v, 0), sxx = p.sig.reduce((t, v) => t + v * v, 0)
      close(ans[2], (p.sig[0] - sx / n) / Math.sqrt((sxx - (sx * sx) / n) / (n - 1)), 1e-9)
      close(ans[3] * p.sd + p.ma, p.price, 1e-9)
      // buying the future at F and delivering against spot S earns (S-F)/S over the period, annualised by 365/days
      const periodReturn = (p.spot - p.fut) / p.spot
      close(ans[4], periodReturn * (365 / p.days), 1e-9)
    }
  })
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  it('OLS on constructed data; the half-life by decay of a deviation; marking the legs (300 seeds)', () => {
    for (const s of seeds('B', 300)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      // Construct x data with the given variance and y = beta x so the regression slope is cov/var; check OLS slope on data with exact cov/var
      const beta = p.cov / p.varx
      const xs = [-1, 1, -1, 1].map((v) => v * Math.sqrt(p.varx * 3 / 4)) // sample variance (divisor n-1=3) equals varx
      const ys = xs.map((v) => beta * v)
      const mx = 0, my = 0
      const slope = xs.reduce((t, v, i) => t + (v - mx) * (ys[i] - my), 0) / xs.reduce((t, v) => t + (v - mx) ** 2, 0)
      close(ans[0], slope, 1e-9)
      close(ans[1], p.y - slope * p.x, 1e-9)
      close(ans[2], (p.y - slope * p.x - p.mu) / p.sd, 1e-9)
      let dev = 1, days = 0
      while (dev * p.phi > 0.5) { dev *= p.phi; days++ } // whole days until the deviation is about to fall below one half
      expect(ans[3]).toBeGreaterThan(days - 1e-9)
      expect(ans[3]).toBeLessThan(days + 1 + 1e-9)
      // marking the legs: short n of Y, long n*beta of X, relative to the mean spread
      const entry = -p.n * p.y + p.n * beta * p.x
      const exit = -p.n * (beta * p.x + p.mu) + p.n * beta * p.x
      close(ans[4], exit - entry, 1e-6)
    }
  })
})

// ---------- C ----------
describe('generator C against independent computation', () => {
  it('leg returns by sorting; Spearman as a Pearson correlation of ranks (300 seeds)', () => {
    for (const s of seeds('C', 300)) {
      const p = C.sample(makeRng(s))
      const ans = answers(C.build(p))
      const order = p.ranks.map((r, i) => [r, p.rets[i]]).sort((a, b) => b[0] - a[0])
      close(ans[0], (order[0][1] + order[1][1]) / 2, 1e-12)
      close(ans[1], (order[4][1] + order[5][1]) / 2, 1e-12)
      close(ans[2], ans[0] - ans[1], 1e-12)
      close(ans[3], 0.5 * ans[0] - 0.5 * ans[1], 1e-12)
      const sorted = [...p.rets].sort((a, b) => a - b)
      const rr = p.rets.map((v) => sorted.indexOf(v) + 1)
      const mean = 3.5
      const num = p.ranks.reduce((t, r, i) => t + (r - mean) * (rr[i] - mean), 0)
      const den = Math.sqrt(p.ranks.reduce((t, r) => t + (r - mean) ** 2, 0) * rr.reduce((t, r) => t + (r - mean) ** 2, 0))
      close(ans[4], num / den, 1e-9)
    }
  })
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('survivorship bias by re-summing; costs period by period; impact by a squared identity (300 seeds)', () => {
    for (const s of seeds('D', 300)) {
      const p = D.sample(makeRng(s))
      const ans = answers(D.build(p))
      let sum = 0
      for (const v of p.surv) sum += v
      close(ans[0], sum / 8, 1e-12)
      close(ans[1], (sum + p.dead[0] + p.dead[1]) / 10, 1e-12)
      close(ans[2], ans[0] - ans[1], 1e-12)
      expect(ans[2]).toBeGreaterThan(0)
      let net = p.gross
      for (let i = 0; i < p.turnover; i++) net -= p.cost / 100 // each unit of turnover costs cost bp = cost/100 percent
      close(ans[3], net, 1e-9)
      close((ans[4] / (p.y * p.sigma)) ** 2, p.part / 100, 1e-9)
    }
  })
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  it('Sharpe through sums of squares; drawdown by exhaustive pairs (300 seeds)', () => {
    for (const s of seeds('E', 300)) {
      const p = E.sample(makeRng(s))
      const ans = answers(E.build(p))
      const n = p.r.length
      const sx = p.r.reduce((t, v) => t + v, 0), sxx = p.r.reduce((t, v) => t + v * v, 0)
      const sd = Math.sqrt((sxx - (sx * sx) / n) / (n - 1))
      close(ans[0], (sx / n / sd) * Math.sqrt(12), 1e-9)
      const eq = [1]
      p.r.forEach((v, i) => eq.push(eq[i] * (1 + v / 100)))
      close(ans[1], eq[n] - 1, 1e-9)
      let worst = 0
      for (let i = 0; i <= n; i++) for (let j = i; j <= n; j++) worst = Math.max(worst, 1 - eq[j] / eq[i])
      close(ans[2], worst, 1e-12)
      expect(worst).toBeGreaterThan(0)
      close(ans[3], ((sx / n) * 12) / 100 / worst, 1e-9)
      const buys = p.w1.map((v, i) => Math.max(0, v - p.w0[i])).reduce((t, v) => t + v, 0) / 100
      close(ans[4], buys, 1e-12) // weights sum to 100, so total buys equal total sells equal one-way turnover
    }
  })
})

// ---------- F ----------
describe('generator F against independent computation', () => {
  it('t-statistic from the monthly figures; Bonferroni via the union bound; windows by explicit sliding (300 seeds)', () => {
    for (const s of seeds('F', 300)) {
      const p = Ff.sample(makeRng(s))
      const ans = answers(Ff.build(p))
      close(ans[0], p.mean / p.sd * Math.sqrt(12), 1e-12)
      // t-statistic of the mean of 12*years monthly observations: mean / (sd / sqrt(n))
      close(ans[1], p.mean / (p.sd / Math.sqrt(12 * p.years)), 1e-9)
      // union bound: N p >= 1-(1-p)^N, and the adjusted value never exceeds 1
      expect(ans[2]).toBeGreaterThanOrEqual(Math.min(1, 1 - (1 - p.p) ** p.trials) - 1e-12)
      expect(ans[2]).toBeLessThanOrEqual(1)
      close(ans[2], Math.min(1, p.p * p.trials), 1e-12)
      let windows = 0
      for (let start = 0; start + p.train + p.test <= p.total; start += p.step) windows++
      close(ans[3], windows, 1e-12)
      close(ans[4] * Math.sqrt(p.years), 2, 1e-9)
    }
  })
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  it('Kelly by numerical maximisation of the log growth; vol targeting by scaling (300 seeds)', () => {
    for (const s of seeds('G', 300)) {
      const p = G.sample(makeRng(s))
      const ans = answers(G.build(p))
      close(p.real * ans[0], p.target, 1e-12)
      close(ans[1], ans[0] * p.capital, 1e-6)
      // continuous Kelly: maximise mu f - sigma^2 f^2 / 2 on a grid
      let best = 0, arg = 0
      for (let f = 0; f <= 20; f += 0.001) { const g = p.mu * f - 0.5 * p.sigma * p.sigma * f * f; if (g > best) { best = g; arg = f } }
      close(ans[2], arg, 1.5e-3)
      const q = 1 - p.pw
      const growth = (f: number) => p.pw * Math.log(1 + p.b * f) + q * Math.log(1 - f)
      let bf = 0, bg = -Infinity
      for (let f = 0; f < 1; f += 0.0001) { const g = growth(f); if (g > bg) { bg = g; bf = f } }
      close(ans[3], bf, 2e-4)
      close(ans[4], bg, 1e-6)
    }
  })
})

// ---------- H ----------
describe('generator H against independent computation', () => {
  it('slices sum to the order; VaR scales linearly; the buffer by equity at the limit (300 seeds)', () => {
    for (const s of seeds('H', 300)) {
      const p = H.sample(makeRng(s))
      const ans = answers(H.build(p))
      close(ans[0] * p.slices, p.Q, 1e-9)
      close(p.profile.reduce((t, v) => t + v, 0), 1, 1e-12)
      close(ans[1], p.Q * p.profile[p.bucket], 1e-9)
      // POV: each minute trades rate*vol shares; count whole minutes plus the remaining fraction
      let left = p.Q, minutes = 0
      while (left > p.rate * p.vol) { left -= p.rate * p.vol; minutes++ }
      close(ans[2], minutes + left / (p.rate * p.vol), 1e-9)
      close(ans[3], 2.326 * p.sigma * p.pos, 1e-6)
      const eqAtLimit = p.peak * (1 - p.limit)
      close(ans[4], (p.eq - eqAtLimit) / p.peak, 1e-12)
    }
  })
})
