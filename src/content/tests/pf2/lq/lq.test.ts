// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: exact fractions for the factor formulas; the t statistic from a two-pass variance.
//  B: exact normal equations; a perturbation check that the least squares fit minimises RSS; R squared as explained over total.
//  C: state-by-state price decomposition with exact fractions, the identity E[R]-Rf = -Rf Cov(M,R).
//  D: Monte Carlo of the one-factor model; the minimum variance weight by numerical minimisation.
//  E: posterior by numerical integration of prior times view likelihood.
//  F: the equal risk contribution weight found by bisection on the risk contributions; volatilities from the covariance matrix.
//  G: exact fractions; the decay checked by repeated halving.
//  H: exact fractions; the effects add to the active return.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { F, solveFr } from '../../../shared/fraction'
import * as A from './a-factors'
import * as B from './b-timeseries'
import * as C from './c-sdf'
import * as D from './d-covariance'
import * as E from './e-bl'
import * as Fr from './f-riskparity'
import * as G from './g-costs'
import * as H from './h-brinson'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const rel = (got: number, want: number, r: number) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(r * Math.abs(want))
const lectures = topics.find((t) => t.id === 'pf2')!.lectures.length
const gauss = (rng: ReturnType<typeof makeRng>) => Math.sqrt(-2 * Math.log(1 - rng.next())) * Math.cos(2 * Math.PI * rng.next())

const gens: [string, LQGenerator, number][] = [
  ['A', { id: 'A', generate: (r) => A.build(A.sample(r)) }, 5],
  ['B', { id: 'B', generate: (r) => B.build(B.sample(r)) }, 5],
  ['C', { id: 'C', generate: (r) => C.build(C.sample(r)) }, 5],
  ['D', { id: 'D', generate: (r) => D.build(D.sample(r)) }, 5],
  ['E', { id: 'E', generate: (r) => E.build(E.sample(r)) }, 5],
  ['F', { id: 'F', generate: (r) => Fr.build(Fr.sample(r)) }, 5],
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

function minimise(f: (x: number) => number, lo: number, hi: number): number {
  const g = (Math.sqrt(5) - 1) / 2
  for (let i = 0; i < 300; i++) { const a = hi - g * (hi - lo), b = lo + g * (hi - lo); if (f(a) < f(b)) hi = b; else lo = a }
  return (lo + hi) / 2
}
const simpson = (f: (x: number) => number, a: number, b: number, n = 6000) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3 }

// ---------- A ----------
describe('generator A against independent computation', () => {
  it('exact factor formulas and a two-pass t statistic (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      let exp = F(p.rf, 10)
      p.beta.forEach((b, k) => { exp = exp.add(F(Math.round(b * 10), 10).mul(F(p.lam[k], 10))) })
      close(ans[0], exp.num, 1e-9)
      const [sl, sm, sh, bl, bm, bh] = p.port.map((v) => F(v, 10))
      close(ans[1], sl.add(sm).add(sh).sub(bl).sub(bm).sub(bh).div(F(3)).num, 1e-9)
      close(ans[2], sh.add(bh).sub(sl).sub(bl).div(F(2)).num, 1e-9)
      const m = p.slopes.reduce((a, v) => a.add(F(v, 10)), F(0)).div(F(6))
      close(ans[3], m.num, 1e-9)
      let ss = F(0)
      for (const v of p.slopes) { const d = F(v, 10).sub(m); ss = ss.add(d.mul(d)) }
      const sd = Math.sqrt(ss.div(F(5)).num)
      close(ans[4], m.num / (sd / Math.sqrt(6)), 1e-9)
    }
  })
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  it('normal equations in exact fractions, R squared as explained over total, perturbation optimality (300 seeds)', () => {
    for (const s of seeds('B', 300)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      const n = 6
      const f = p.f.map((v) => F(v, 10)), r = p.r.map((v) => F(v, 10))
      const sf = f.reduce((a, v) => a.add(v), F(0)), sr = r.reduce((a, v) => a.add(v), F(0))
      const sff = f.reduce((a, v) => a.add(v.mul(v)), F(0)), sfr = f.reduce((a, v, i) => a.add(v.mul(r[i])), F(0))
      const sol = solveFr([[F(n), sf], [sf, sff]], [sr, sfr])
      const [al, be] = [sol[0], sol[1]]
      close(ans[0], be.num, 1e-9)
      close(ans[1], al.num, 1e-9)
      const fit = f.map((v) => al.add(be.mul(v)))
      const rss = r.reduce((a, v, i) => a.add(v.sub(fit[i]).mul(v.sub(fit[i]))), F(0))
      const mr = sr.div(F(n))
      const ess = fit.reduce((a, v) => a.add(v.sub(mr).mul(v.sub(mr))), F(0))
      close(ans[2], ess.div(ess.add(rss)).num, 1e-9)
      close(ans[3], rss.div(F(4)).num, 1e-9)
      const mf = sf.div(F(n))
      const sxx = f.reduce((a, v) => a.add(v.sub(mf).mul(v.sub(mf))), F(0))
      const se = Math.sqrt(rss.div(F(4)).num * (1 / n + (mf.num * mf.num) / sxx.num))
      close(ans[4], al.num / se, 1e-9)
      const crit = (a: number, b: number) => p.r.reduce((q, v, i) => q + (v / 10 - a - b * p.f[i] / 10) ** 2, 0)
      for (const [da, db] of [[1e-3, 0], [-1e-3, 0], [0, 1e-3], [0, -1e-3]]) expect(crit(al.num + da, be.num + db)).toBeGreaterThan(crit(al.num, be.num))
    }
  })
})

// ---------- C ----------
describe('generator C against independent computation', () => {
  it('state prices, expected return and the covariance identity (300 seeds)', () => {
    for (const s of seeds('C', 300)) {
      const p = C.sample(makeRng(s))
      const ans = answers(C.build(p))
      const pr = p.p.map((v) => F(v, 10)), m = p.m.map((v) => F(v, 100)), x = p.x.map((v) => F(v, 100))
      const em = pr.reduce((a, v, i) => a.add(v.mul(m[i])), F(0))
      close(ans[0], F(1).div(em).num, 1e-9)
      const price = pr.reduce((a, v, i) => a.add(v.mul(m[i]).mul(x[i])), F(0))
      close(ans[1], price.num, 1e-9)
      const ex = pr.reduce((a, v, i) => a.add(v.mul(x[i])), F(0))
      close(ans[2], ex.div(price).num, 1e-9)
      const rf = 1 / em.num
      close(ans[3], ex.div(price).num - rf, 1e-9)
      // identity E[R] - Rf = -Rf Cov(M, R) (the covariance answer must reproduce the premium)
      close(-rf * ans[4], ans[3], 5e-4)
      // cross-check of the covariance by the definition E[(M - EM)(R - ER)]
      const R = x.map((v) => v.div(price).num), er = ex.div(price).num
      const cov = pr.reduce((a, v, i) => a + v.num * (m[i].num - em.num) * (R[i] - er), 0)
      close(ans[4], cov, 1e-9)
    }
  })
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('variance, covariance, correlation by Monte Carlo of the factor model; minimum variance weight by minimisation (6 seeds)', () => {
    for (const s of seeds('D', 6)) {
      const p = D.sample(makeRng(s))
      const ans = answers(D.build(p))
      const rng = makeRng('sim' + s)
      const N = 400000
      let s11 = 0, s22 = 0, s12 = 0
      for (let t = 0; t < N; t++) {
        const f = p.sf * gauss(rng)
        const r1 = p.b1 * f + p.e1 * gauss(rng), r2 = p.b2 * f + p.e2 * gauss(rng)
        s11 += r1 * r1; s22 += r2 * r2; s12 += r1 * r2
      }
      rel(s11 / N, ans[0], 0.02)
      rel(s12 / N, ans[1], 0.03)
      rel(s12 / N / Math.sqrt((s11 / N) * (s22 / N)), ans[2], 0.03)
      const v1 = p.b1 ** 2 * p.sf ** 2 + p.e1 ** 2, v2 = p.b2 ** 2 * p.sf ** 2 + p.e2 ** 2, c = p.b1 * p.b2 * p.sf ** 2
      close(ans[4], minimise((w) => w * w * v1 + (1 - w) ** 2 * v2 + 2 * w * (1 - w) * c, -3, 3), 1e-6)
    }
  })
  it('exact formulas for the shrunk covariance (300 seeds)', () => {
    for (const s of seeds('D', 300)) {
      const p = D.sample(makeRng(s))
      const ans = answers(D.build(p))
      const d = F(Math.round(p.delta * 10), 10), c = F(Math.round(p.b1 * 10) * Math.round(p.b2 * 10) * p.sf * p.sf, 100)
      close(ans[3], F(1).sub(d).mul(F(p.s12)).add(d.mul(c)).num, 1e-9)
      close(ans[1], c.num, 1e-9) // the covariance exactly (the Monte Carlo test above only checks it to 3%)
    }
  })
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  it('posterior by numerical integration of prior times view likelihood (300 seeds)', () => {
    for (const s of seeds('E', 300)) {
      const p = E.sample(makeRng(s))
      const ans = answers(E.build(p))
      const pi = p.delta * (p.s11 * p.w1 + p.s12 * (1 - p.w1))
      close(ans[0], pi, 1e-12)
      const pv = p.tau * p.s11
      const post = (mu: number) => Math.exp(-0.5 * (mu - pi) ** 2 / pv - 0.5 * (p.q - mu) ** 2 / p.omega)
      const lo = pi - 12 * Math.sqrt(pv), hi = pi + 12 * Math.sqrt(pv)
      const z = simpson(post, lo, hi)
      const m = simpson((u) => u * post(u), lo, hi) / z
      const v = simpson((u) => (u - m) ** 2 * post(u), lo, hi) / z
      close(ans[2], m, 1e-7)
      close(ans[3], v, 1e-7)
      close(ans[1], v / p.omega, 1e-5) // the weight on the view is the posterior variance times the view precision
      close(ans[4], m / (p.delta * p.s11), 1e-7)
    }
  })
})

// ---------- F ----------
describe('generator F against independent computation', () => {
  it('ERC by bisection on equal risk contributions, volatilities from the covariance matrix (300 seeds)', () => {
    for (const s of seeds('F', 300)) {
      const p = Fr.sample(makeRng(s))
      const ans = answers(Fr.build(p))
      const cov = [[p.s1 ** 2, p.rho * p.s1 * p.s2], [p.rho * p.s1 * p.s2, p.s2 ** 2]]
      const rc = (w: number) => { const ww = [w, 1 - w]; const sw = [cov[0][0] * ww[0] + cov[0][1] * ww[1], cov[1][0] * ww[0] + cov[1][1] * ww[1]]; return [ww[0] * sw[0], ww[1] * sw[1]] }
      let lo = 0.001, hi = 0.999
      for (let it = 0; it < 200; it++) { const mid = (lo + hi) / 2; const r = rc(mid); if (r[0] > r[1]) hi = mid; else lo = mid }
      const w1 = (lo + hi) / 2
      close(ans[0], w1, 1e-9)
      const vol = (w: number) => { const r = rc(w); return Math.sqrt(r[0] + r[1]) }
      close(ans[1], vol(w1), 1e-9)
      const r6 = rc(0.6)
      close(ans[2], r6[0] / (r6[0] + r6[1]), 1e-12)
      close(ans[3], vol(0.5), 1e-12)
      close(ans[4], p.target / vol(w1), 1e-9)
    }
  })
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  it('exact turnover, cost, net return, break-even and repeated halving (300 seeds)', () => {
    for (const s of seeds('G', 300)) {
      const p = G.sample(makeRng(s))
      const ans = answers(G.build(p))
      expect(p.oldW.reduce((a, b) => a + b, 0)).toBe(100)
      expect(p.newW.reduce((a, b) => a + b, 0)).toBe(100)
      const turn = p.newW.reduce((a, w, i) => a.add(F(Math.abs(w - p.oldW[i]), 100)), F(0))
      close(ans[0], turn.num, 1e-12)
      const cost = F(p.cost).mul(turn).div(F(100))
      close(ans[1], cost.num, 1e-12)
      close(ans[2], F(Math.round(p.gross * 10), 10).sub(cost).num, 1e-12)
      close(ans[3], F(Math.round(p.gross * 10), 10).div(turn).mul(F(100)).num, 1e-9)
      // repeated halving of the alpha over whole half-lives, plus the fractional remainder
      let a = p.alpha0
      const whole = Math.floor(p.years / p.half)
      for (let i = 0; i < whole; i++) a /= 2
      a *= 0.5 ** ((p.years - whole * p.half) / p.half)
      close(ans[4], a, 1e-9)
    }
  })
})

// ---------- H ----------
describe('generator H against independent computation', () => {
  it('exact Brinson effects, and that they add up to the active return (300 seeds)', () => {
    for (const s of seeds('H', 300)) {
      const p = H.sample(makeRng(s))
      const ans = answers(H.build(p))
      expect(p.wp.reduce((a, b) => a + b, 0)).toBe(100)
      expect(p.wb.reduce((a, b) => a + b, 0)).toBe(100)
      const rb = p.wb.reduce((a, w, i) => a.add(F(w * p.rb[i], 1000)), F(0))
      const rp = p.wp.reduce((a, w, i) => a.add(F(w * p.rp[i], 1000)), F(0))
      const alloc = (i: number) => F(p.wp[i] - p.wb[i], 100).mul(F(p.rb[i], 10).sub(rb))
      close(ans[0], alloc(0).num, 1e-9)
      close(ans[1], F(p.wb[1], 100).mul(F(p.rp[1] - p.rb[1], 10)).num, 1e-9)
      let inter = F(0), allocT = F(0), selT = F(0)
      for (let i = 0; i < 3; i++) { inter = inter.add(F(p.wp[i] - p.wb[i], 100).mul(F(p.rp[i] - p.rb[i], 10))); allocT = allocT.add(alloc(i)); selT = selT.add(F(p.wb[i], 100).mul(F(p.rp[i] - p.rb[i], 10))) }
      close(ans[2], inter.num, 1e-9)
      close(ans[3], rp.sub(rb).num, 1e-9)
      close(ans[4], allocT.num, 1e-9)
      close(allocT.add(selT).add(inter).num, rp.sub(rb).num, 1e-9)
    }
  })
})
