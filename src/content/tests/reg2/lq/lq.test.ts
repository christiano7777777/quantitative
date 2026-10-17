// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: odds route to probabilities, Monte Carlo (Gumbel-max for the multinomial, a latent logistic variable for the ordinal model).
//  B: factorial-based log-pmf for the deviance, exact fractions for the dispersion, Monte Carlo for Poisson and gamma-mixed counts.
//  D: exact linear solve of the ridge normal equations, hat-matrix trace, and a perturbation check that the solution minimises the criterion.
//  E: numerical minimisation of the penalised one-dimensional problems; the one-SE rule by scanning down from the largest lambda.
//  F: explicit piecewise polynomials with exact fractions; the leave-one-out residual by actually refitting without the point.
//  G: exact sums of squares, Monte Carlo of the ANOVA estimators and of the shrinkage regression slope.
//  H: IRLS iterated to convergence agrees with numerical minimisation of the Huber loss; the loss as an integral of its derivative.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { F, Fr, solveFr } from '../../../shared/fraction'
import * as A from './a-logistic'
import * as B from './b-poisson'
import * as D from './d-ridge'
import * as E from './e-lasso'
import * as Fs from './f-spline'
import * as G from './g-mixed'
import * as H from './h-huber'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const rel = (got: number, want: number, r: number) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(r * Math.abs(want))
const lectures = topics.find((t) => t.id === 'reg2')!.lectures.length
const dec1 = (v: number) => F(Math.round(v * 1000), 1000)

const gens: [string, LQGenerator, number][] = [
  ['A', { id: 'A', generate: (r) => A.build(A.sample(r)) }, 5],
  ['B', { id: 'B', generate: (r) => B.build(B.sample(r)) }, 5],
  ['D', { id: 'D', generate: (r) => D.build(D.sample(r)) }, 5],
  ['E', { id: 'E', generate: (r) => E.build(E.sample(r)) }, 5],
  ['F', { id: 'F', generate: (r) => Fs.build(Fs.sample(r)) }, 5],
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

/** Golden-section minimiser of a convex function. */
function minimise(f: (x: number) => number, lo: number, hi: number): number {
  const g = (Math.sqrt(5) - 1) / 2
  for (let i = 0; i < 300; i++) {
    const a = hi - g * (hi - lo), b = lo + g * (hi - lo)
    if (f(a) < f(b)) hi = b; else lo = a
  }
  return (lo + hi) / 2
}

// ---------- A ----------
describe('generator A against independent computation', () => {
  it('probabilities by the odds route, Wald z, softmax by log-sum-exp (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      close(ans[0], Math.exp(p.b1), 1e-12)
      const odds = Math.exp(p.b0 + p.b1 * p.x1 + p.b2 * p.x2)
      close(ans[1], odds / (1 + odds), 1e-12)
      close(ans[2], p.b1 / p.se1, 1e-12)
      const sc = [p.a1 + p.c1 * p.xm, p.a2 + p.c2 * p.xm, 0]
      const mx = Math.max(...sc)
      const lse = mx + Math.log(sc.reduce((a, v) => a + Math.exp(v - mx), 0))
      close(ans[3], Math.exp(sc[0] - lse), 1e-12)
      // ordinal: P(Y=2) = P(Y<=2) - P(Y<=1), each via the odds route
      const c = (t: number) => { const o = Math.exp(t); return o / (1 + o) }
      close(ans[4], c(p.al2 - p.be * p.xo) - c(p.al1 - p.be * p.xo), 1e-12)
    }
  })
  it('Monte Carlo: Gumbel-max sampling of the multinomial logit, latent logistic variable for the ordinal model (6 seeds)', () => {
    for (const s of seeds('A', 6)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      const rng = makeRng('sim' + s)
      const runs = 300000
      let k1 = 0, y2 = 0
      const gum = () => -Math.log(-Math.log(rng.next() || 1e-12))
      for (let r = 0; r < runs; r++) {
        const s1 = p.a1 + p.c1 * p.xm + gum(), s2 = p.a2 + p.c2 * p.xm + gum(), s3 = gum()
        if (s1 > s2 && s1 > s3) k1++
        const u = rng.next() || 1e-12
        const eps = Math.log(u / (1 - u))
        if (eps > p.al1 - p.be * p.xo && eps <= p.al2 - p.be * p.xo) y2++
      }
      close(ans[3], k1 / runs, 0.006)
      close(ans[4], y2 / runs, 0.006)
    }
  }, 60000)
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  it('log-pmf deviance, exact Pearson dispersion, repeated multiplication for the rate ratio (300 seeds)', () => {
    const lf = (k: number) => { let r = 0; for (let i = 2; i <= k; i++) r += Math.log(i); return r }
    for (const s of seeds('B', 300)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      const mu = p.t * Math.exp(p.b0) * Math.exp(p.b1) ** p.x
      close(ans[0], mu, 1e-9)
      let ratio = 1
      for (let i = 0; i < p.dx; i++) ratio *= Math.exp(p.b1)
      close(ans[1], ratio, 1e-12)
      const lpmf = (y: number, m: number) => y * Math.log(m) - m - lf(y)
      close(ans[2], 2 * (lpmf(p.y, p.y) - lpmf(p.y, mu)), 1e-9)
      let sum = F(0)
      for (const o of p.obs) { const m = F(Math.round(o.mu * 10), 10); const d = F(o.y).sub(m); sum = sum.add(d.mul(d).div(m)) }
      close(ans[3], sum.div(F(3)).num, 1e-9)
      close(ans[4], mu + (mu * mu) / p.k, 1e-9)
    }
  })
  it('Monte Carlo: Poisson variance and gamma-mixed (negative binomial) variance (4 seeds)', () => {
    for (const s of seeds('B', 4)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      const rng = makeRng('sim' + s)
      const mu = ans[0]
      const runs = 150000
      const pois = (m: number) => { let t = 0, n = 0; for (;;) { t += -Math.log(1 - rng.next()) / m; if (t > 1) return n; n++ } }
      let a1 = 0, a2 = 0, b1 = 0, b2 = 0
      for (let r = 0; r < runs; r++) {
        const y = pois(mu); a1 += y; a2 += y * y
        let g = 0
        for (let i = 0; i < p.k; i++) g += -Math.log(1 - rng.next()) // Gamma(k, 1)
        const z = pois((mu / p.k) * g) // Poisson with a gamma rate of mean mu: NB with variance mu + mu^2/k
        b1 += z; b2 += z * z
      }
      rel(a2 / runs - (a1 / runs) ** 2, ans[0], 0.04)
      rel(b2 / runs - (b1 / runs) ** 2, ans[4], 0.06)
    }
  }, 60000)
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('exact normal equations, hat-matrix trace and optimality by perturbation (300 seeds)', () => {
    for (const s of seeds('D', 300)) {
      const p = D.sample(makeRng(s))
      const ans = answers(D.build(p))
      const X = D.U.map((u, i) => [p.a * u, p.b * D.V[i]])
      const y = p.y
      const gram = (lam: number) => [0, 1].map((r) => [0, 1].map((c) => F(X.reduce((a, row) => a + row[r] * row[c], 0) + (r === c ? lam : 0))))
      const xty = [0, 1].map((j) => F(X.reduce((a, row, i) => a + row[j] * y[i], 0)))
      const ols = solveFr(gram(0), xty)
      const rid = solveFr(gram(p.lam), xty)
      close(ans[0], ols[0].num, 1e-12)
      close(ans[1], rid[0].num, 1e-12)
      close(ans[2], rid[1].num, 1e-12)
      // trace of the hat matrix X (X'X + lam I)^-1 X' = sum_i x_i' (X'X+lam I)^-1 x_i
      let tr = F(0)
      for (const row of X) {
        const sol = solveFr(gram(p.lam), [F(row[0]), F(row[1])])
        tr = tr.add(sol[0].mul(F(row[0])).add(sol[1].mul(F(row[1]))))
      }
      close(ans[3], tr.num, 1e-12)
      const rss = (b: number[]) => X.reduce((a, row, i) => a + (y[i] - row[0] * b[0] - row[1] * b[1]) ** 2, 0)
      close(ans[4], rss([rid[0].num, rid[1].num]), 1e-9)
      // the ridge solution minimises RSS + lam |b|^2: perturbing it in any coordinate direction increases the criterion
      const crit = (b: number[]) => rss(b) + p.lam * (b[0] * b[0] + b[1] * b[1])
      const b0 = [rid[0].num, rid[1].num]
      for (const d of [[1e-3, 0], [-1e-3, 0], [0, 1e-3], [0, -1e-3]]) expect(crit([b0[0] + d[0], b0[1] + d[1]])).toBeGreaterThan(crit(b0))
    }
  })
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  it('penalised one-dimensional problems solved by numerical minimisation (300 seeds)', () => {
    for (const s of seeds('E', 300)) {
      const p = E.sample(makeRng(s))
      const ans = answers(E.build(p))
      close(ans[0], minimise((v) => 0.5 * (p.b - v) ** 2 + p.lam * Math.abs(v), -10, 10), 1e-6)
      expect(ans[1]).toBe(p.coefs.reduce((a, c) => a + (Math.abs(c) > p.thr ? 1 : 0), 0))
      close(ans[2], minimise((v) => 0.5 * (p.b - v) ** 2 + p.enLam * (p.alpha * Math.abs(v) + ((1 - p.alpha) / 2) * v * v), -10, 10), 1e-6)
      const n = p.xj.length
      close(ans[3], minimise((v) => p.xj.reduce((a, x, i) => a + (p.res[i] - x * v) ** 2, 0) / (2 * n) + p.cdLam * Math.abs(v), -20, 20), 1e-6)
      // one-SE rule: scan from the largest lambda downwards and stop at the first acceptable one
      const order = p.grid.map((g, i) => i).sort((a, b) => p.grid[b] - p.grid[a])
      const best = Math.min(...p.cv)
      const j = p.cv.indexOf(best)
      let chosen = -1
      for (const i of order) if (p.cv[i] <= best + p.se[j] + 1e-12) { chosen = i; break }
      close(ans[4], p.grid[chosen], 1e-12)
    }
  })
})

// ---------- F ----------
describe('generator F against independent computation', () => {
  it('explicit pieces in exact fractions, jump of the third derivative, leave-one-out by refitting (300 seeds)', () => {
    for (const s of seeds('F', 300)) {
      const p = Fs.sample(makeRng(s))
      const ans = answers(Fs.build(p))
      const [b0, b1, b2, b3, b4, b5] = p.beta
      const x = F(Math.round(p.x * 2), 2)
      const cube = (v: Fr) => v.mul(v).mul(v)
      const xi1 = F(p.xi1), xi2 = F(p.xi2)
      close(ans[0], x.cmp(xi1) > 0 ? cube(x.sub(xi1)).num : 0, 1e-12)
      // piece polynomial coefficients (c0..c3) on each of the three intervals, from expanding (x - xi)^3
      const cubicCoef = (xi: number, w: number) => [-w * xi ** 3, 3 * w * xi ** 2, -3 * w * xi, w]
      const base = [b0, b1, b2, b3]
      const piece = (k: number) => base.map((c, d) => c + (k >= 1 ? cubicCoef(p.xi1, b4)[d] : 0) + (k >= 2 ? cubicCoef(p.xi2, b5)[d] : 0))
      const k = x.cmp(xi1) <= 0 ? 0 : x.cmp(xi2) <= 0 ? 1 : 2
      const pc = piece(k)
      close(ans[1], pc[0] + pc[1] * x.num + pc[2] * x.num ** 2 + pc[3] * x.num ** 3, 1e-9)
      // third derivative of each piece is 6 * (cubic coefficient); continuity of f'' at the knot holds on both sides
      close(ans[2], 6 * piece(2)[3] - 6 * piece(1)[3], 1e-12)
      const kn = p.xi2
      const second = (pcs: number[], v: number) => 2 * pcs[2] + 6 * pcs[3] * v
      close(second(piece(1), kn), second(piece(2), kn), 1e-9)
      close(ans[3], p.gamma.reduce((a, g) => a + 1 / (1 + p.lam * g), 0), 1e-12)
      // leave-one-out: refit the straight line without observation i and predict it
      const xs = [1, 2, 3, 4, 5, 6].filter((v) => v !== p.i)
      const ys = p.ys.filter((_, idx) => idx + 1 !== p.i)
      const mx = F(xs.reduce((a, v) => a + v, 0), xs.length), my = F(ys.reduce((a, v) => a + v, 0), ys.length)
      let sxx = F(0), sxy = F(0)
      xs.forEach((v, idx) => { sxx = sxx.add(F(v).sub(mx).mul(F(v).sub(mx))); sxy = sxy.add(F(v).sub(mx).mul(F(ys[idx]).sub(my))) })
      const pred = my.add(sxy.div(sxx).mul(F(p.i).sub(mx)))
      close(ans[4], F(p.ys[p.i - 1]).sub(pred).num, 1e-9)
    }
  })
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  it('exact sums of squares and the derived quantities (300 seeds)', () => {
    for (const s of seeds('G', 300)) {
      const { data } = G.sample(makeRng(s))
      const ans = answers(G.build({ data }))
      const m = data.length, r = data[0].length
      const all = data.flat()
      const total = all.reduce((a, v) => a.add(F(v)), F(0))
      const gm = total.div(F(m * r))
      const sst = all.reduce((a, v) => a.add(F(v).sub(gm).mul(F(v).sub(gm))), F(0))
      const ssb = data.reduce((a, row) => { const cm = F(row.reduce((q, v) => q + v, 0), r); return a.add(cm.sub(gm).mul(cm.sub(gm)).mul(F(r))) }, F(0))
      const msw = sst.sub(ssb).div(F(m * (r - 1)))
      const msb = ssb.div(F(m - 1))
      close(ans[0], msw.num, 1e-9)
      close(ans[1], msb.num, 1e-9)
      const su = msb.sub(msw).div(F(r))
      close(ans[2], su.num, 1e-9)
      close(ans[3], su.div(su.add(msw)).num, 1e-9)
      const cm1 = F(data[0].reduce((q, v) => q + v, 0), r)
      close(ans[4], su.div(su.add(msw.div(F(r)))).mul(cm1.sub(gm)).num, 1e-9)
    }
  })
  it('Monte Carlo: the ANOVA estimators are unbiased and the shrinkage factor is the regression slope of u on the cluster-mean deviation', () => {
    const rng = makeRng('mixed-sim')
    const gauss = () => Math.sqrt(-2 * Math.log(1 - rng.next())) * Math.cos(2 * Math.PI * rng.next())
    const m = 4, r = 3, su2 = 4, s2 = 2
    const runs = 60000
    let sw = 0, sbu = 0, suu = 0, suy = 0, syy = 0
    for (let t = 0; t < runs; t++) {
      const u = Array.from({ length: m }, () => Math.sqrt(su2) * gauss())
      const data = u.map((ui) => Array.from({ length: r }, () => 10 + ui + Math.sqrt(s2) * gauss()))
      const st = G.stats(data)
      sw += st.msw
      sbu += (st.msb - st.msw) / r
      const dev = st.means[0] - st.grand
      suy += u[0] * dev; syy += dev * dev; suu += u[0]
    }
    rel(sw / runs, s2, 0.03)
    rel(sbu / runs, su2, 0.04)
    rel(suy / syy, su2 / (su2 + s2 / r), 0.04)
  }, 60000)
})

// ---------- H ----------
describe('generator H against independent computation', () => {
  it('median and MAD by an alternative selection, weights and one step recomputed, loss as an integral of its derivative (300 seeds)', () => {
    for (const s of seeds('H', 300)) {
      const p = H.sample(makeRng(s))
      const ans = answers(H.build(p))
      const { data, k } = p
      const sorted = [...data].sort((a, b) => a - b)
      const med = sorted[3]
      close(ans[0], med, 1e-12)
      const absdev = data.map((v) => Math.abs(v - med)).sort((a, b) => a - b)
      const mad = absdev[3]
      close(ans[1], mad / 0.6745, 1e-12)
      const sc = mad / 0.6745
      const far = Math.max(...data.map((v) => Math.abs(v - med)))
      close(ans[2], Math.min(1, (k * sc) / far), 1e-12)
      let num = 0, den = 0
      for (const v of data) { const a = Math.abs(v - med) / sc; const w = a <= k ? 1 : k / a; num += w * v; den += w }
      close(ans[3], num / den, 1e-12)
      // rho(r) is the integral of psi(t) = clip(t, -k, k) from 0 to |r|
      const rOut = far / sc
      const n = 20000
      let integral = 0
      for (let i = 0; i < n; i++) { const t = ((i + 0.5) * rOut) / n; integral += Math.min(t, k) * (rOut / n) }
      close(ans[4], integral, 1e-5)
    }
  })
  it('iterating the reweighting converges to the minimiser of the Huber loss (so the weight formula is right) (50 seeds)', () => {
    for (const s of seeds('H', 50)) {
      const { data, k } = H.sample(makeRng(s))
      const sorted = [...data].sort((a, b) => a - b)
      const med = sorted[3]
      const mad = data.map((v) => Math.abs(v - med)).sort((a, b) => a - b)[3]
      const sc = mad / 0.6745
      let m = med
      for (let it = 0; it < 500; it++) {
        let num = 0, den = 0
        for (const v of data) { const a = Math.abs(v - m) / sc; const w = a <= k ? 1 : k / a; num += w * v; den += w }
        m = num / den
      }
      const best = minimise((v) => data.reduce((a, x) => a + H.huberRho((x - v) / sc, k), 0), 0, 60)
      close(m, best, 1e-5)
    }
  })
})
