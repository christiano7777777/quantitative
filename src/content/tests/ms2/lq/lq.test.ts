// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: lambda as Cov(v,y)/Var(y) in exact fractions; the insider's best response by numerical maximisation; profit and regression slope by Monte Carlo; Glosten-Milgrom by enumerating the joint law of (value, trader type, action) exactly.
//  B: step-by-step exact Bayes updating in any order of the trades; Hawkes intensity by a decay-and-jump recursion, the stationary mean by summing the cluster (branching) series, the compensator by Simpson integration.
//  C: gambler's ruin by solving the absorption linear system exactly; the mid-price move by an exact dynamic programme over (ask, bid) queue sizes; the fill probability by recursion and Monte Carlo of the race of exponentials; Poisson tail by integrating the Erlang density.
//  D: the sinh path from a fine discretisation of the variational problem (tridiagonal solve); TWAP cost by exact summation; the three-interval schedule by nested numerical minimisation of the objective.
//  E: the Riccati equation by Runge-Kutta; for the terminal-penalty problem also by minimising over constant selling rates (a static optimisation) and by integrating the cost along the optimal path.
//  F: reservation prices as indifference prices under exponential utility (numerical integration over the Gaussian price, bisection) and the quote offset by numerically maximising the expected-gain trade-off.
//  G: least-squares fit by normal equations (Cramer) and by minimising the sum of squares numerically; the quotes as in F.
//  H: the displacement by a state recursion (decay then jump); permanent-impact cost in exact fractions; the calibrated rate by reconstructing both measurements.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import type { Rng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { F, solveFr } from '../../../shared/fraction'
import * as A from './a-kyle'
import * as B from './b-sequential'
import * as C from './c-lob'
import * as D from './d-almgren'
import * as E from './e-hjb'
import * as Ff from './f-quotes'
import * as G from './g-calibration'
import * as H from './h-propagator'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const rel = (got: number, want: number, r: number) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(r * Math.abs(want))
const lectures = topics.find((t) => t.id === 'ms2')!.lectures.length
const gauss = (rng: Rng) => Math.sqrt(-2 * Math.log(1 - rng.next())) * Math.cos(2 * Math.PI * rng.next())
const expo = (rng: Rng, rate: number) => -Math.log(1 - rng.next()) / rate
const simpson = (f: (x: number) => number, a: number, b: number, n = 2000) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3 }
function minimise(f: (x: number) => number, lo: number, hi: number): number {
  const g = (Math.sqrt(5) - 1) / 2
  for (let i = 0; i < 200; i++) { const a = hi - g * (hi - lo), b = lo + g * (hi - lo); if (f(a) < f(b)) hi = b; else lo = a }
  return (lo + hi) / 2
}
/** exact fraction from a decimal with at most `places` digits */
const fd = (x: number, places = 3) => F(Math.round(x * 10 ** places), 10 ** places)

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
  it('lambda as Cov/Var, exact price, best response, Glosten-Milgrom by enumeration (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      const beta = F(p.sigU, p.s)
      const cov = beta.mul(F(p.s * p.s)) // Cov(v - p0, x + u) with x = beta (v - p0)
      const varY = beta.mul(beta).mul(F(p.s * p.s)).add(F(p.sigU * p.sigU))
      const lam = cov.div(varY)
      close(ans[0], lam.num, 1e-12)
      const price = F(p.p0).add(lam.mul(beta.mul(F(Math.round(2 * p.d), 2)).add(F(p.u))))
      close(ans[1], price.num, 1e-9)
      // the insider's profit beta' s^2 - lambda beta'^2 s^2 is maximised at the equilibrium beta
      const bStar = minimise((b) => -(b * p.s * p.s - lam.num * b * b * p.s * p.s), 0, 100)
      close(bStar, beta.num, 1e-5)
      // Glosten-Milgrom: enumerate (value, informed?, action)
      const th = F(p.th10, 10), mu = F(p.mu10, 10), half = F(1, 2)
      const joint = (high: boolean, action: 'buy' | 'sell') => {
        const prior = high ? th : F(1).sub(th)
        const informed = (high ? action === 'buy' : action === 'sell') ? mu : F(0)
        return prior.mul(informed.add(F(1).sub(mu).mul(half)))
      }
      const e = (action: 'buy' | 'sell') => {
        const h = joint(true, action), l = joint(false, action)
        return F(p.vl).add(F(p.w).mul(h.div(h.add(l))))
      }
      close(ans[3], e('buy').num, 1e-9)
      close(ans[4], e('sell').num, 1e-9)
    }
  })
  it('profit by a two-dimensional grid over (v - p0, u); regression slope by Monte Carlo (8 seeds)', () => {
    for (const s of seeds('A', 8)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      const beta = p.sigU / p.s
      // trapezoid rule on a fine grid of two independent standard normals (spectrally accurate for Gaussian weights)
      let prof = 0
      const h = 0.1
      for (let i = -80; i <= 80; i++) for (let j = -80; j <= 80; j++) {
        const z1 = i * h, z2 = j * h
        const dv = p.s * z1, u = p.sigU * z2, x = beta * dv
        prof += x * (dv - ans[0] * (x + u)) * Math.exp(-(z1 * z1 + z2 * z2) / 2) * h * h / (2 * Math.PI)
      }
      close(prof, ans[2], 1e-6 * ans[2])
      const rng = makeRng('mcA' + s)
      let sdy = 0, syy = 0
      for (let i = 0; i < 200000; i++) {
        const dv = p.s * gauss(rng), u = p.sigU * gauss(rng)
        sdy += dv * (beta * dv + u); syy += (beta * dv + u) * (beta * dv + u)
      }
      rel(sdy / syy, ans[0], 0.03)
    }
  })
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  it('step-by-step Bayes in any order; Hawkes by recursion, cluster series and integration (300 seeds)', () => {
    for (const s of seeds('B', 300)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      const th = F(p.th10, 10), mu = F(p.mu10, 10), half = F(1, 2)
      const post = (trades: ('B' | 'S')[]) => {
        let pr = th
        for (const t of trades) {
          const likeH = t === 'B' ? mu.add(F(1).sub(mu).mul(half)) : F(1).sub(mu).mul(half)
          const likeL = t === 'S' ? mu.add(F(1).sub(mu).mul(half)) : F(1).sub(mu).mul(half)
          pr = pr.mul(likeH).div(pr.mul(likeH).add(F(1).sub(pr).mul(likeL)))
        }
        return pr
      }
      close(ans[0], post(Array(p.nb1).fill('B')).num, 1e-9)
      const seq: ('B' | 'S')[] = makeRng('o' + s).shuffle([...Array(p.nb).fill('B'), ...Array(p.ns).fill('S')] as ('B' | 'S')[])
      close(ans[1], F(p.vl).add(F(p.w).mul(post(seq))).num, 1e-9)

      const n = p.n10 / 10, alpha = n * p.beta
      const times = [0, p.gaps[0], p.gaps[0] + p.gaps[1]]
      const t = times[2] + p.wait
      // decay-and-jump recursion
      let state = 0, last = 0
      for (const ti of times) { state = state * Math.exp(-p.beta * (ti - last)) + alpha; last = ti }
      close(ans[2], p.base + state * Math.exp(-p.beta * (t - last)), 1e-9)
      // stationary mean = baseline times the expected total cluster size sum n^j
      let cluster = 0, pw = 1
      for (let j = 0; j < 3000; j++) { cluster += pw; pw *= n }
      close(ans[3], p.base * cluster, 1e-9)
      // compensator by piecewise Simpson integration of the intensity
      const breaks = [...times, t]
      let comp = 0
      for (let i = 0; i < breaks.length - 1; i++) {
        const past = times.filter((ti) => ti <= breaks[i])
        comp += simpson((u) => p.base + past.reduce((a, ti) => a + alpha * Math.exp(-p.beta * (u - ti)), 0), breaks[i], breaks[i + 1], 400)
      }
      close(ans[4], comp, 1e-7)
    }
  })
})

// ---------- C ----------
describe('generator C against independent computation', () => {
  it('absorption linear system, exact (ask, bid) dynamic programme, recursion and Erlang integral (300 seeds)', () => {
    for (const s of seeds('C', 300)) {
      const p = C.sample(makeRng(s))
      const ans = answers(C.build(p))
      // gambler's ruin: f(0)=1, f(N)=0, f(i) = p f(i+1) + q f(i-1)
      const N = p.big, pu = F(p.lam, p.lam + p.mu), qd = F(p.mu, p.lam + p.mu)
      const M: ReturnType<typeof F>[][] = [], rhs: ReturnType<typeof F>[] = []
      for (let i = 1; i < N; i++) {
        const row = Array.from({ length: N - 1 }, () => F(0))
        row[i - 1] = F(1)
        if (i + 1 < N) row[i] = F(0).sub(pu)
        if (i - 1 >= 1) row[i - 2] = F(0).sub(qd)
        M.push(row); rhs.push(i === 1 ? qd : F(0)) // the boundary value f(0)=1 moves to the right-hand side
      }
      close(ans[0], solveFr(M, rhs)[p.n - 1].num, 1e-9)
      // DP on queue sizes (a, b)
      const pr = F(p.rb, p.rb + p.rs), pq = F(p.rs, p.rb + p.rs)
      const memo = new Map<string, ReturnType<typeof F>>()
      const f = (a: number, b: number): ReturnType<typeof F> => {
        if (a === 0) return F(1)
        if (b === 0) return F(0)
        const key = a + ',' + b
        if (!memo.has(key)) memo.set(key, pr.mul(f(a - 1, b)).add(pq.mul(f(a, b - 1))))
        return memo.get(key)!
      }
      close(ans[1], f(p.a, p.b).num, 1e-9)
      // fill before the price moves
      const r = F(p.m, p.m + p.nu)
      let fill = F(1)
      for (let j = 0; j < p.k; j++) fill = fill.mul(r)
      close(ans[2], fill.num, 1e-9)
      // Erlang(k, m) cdf by integrating its density
      const erlang = (x: number) => p.m ** p.k * x ** (p.k - 1) * Math.exp(-p.m * x) / [1, 1, 1, 2, 6, 24][p.k]
      close(ans[3], simpson(erlang, 0, p.T, 4000), 1e-7)
      close(ans[4], -p.half * fill.num + (p.half + p.adv) * (1 - fill.num), 1e-9)
    }
  })
  it('the race of exponentials and the expected cost by Monte Carlo (10 seeds)', () => {
    for (const s of seeds('C', 10)) {
      const p = C.sample(makeRng(s))
      const ans = answers(C.build(p))
      const rng = makeRng('mcC' + s)
      const n = 100000
      let filled = 0, cost = 0
      for (let i = 0; i < n; i++) {
        let tFill = 0
        for (let j = 0; j < p.k; j++) tFill += expo(rng, p.m)
        const tMove = expo(rng, p.nu)
        if (tFill < tMove) { filled++; cost -= p.half } else cost += p.half + p.adv
      }
      close(filled / n, ans[2], 0.01)
      close(cost / n, ans[4], 0.04)
    }
  })
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('discretised variational problem, exact TWAP sum, nested minimisation (60 seeds)', () => {
    for (const s of seeds('D', 60)) {
      const p = D.sample(makeRng(s))
      const ans = answers(D.build(p))
      const rho = p.lam * p.sig * p.sig
      // minimise sum eta (dx)^2 / h + rho h sum x^2 on a fine grid: x_i (2 + rho h^2/eta) = x_{i-1} + x_{i+1}
      const Ng = 2000, h = p.T / Ng, c = 2 + (rho * h * h) / p.eta
      const cp = new Array(Ng).fill(0), dp = new Array(Ng).fill(0)
      cp[1] = -1 / c; dp[1] = p.X / c // Thomas algorithm for c x_i - x_{i-1} - x_{i+1} = 0 with x_0 = X, x_Ng = 0
      for (let i = 2; i < Ng; i++) { const den = c + cp[i - 1]; cp[i] = -1 / den; dp[i] = dp[i - 1] / den }
      const x = new Array(Ng + 1).fill(0)
      x[0] = p.X
      for (let i = Ng - 1; i >= 1; i--) x[i] = dp[i] - cp[i] * x[i + 1]
      const mid = Ng / 2
      close(ans[1], x[mid], 1e-4 * x[mid] + 1e-4)
      rel(ans[2], (-3 * x[0] + 4 * x[1] - x[2]) / (-2 * h), 1e-4)
      close(ans[0] ** 2, (x[mid - 1] - 2 * x[mid] + x[mid + 1]) / (h * h) / x[mid], 1e-6)
      let twap = F(0)
      const eta = fd(p.eta, 1), steps = 10
      for (let i = 0; i < steps; i++) twap = twap.add(eta.mul(F(p.X, steps)).mul(F(p.X, steps)).div(F(p.T, steps)))
      close(ans[3], twap.num, 1e-6)
      const tau = p.T / 3
      const J = (x1: number, x2: number) => (p.eta / tau) * ((p.X - x1) ** 2 + (x1 - x2) ** 2 + x2 ** 2) + rho * tau * (x1 * x1 + x2 * x2)
      const best = minimise((x1) => { const x2 = minimise((y) => J(x1, y), 0, p.X); return J(x1, x2) }, 0, p.X)
      close(ans[4], best, 1e-4 * p.X)
    }
  })
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  /** integrate dh/dtau = phi - h^2/k from h(0)=alpha over tau in [0,T] with RK4; returns h on a grid in tau */
  const riccati = (k: number, alpha: number, phi: number, T: number, N: number) => {
    const hs = [alpha], dt = T / N
    const fn = (h: number) => phi - (h * h) / k
    for (let i = 0; i < N; i++) {
      const h = hs[i], k1 = fn(h), k2 = fn(h + (dt * k1) / 2), k3 = fn(h + (dt * k2) / 2), k4 = fn(h + dt * k3)
      hs.push(h + (dt * (k1 + 2 * k2 + 2 * k3 + k4)) / 6)
    }
    return hs
  }
  it('Riccati by Runge-Kutta; constant-rate static optimisation; cost along the optimal path (200 seeds)', () => {
    for (const s of seeds('E', 200)) {
      const p = E.sample(makeRng(s))
      const ans = answers(E.build(p))
      const N = 4000
      const hs = riccati(p.k, p.alpha, 0, p.T, N) // hs[j] = h at tau = j dt, i.e. t = T - tau
      const h0 = hs[N]
      close(ans[0], h0, 1e-8)
      close(ans[1], (h0 * p.q0) / p.k, 1e-6)
      // path under the feedback v = h q / k: q(t) = q0 exp(-int h/k)
      const dt = p.T / N
      const hAt = (i: number) => hs[N - i] // h at t = i dt
      let integral = 0, cost = 0, qMid = 0
      const qs = [p.q0]
      for (let i = 0; i < N; i++) {
        integral += ((hAt(i) + hAt(i + 1)) / 2 / p.k) * dt
        qs.push(p.q0 * Math.exp(-integral))
      }
      qMid = qs[N / 2]
      for (let i = 0; i < N; i++) {
        const v0 = (hAt(i) * qs[i]) / p.k, v1 = (hAt(i + 1) * qs[i + 1]) / p.k
        cost += (p.k * (v0 * v0 + v1 * v1) / 2) * dt
      }
      cost += p.alpha * qs[N] * qs[N]
      close(ans[2], qMid, 1e-5)
      rel(ans[3], cost, 1e-5)
      // static optimisation over constant selling rates (the HJB optimum is constant in time)
      const total = (v: number) => p.k * v * v * p.T + p.alpha * (p.q0 - v * p.T) ** 2
      const vBest = minimise(total, 0, p.q0 * 2)
      close(ans[1], vBest, 1e-5 * (1 + vBest))
      rel(ans[3], total(vBest), 1e-6)
      close(ans[2], p.q0 - (vBest * p.T) / 2, 1e-5)
      expect(ans[3]).toBeLessThanOrEqual((p.k * p.q0 * p.q0) / p.T + 1e-9) // never worse than selling everything at the TWAP rate
      close(ans[4], riccati(p.k, p.alpha, p.phi, p.T, N)[N], 1e-8)
    }
  })
})

// ---------- F and G: quotes from indifference prices under exponential utility ----------
/** ln E exp(-gam (x + q S_T)) for S_T = s + sig sqrt(tau) Z, by Simpson integration over Z */
const logUtility = (x: number, q: number, s: number, sig: number, tau: number, gam: number) => {
  const sd = sig * Math.sqrt(tau)
  const m = simpson((z) => Math.exp(-gam * q * sd * z - (z * z) / 2) / Math.sqrt(2 * Math.PI), -14, 14, 1400)
  return -gam * (x + q * s) + Math.log(m)
}
function bisect(fn: (x: number) => number, lo: number, hi: number, iters = 55): number {
  const sign = Math.sign(fn(lo))
  for (let i = 0; i < iters; i++) { const mid = (lo + hi) / 2; if (Math.sign(fn(mid)) === sign) lo = mid; else hi = mid }
  return (lo + hi) / 2
}
/** indifference ask r^a (sell one unit) and bid r^b (buy one unit) when holding q units */
function indifference(s: number, sig: number, tau: number, gam: number, q: number) {
  const base = logUtility(0, q, s, sig, tau, gam)
  const ra = bisect((r) => logUtility(r, q - 1, s, sig, tau, gam) - base, s - 40, s + 40)
  const rb = bisect((r) => logUtility(-r, q + 1, s, sig, tau, gam) - base, s - 40, s + 40)
  return { ra, rb }
}
/** quote offset beyond the reservation price: maximise exp(-k d)(1 - exp(-gam d)) */
const offset = (gam: number, k: number) => minimise((d) => -Math.exp(-k * d) * (1 - Math.exp(-gam * d)), 0, 60)
function quotes(s: number, sig: number, tau: number, gam: number, k: number, q: number) {
  const { ra, rb } = indifference(s, sig, tau, gam, q)
  const d0 = offset(gam, k)
  return { ask: ra + d0, bid: rb - d0, r: (ra + rb) / 2 }
}

describe('generator F against independent computation', () => {
  it('quotes from indifference prices and the maximised fill trade-off (30 seeds)', () => {
    for (const s of seeds('F', 30)) {
      const p = Ff.sample(makeRng(s))
      const ans = answers(Ff.build(p))
      const qt = quotes(p.s, p.sig, p.tau, p.gam, p.k, p.q)
      close(ans[0], qt.r, 2e-5)
      close(ans[1], qt.ask - qt.bid, 2e-5)
      close(ans[2], qt.bid, 2e-5)
      close(ans[3], p.A * Math.exp(-p.k * (qt.ask - p.s)), 1e-4 * ans[3] + 1e-6)
    }
  })
  it('the inventory giving a chosen skew, by bisection on the indifference reservation price (5 seeds)', () => {
    for (const s of seeds('F', 5)) {
      const p = Ff.sample(makeRng(s))
      const ans = answers(Ff.build(p))
      const reservation = (q: number) => { const { ra, rb } = indifference(p.s, p.sig, p.tau, p.gam, q); return (ra + rb) / 2 }
      const qStar = bisect((q) => p.s - reservation(q) - p.c, 0, 400, 40)
      close(ans[4], qStar, 1e-3)
    }
  })
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  it('normal equations, numerical least squares, quotes from indifference prices (30 seeds)', () => {
    for (const s of seeds('G', 30)) {
      const p = G.sample(makeRng(s))
      const ans = answers(G.build(p))
      const xs = [p.d, 2 * p.d, 3 * p.d], ys = p.rates.map((r) => Math.log(r))
      const n = 3, sx = xs.reduce((a, v) => a + v, 0), sy = ys.reduce((a, v) => a + v, 0)
      const sxx = xs.reduce((a, v) => a + v * v, 0), sxy = xs.reduce((a, v, i) => a + v * ys[i], 0)
      const det = n * sxx - sx * sx
      const intercept = (sy * sxx - sx * sxy) / det, slope = (n * sxy - sx * sy) / det
      close(ans[0], -slope, 1e-9)
      close(ans[1], Math.exp(intercept), 1e-9 * Math.exp(intercept))
      // minimise the sum of squares over k (intercept profiled out)
      const sse = (k: number) => { const a = (sy + k * sx) / n; return xs.reduce((acc, x, i) => acc + (ys[i] - a + k * x) ** 2, 0) }
      close(minimise(sse, 0, 10), ans[0], 1e-5)
      const kHat = ans[0]
      const qt = quotes(p.s, p.sig, p.tau, p.gam, kHat, p.q)
      close(ans[2], (qt.ask - qt.bid) / 2, 2e-5)
      close(ans[3], qt.r, 2e-5)
      close(ans[4], Math.exp(-kHat * ((qt.ask - p.s) - (p.s - qt.bid))), 1e-4 * ans[4] + 1e-6)
    }
  })
})

// ---------- H ----------
describe('generator H against independent computation', () => {
  it('state recursion, exact permanent cost, reconstruction of the calibrated rate (300 seeds)', () => {
    for (const s of seeds('H', 300)) {
      const p = H.sample(makeRng(s))
      const ans = answers(H.build(p))
      // state recursion: decay the displacement, then add the jump g q
      let state = 0, cost = 0
      for (let i = 0; i < 3; i++) {
        if (i > 0) state *= Math.exp(-p.rho * p.gaps[i - 1])
        cost += p.q[i] * (state + (p.g * p.q[i]) / 2)
        state += p.g * p.q[i]
      }
      close(ans[0], state, 1e-9)
      close(ans[1], state * Math.exp(-p.rho * p.w), 1e-9)
      close(ans[2], cost, 1e-9)
      // permanent impact: each trade pays g (q_j earlier + q_i / 2)
      const g = fd(p.g, 1)
      let perm = F(0), cum = F(0)
      for (const qi of p.q) { perm = perm.add(g.mul(F(qi)).mul(cum.add(F(qi, 2)))); cum = cum.add(F(qi)) }
      close(ans[3], perm.num, 1e-9)
      // the calibrated rate reproduces both measurements
      const ia = Math.round(p.i0 * Math.exp(-p.rhoTrue * p.ta) * 1000) / 1000, ib = Math.round(p.i0 * Math.exp(-p.rhoTrue * p.tb) * 1000) / 1000
      close(ia * Math.exp(-ans[4] * (p.tb - p.ta)), ib, 1e-9)
    }
  })
})
