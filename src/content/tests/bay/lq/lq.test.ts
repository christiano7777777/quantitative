// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: posteriors by exact enumeration in fractions; the Beta posterior mean by numerical integration of likelihood times prior.
//  B: normal-normal and gamma-Poisson posteriors by numerical integration on a grid; the Beta means exactly.
//  C: the uniform-prior marginal likelihood by integration; WAIC from log-sum-exp style direct arithmetic.
//  D: Monte Carlo of the importance sampling identity and of inverse transform sampling; ESS through the coefficient of variation of the weights.
//  E: acceptance probabilities recomputed; the discrete sampler's transition matrix leaves the target invariant and satisfies detailed balance.
//  F: Gibbs conditionals by regression in simulated bivariate normals; the AR(1) effective size by simulation.
//  G: Laplace curvature by finite differences at the numerically found mode; the ELBO by numerical integration over q; the optimal variance by maximising the ELBO.
//  H: the Chinese restaurant process and stick-breaking by simulation; the Gaussian process posterior by conditioning in simulated draws.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import type { Rng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { F } from '../../../shared/fraction'
import * as A from './a-bayes'
import * as B from './b-posterior'
import * as C from './c-evidence'
import * as D from './d-montecarlo'
import * as E from './e-mh'
import * as Ff from './f-gibbs'
import * as G from './g-approx'
import * as H from './h-nonparam'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const rel = (got: number, want: number, r: number) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(r * Math.abs(want))
const lectures = topics.find((t) => t.id === 'bay')!.lectures.length
const gauss = (rng: Rng) => Math.sqrt(-2 * Math.log(1 - rng.next())) * Math.cos(2 * Math.PI * rng.next())
const simpson = (f: (x: number) => number, a: number, b: number, n = 6000) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3 }

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
  it('exact enumeration; the Beta posterior mean by integration of likelihood times prior (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      const tot = p.prior.reduce((a, v) => a + v, 0)
      const th = [F(2, 10), F(5, 10), F(8, 10)]
      const pw = (x: ReturnType<typeof F>, e: number) => { let r = F(1); for (let i = 0; i < e; i++) r = r.mul(x); return r }
      const lik = th.map((t) => F(A.choose(p.n, p.k)).mul(pw(t, p.k)).mul(pw(F(1).sub(t), p.n - p.k)))
      const joint = lik.map((l, i) => l.mul(F(p.prior[i], tot)))
      const ev = joint.reduce((a, v) => a.add(v), F(0))
      close(ans[0], joint[1].div(ev).num, 1e-12)
      close(ans[1], ev.num, 1e-12)
      close(ans[2], joint.reduce((a, v, i) => a.add(v.mul(th[i])), F(0)).div(ev).num, 1e-12)
      // Beta posterior mean by integrating theta * prior * likelihood over (0,1)
      const dens = (t: number) => t ** (p.a - 1) * (1 - t) ** (p.b - 1) * t ** p.k * (1 - t) ** (p.n - p.k)
      const z = simpson(dens, 0, 1, 20000)
      const m = simpson((t) => t * dens(t), 0, 1, 20000) / z
      close(ans[3], m, 1e-8)
      close(ans[4], p.n / (p.a + p.b + p.n), 1e-12)
      close(ans[4] * (p.k / p.n) + (1 - ans[4]) * (p.a / (p.a + p.b)), ans[3], 1e-12)
    }
  })
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  it('posteriors by numerical integration on a grid (300 seeds)', () => {
    for (const s of seeds('B', 300)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      // normal-normal: integrate prior x likelihood of the sample mean
      const dens = (t: number) => Math.exp(-0.5 * (t - p.mu0) ** 2 / p.tau ** 2 - 0.5 * p.n * (p.ybar - t) ** 2 / p.sigma ** 2)
      const lo = p.mu0 - 12 * p.tau, hi = p.mu0 + 12 * p.tau
      const z = simpson(dens, lo, hi)
      const m = simpson((t) => t * dens(t), lo, hi) / z
      const v = simpson((t) => (t - m) ** 2 * dens(t), lo, hi) / z
      close(ans[0], m, 1e-6)
      close(ans[1], Math.sqrt(v), 1e-6)
      close(ans[2], m - 1.96 * Math.sqrt(v), 1e-6)
      // gamma-Poisson: prior lambda^(a-1) e^(-b lambda), likelihood lambda^S e^(-m lambda)
      const g = (t: number) => t ** (p.ga + p.S - 1) * Math.exp(-(p.gb + p.m) * t)
      const top = 4 * (p.ga + p.S) / (p.gb + p.m) + 20
      const zg = simpson(g, 1e-12, top, 20000)
      close(ans[3], simpson((t) => t * g(t), 1e-12, top, 20000) / zg, 1e-6)
      close(ans[4], F(p.kb + 1, p.nb + 2).sub(F(2 * p.kb + 1, 2 * p.nb + 2)).num, 1e-12)
    }
  })
})

// ---------- C ----------
describe('generator C against independent computation', () => {
  it('marginal likelihood under the uniform prior by integration; WAIC by direct arithmetic (300 seeds)', () => {
    for (const s of seeds('C', 300)) {
      const p = C.sample(makeRng(s))
      const ans = answers(C.build(p))
      close(ans[0], C.choose(p.n, p.k) / 2 ** p.n, 1e-12)
      const m2 = simpson((t) => C.choose(p.n, p.k) * t ** p.k * (1 - t) ** (p.n - p.k), 0, 1, 20000)
      close(m2, 1 / (p.n + 1), 1e-9)
      close(ans[1], ans[0] / m2, 1e-6)
      close(ans[2], ans[1] / (1 + ans[1]), 1e-12)
      let lppd = 0, pw = 0
      for (const row of p.L) {
        const pr = row.map((v) => v / 100)
        lppd += Math.log(pr.reduce((a, v) => a + v, 0) / 4)
        const ll = pr.map(Math.log)
        const mean = ll.reduce((a, v) => a + v, 0) / 4
        pw += ll.reduce((a, v) => a + v * v, 0) / 3 - (4 / 3) * mean * mean
      }
      close(ans[3], lppd, 1e-9)
      close(ans[4], -2 * (lppd - pw), 1e-9)
    }
  })
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('formulas recomputed; ESS through the coefficient of variation (300 seeds)', () => {
    for (const s of seeds('D', 300)) {
      const p = D.sample(makeRng(s))
      const ans = answers(D.build(p))
      close(ans[0], p.sd / Math.sqrt(p.n), 1e-12)
      let n = 1
      while (1.96 * p.sd / Math.sqrt(n) > p.eps) n++
      expect(ans[1]).toBe(n)
      close(ans[2], -Math.log(p.u) / p.lam, 1e-12)
      // exponential cdf at the generated value returns 1 - u
      close(1 - Math.exp(-p.lam * ans[2]), 1 - p.u, 1e-12)
      const w = p.p.map((v, i) => v / p.q[i])
      const mean = w.reduce((a, v) => a + v, 0) / 4
      const cv2 = w.reduce((a, v) => a + (v - mean) ** 2, 0) / 4 / (mean * mean)
      close(ans[4], 4 / (1 + cv2), 1e-9)
      const num = w.reduce((a, v, i) => a + v * p.f[i], 0), den = w.reduce((a, v) => a + v, 0)
      close(ans[3], num / den, 1e-12)
    }
  })
  it('Monte Carlo: importance sampling a N(0,1) second moment with a N(0,4) proposal, and inverse transform draws', () => {
    const rng = makeRng('is')
    let tot = 0, wsum = 0
    const N = 400000
    for (let i = 0; i < N; i++) {
      const x = 2 * gauss(rng)
      const w = Math.exp(-x * x / 2) / Math.exp(-x * x / 8) // unnormalised p/q
      tot += w * x * x; wsum += w
    }
    close(tot / wsum, 1, 0.02) // self-normalised estimate of E x^2 under N(0,1)
    let s = 0
    for (let i = 0; i < N; i++) s += -Math.log(1 - rng.next()) / 2
    close(s / N, 0.5, 0.005) // exponential with rate 2 has mean 1/2
  }, 60000)
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  it('acceptance probabilities; the discrete transition matrix leaves the target invariant (300 seeds)', () => {
    for (const s of seeds('E', 300)) {
      const p = E.sample(makeRng(s))
      const ans = answers(E.build(p))
      const logr1 = -(p.xp ** 2 - p.x ** 2) / 2
      close(ans[0], Math.min(1, Math.exp(logr1)), 1e-12)
      const lk = (t: number) => 2 * Math.log(t) - t
      close(ans[1], Math.min(1, Math.exp(lk(p.gxp) - lk(p.gx))), 1e-12)
      const logr3 = -(p.xp ** 2) / 2 + (p.x ** 2) / 2 + (p.xp ** 2) / 8 - (p.x ** 2) / 8
      close(ans[2], Math.min(1, Math.exp(logr3)), 1e-12)
      const tot = p.pi.reduce((a, b) => a + b, 0), pr = p.pi.map((v) => v / tot)
      const P = [0, 1, 2].map((i) => [0, 1, 2].map((j) => (i === j ? 0 : 0.5 * Math.min(1, pr[j] / pr[i]))))
      for (let i = 0; i < 3; i++) P[i][i] = 1 - P[i].reduce((a, b) => a + b, 0)
      close(ans[3], P[0][1], 1e-12)
      close(ans[4], P[0][0], 1e-12)
      for (let j = 0; j < 3; j++) close(pr.reduce((a, v, i) => a + v * P[i][j], 0), pr[j], 1e-12)
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) close(pr[i] * P[i][j], pr[j] * P[j][i], 1e-12)
    }
  })
})

// ---------- F ----------
describe('generator F against independent computation', () => {
  it('formulas recomputed (300 seeds)', () => {
    for (const s of seeds('F', 300)) {
      const p = Ff.sample(makeRng(s))
      const ans = answers(Ff.build(p))
      close(ans[0], p.rho * p.y, 1e-12)
      close(ans[1], 1 - p.rho ** 2, 1e-12)
      close(ans[2], (p.n * (1 - p.ac)) / (1 + p.ac), 1e-9)
      const B = p.n * p.Bn
      const varPlus = ((p.n - 1) / p.n) * p.W + B / p.n
      close(ans[3], Math.sqrt(varPlus / p.W), 1e-12)
      close(ans[4], p.sd / Math.sqrt(ans[2]), 1e-12)
    }
  })
  it('Monte Carlo: bivariate normal full conditionals and the AR(1) effective sample size', () => {
    const rng = makeRng('gibbs')
    const rho = 0.7
    // regression of x on y in simulated pairs has slope rho and residual variance 1 - rho^2
    let sxy = 0, syy = 0, res: number[] = []
    const xs: number[] = [], ys: number[] = []
    for (let i = 0; i < 200000; i++) { const y = gauss(rng); const x = rho * y + Math.sqrt(1 - rho * rho) * gauss(rng); xs.push(x); ys.push(y); sxy += x * y; syy += y * y }
    const slope = sxy / syy
    close(slope, rho, 0.01)
    res = xs.map((x, i) => x - slope * ys[i])
    close(res.reduce((a, v) => a + v * v, 0) / res.length, 1 - rho * rho, 0.01)
    // AR(1) chain: variance of the mean times n over the marginal variance equals 1 + 2 sum rho^k = (1+rho)/(1-rho)
    const ac = 0.7, n = 400, reps = 4000
    let vm = 0
    for (let r = 0; r < reps; r++) {
      let x = gauss(rng), sum = x
      for (let t = 1; t < n; t++) { x = ac * x + Math.sqrt(1 - ac * ac) * gauss(rng); sum += x }
      vm += (sum / n) ** 2
    }
    rel(n * (vm / reps), (1 + ac) / (1 - ac), 0.12)
    close(answers(Ff.build({ rho, y: 1, n, ac, W: 1, Bn: 0.1, m: 4, sd: 1 }))[2], n / ((1 + ac) / (1 - ac)), 1e-9)
  }, 60000)
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  it('Laplace by finite differences at the numerical mode; ELBO by integration over q; optimal variance by maximisation (300 seeds)', () => {
    const minimise = (f: (x: number) => number, lo: number, hi: number) => { const g = (Math.sqrt(5) - 1) / 2; for (let i = 0; i < 300; i++) { const a = hi - g * (hi - lo), b = lo + g * (hi - lo); if (f(a) < f(b)) hi = b; else lo = a } return (lo + hi) / 2 }
    for (const s of seeds('G', 300)) {
      const p = G.sample(makeRng(s))
      const ans = answers(G.build(p))
      const lp = (t: number) => (p.a - 1) * Math.log(t) + (p.b - 1) * Math.log(1 - t)
      const mode = minimise((t) => -lp(t), 1e-6, 1 - 1e-6)
      close(ans[0], mode, 1e-6)
      const h = 1e-4
      const curv = -(lp(mode + h) - 2 * lp(mode) + lp(mode - h)) / (h * h)
      close(ans[1], 1 / curv, 2e-6)
      close(ans[2], (p.a * p.b) / ((p.a + p.b) ** 2 * (p.a + p.b + 1)), 1e-12)
      // ELBO by integrating log p(y, theta) + entropy against q
      const sq = Math.sqrt(p.s2)
      const logJoint = (t: number) => -0.5 * Math.log(2 * Math.PI * p.sigma ** 2) - (p.y - t) ** 2 / (2 * p.sigma ** 2) - 0.5 * Math.log(2 * Math.PI * p.tau ** 2) - t * t / (2 * p.tau ** 2)
      const q = (t: number) => Math.exp(-((t - p.m) ** 2) / (2 * p.s2)) / Math.sqrt(2 * Math.PI * p.s2)
      const elbo = simpson((t) => q(t) * (logJoint(t) - Math.log(q(t))), p.m - 12 * sq, p.m + 12 * sq, 8000)
      close(ans[3], elbo, 1e-6)
      // the ELBO is maximised in s^2 at (1/sigma^2 + 1/tau^2)^-1 (for any m)
      const el = (s2: number) => -0.5 * Math.log(2 * Math.PI * p.sigma ** 2) - ((p.y - p.m) ** 2 + s2) / (2 * p.sigma ** 2) - 0.5 * Math.log(2 * Math.PI * p.tau ** 2) - (p.m ** 2 + s2) / (2 * p.tau ** 2) + 0.5 * Math.log(2 * Math.PI * Math.E * s2)
      close(ans[4], minimise((s2) => -el(s2), 1e-6, 20), 1e-6)
    }
  })
})

// ---------- H ----------
describe('generator H against independent computation', () => {
  it('formulas recomputed (300 seeds)', () => {
    for (const s of seeds('H', 300)) {
      const p = H.sample(makeRng(s))
      const ans = answers(H.build(p))
      const n = p.sizes.reduce((a, b) => a + b, 0)
      close(ans[0], p.alpha / (n + p.alpha), 1e-12)
      close(ans[1], p.sizes[0] / (n + p.alpha), 1e-12)
      let t = 0
      for (let i = 0; i < n; i++) t += p.alpha / (p.alpha + i)
      close(ans[2], t, 1e-12)
      close(ans[3], (p.alpha / (1 + p.alpha)) ** (p.j - 1) / (1 + p.alpha), 1e-12)
      // GP: posterior mean by conditioning a bivariate normal (f(x*), y)
      const kxx = p.sf ** 2, kxs = p.sf ** 2 * Math.exp(-(p.d ** 2) / (2 * p.ell ** 2))
      close(ans[4], (kxs / (kxx + p.sn ** 2)) * p.yobs, 1e-12)
    }
  })
  it('Monte Carlo: expected tables of the restaurant process, expected stick weight, and the Gaussian process conditional slope', () => {
    const rng = makeRng('dp')
    const alpha = 2, n = 15, reps = 40000
    let tables = 0
    for (let r = 0; r < reps; r++) {
      const sizes: number[] = []
      for (let i = 0; i < n; i++) {
        const u = rng.next() * (i + alpha)
        let acc = 0, placed = false
        for (let k = 0; k < sizes.length; k++) { acc += sizes[k]; if (u < acc) { sizes[k]++; placed = true; break } }
        if (!placed) sizes.push(1)
      }
      tables += sizes.length
    }
    const ans = answers(H.build({ alpha, sizes: [5, 5, 5], j: 3, ell: 1, sf: 1, sn: 0.5, yobs: 1, d: 1 }))
    rel(tables / reps, ans[2], 0.01)
    // stick-breaking with Beta(1, alpha) fractions: beta = 1 - U^(1/alpha)
    let w3 = 0
    const R = 400000
    const beta = () => 1 - Math.pow(rng.next(), 1 / alpha)
    for (let r = 0; r < R; r++) { const b1 = beta(), b2 = beta(), b3 = beta(); w3 += b3 * (1 - b1) * (1 - b2) }
    rel(w3 / R, ans[3], 0.02)
    // GP conditional: regress f(x*) on y in simulated jointly normal pairs; the slope is k(x*,0)/(k(0,0)+sn^2)
    const sf = 1, ell = 1, sn = 0.5, d = 1
    const kxx = sf * sf, kxs = sf * sf * Math.exp(-(d * d) / (2 * ell * ell))
    let sfy = 0, syy = 0
    for (let r = 0; r < 300000; r++) {
      const z1 = gauss(rng), z2 = gauss(rng)
      const f0 = Math.sqrt(kxx) * z1
      const fs = (kxs / Math.sqrt(kxx)) * z1 + Math.sqrt(kxx - (kxs * kxs) / kxx) * z2
      const y = f0 + sn * gauss(rng)
      sfy += fs * y; syy += y * y
    }
    close(sfy / syy, kxs / (kxx + sn * sn), 0.01)
  }, 120000)
})
