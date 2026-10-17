// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: minimal sample sizes by searching for the smallest m that meets the inequality; the Hoeffding bound against the exact binomial tail; interval labellings by brute-force enumeration.
//  B: the failure probability in exact rational arithmetic; sample sizes by search; Cover's count by sweeping the direction of the separating line over all critical angles.
//  C: Rademacher complexity from the exact binomial formula; the margin by projecting each point onto the hyperplane; the AdaBoost weight by minimising the normaliser numerically.
//  D: the SVM norm by testing feasibility of the constraints; the maximal margin by a numerical search over directions; the AdaBoost bound from numerically minimised normalisers.
//  E: E|S_m| from the closed binomial identity; the sup over the ball by a grid over directions; margin error by sorting; boosting rounds by search.
//  F: the Perceptron in its dual (kernel) form; the regret bound by plugging in the tuned rate; the least-squares excess risk by Monte Carlo.
//  G: Hedge by a shifted softmax; ridge minimisers by numerical minimisation; SGD in exact rationals; bias-variance by averaging squared errors directly.
//  H: the mistake bound in exact rationals and by running the Perceptron in random orders; rounds and sample sizes by search; the minimum-norm interpolator by gradient descent from zero.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import type { Rng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { F, Fr } from '../../../shared/fraction'
import * as A from './a-finite'
import * as B from './b-pac'
import * as C from './c-complexity'
import * as D from './d-bounds'
import * as E from './e-exact'
import * as Ff from './f-online'
import * as G from './g-learning'
import * as H from './h-rates'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const lectures = topics.find((t) => t.id === 'lt')!.lectures.length
const gauss = (rng: Rng) => Math.sqrt(-2 * Math.log(1 - rng.next())) * Math.cos(2 * Math.PI * rng.next())

const gens: [string, LQGenerator, number, number[]][] = [
  ['A', { id: 'A', generate: (r) => A.build(A.sample(r)) }, 5, [1, 2, 3]],
  ['B', { id: 'B', generate: (r) => B.build(B.sample(r)) }, 5, [1, 2, 3]],
  ['C', { id: 'C', generate: (r) => C.build(C.sample(r)) }, 5, [4, 5, 6]],
  ['D', { id: 'D', generate: (r) => D.build(D.sample(r)) }, 5, [4, 5, 6]],
  ['E', { id: 'E', generate: (r) => E.build(E.sample(r)) }, 5, [4, 5, 6]],
  ['F', { id: 'F', generate: (r) => Ff.build(Ff.sample(r)) }, 5, [7, 8, 9, 10]],
  ['G', { id: 'G', generate: (r) => G.build(G.sample(r)) }, 5, [7, 8, 9, 10]],
  ['H', { id: 'H', generate: (r) => H.build(H.sample(r)) }, 5, [7, 8, 9, 10]],
]

describe.each(gens)('generator %s: generic rules', (name, gen, nParts, slotLectures) => {
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
  it('touches every lecture of its slot', () => {
    const seen = new Set(gen.generate(makeRng('lec')).parts.map((p) => p.lecture))
    expect([...seen].sort((a, b) => a - b)).toEqual(slotLectures)
  })
})

it('the LQ bank touches all lectures', () => {
  const seen = new Set<number>()
  for (const [name, gen] of gens) for (const s of seeds(name, 20)) gen.generate(makeRng(s)).parts.forEach((p) => seen.add(p.lecture))
  expect([...seen].sort((a, b) => a - b)).toEqual(Array.from({ length: lectures }, (_, i) => i + 1))
})

// exact binomial helpers
const choose = (n: number, k: number): bigint => { let r = 1n; for (let i = 1; i <= k; i++) r = (r * BigInt(n - k + i)) / BigInt(i); return r }
/** E|S_k| for a sum of k fair signs, from the binomial distribution */
const absSum = (k: number) => { let t = 0n; for (let j = 0; j <= k; j++) t += choose(k, j) * BigInt(Math.abs(2 * j - k)); return Number(t) / 2 ** k }
const ratio = (x: Fr) => Number((x.n * 10n ** 15n) / x.d) / 1e15
const ceilFr = (x: Fr) => { const q = x.n / x.d; return Number(x.n % x.d === 0n ? q : q + 1n) }
const golden = (f: (x: number) => number, lo: number, hi: number, it = 200) => {
  // minimise a unimodal f
  const g = (Math.sqrt(5) - 1) / 2
  for (let i = 0; i < it; i++) { const a = hi - g * (hi - lo), b = lo + g * (hi - lo); if (f(a) < f(b)) hi = b; else lo = a }
  return (lo + hi) / 2
}

// ---------- A ----------
describe('generator A against independent computation', () => {
  it('minimal sample sizes by search, Hoeffding against the exact tail, interval labellings by enumeration (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      const Hn = 2 ** p.k
      // 1: smallest m with |H| exp(-eps m) <= delta
      expect(Hn * Math.exp(-p.eps * ans[0])).toBeLessThanOrEqual(p.delta)
      expect(Hn * Math.exp(-p.eps * (ans[0] - 1))).toBeGreaterThan(p.delta)
      // 2: smallest m with 2|H| exp(-2 m (eps/2)^2) <= delta
      expect(2 * Hn * Math.exp(-2 * ans[1] * (p.eps / 2) ** 2)).toBeLessThanOrEqual(p.delta)
      expect(2 * Hn * Math.exp(-2 * (ans[1] - 1) * (p.eps / 2) ** 2)).toBeGreaterThan(p.delta)
      // 3: invert the bound; it must dominate the exact two-sided tail for fair coin losses
      close(Math.sqrt(Math.log(2 / ans[2]) / (2 * p.m1)), p.t, 1e-9)
      const lf = [0]; for (let i = 1; i <= p.m1; i++) lf.push(lf[i - 1] + Math.log(i))
      let tail = 0
      for (let j = 0; j <= p.m1; j++) if (Math.abs(j / p.m1 - 0.5) > p.t) tail += Math.exp(lf[p.m1] - lf[j] - lf[p.m1 - j] - p.m1 * Math.LN2)
      expect(tail).toBeLessThanOrEqual(ans[2])
      // 4: solving 2|H| exp(-2 m g^2) = delta for delta
      close(2 * Hn * Math.exp(-2 * p.m2 * ans[3] ** 2), p.delta, 1e-9)
      // 5: enumerate all intervals on the integer points 1..pts using half-integer endpoints
      const labels = new Set<string>()
      labels.add('0'.repeat(p.pts))
      for (let a = 0; a <= p.pts; a++) for (let b = a; b <= p.pts; b++) labels.add(Array.from({ length: p.pts }, (_, i) => (i + 1 > a && i + 1 <= b ? '1' : '0')).join(''))
      expect(ans[4]).toBe(labels.size)
    }
  })
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  it('exact failure probability, inversions, minimal m, Cover count by an angular sweep (300 seeds)', () => {
    for (const s of seeds('B', 300)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      // 1: exact rational arithmetic
      let x = F(p.N)
      const base = F(100 - p.epsPct, 100)
      for (let i = 0; i < p.m1; i++) x = x.mul(base)
      close(ans[0], ratio(x), 1e-12)
      // 2: plugging the promised accuracy back in recovers delta
      close(p.N * Math.exp(-ans[1] * p.m2), p.delta, 1e-9)
      // 3: smallest m with 2N exp(-2 m t^2) <= delta
      expect(2 * p.N * Math.exp(-2 * ans[2] * p.t * p.t)).toBeLessThanOrEqual(p.delta)
      expect(2 * p.N * Math.exp(-2 * (ans[2] - 1) * p.t * p.t)).toBeGreaterThan(p.delta)
      // 4: half of the answer is the uniform gap
      close(2 * p.N * Math.exp(-2 * p.m3 * (ans[3] / 2) ** 2), p.delta, 1e-9)
      // 5: sweep the normal direction around the circle through all tie angles; threshold between consecutive projections
      const rng = makeRng('pts' + s)
      const pts = Array.from({ length: p.pts }, () => [rng.next() * 10, rng.next() * 10])
      const crit: number[] = []
      for (let i = 0; i < p.pts; i++) for (let j = i + 1; j < p.pts; j++) {
        const th = Math.atan2(pts[i][0] - pts[j][0], -(pts[i][1] - pts[j][1])) // normal orthogonal to the difference
        crit.push(((th % Math.PI) + Math.PI) % Math.PI, ((th % Math.PI) + Math.PI) % Math.PI + Math.PI)
      }
      crit.sort((a, b) => a - b)
      const labs = new Set<string>()
      for (let i = 0; i < crit.length; i++) {
        const a = crit[i], b = i + 1 < crit.length ? crit[i + 1] : crit[0] + 2 * Math.PI
        if (b - a < 1e-12) continue
        const th = (a + b) / 2
        const proj = pts.map((q) => q[0] * Math.cos(th) + q[1] * Math.sin(th))
        const order = proj.map((v, k) => [v, k]).sort((u, v) => u[0] - v[0])
        for (let cut = 0; cut <= p.pts; cut++) {
          const l = new Array(p.pts).fill('0')
          for (let r = cut; r < p.pts; r++) l[order[r][1]] = '1'
          labs.add(l.join(''))
        }
      }
      expect(ans[4]).toBe(labs.size)
    }
  }, 120000)
})

// ---------- C ----------
describe('generator C against independent computation', () => {
  it('binomial formula, projection margin, numerically minimised AdaBoost normaliser (300 seeds)', () => {
    for (const s of seeds('C', 300)) {
      const p = C.sample(makeRng(s))
      const ans = answers(C.build(p))
      const m = p.h1.length
      const k = p.h1.filter((v, i) => v !== p.h2[i]).length
      close(ans[0], absSum(k) / m, 1e-12)
      close(ans[1] ** 2 * p.n, (p.B * p.R) ** 2, 1e-9)
      // margin: distance from each point to the hyperplane through its foot of perpendicular, with the sign of the label
      const w2 = p.w[0] ** 2 + p.w[1] ** 2
      const dists = p.pts.map(([x, y], i) => {
        const sc = p.w[0] * x + p.w[1] * y + p.b
        const foot = [x - (sc / w2) * p.w[0], y - (sc / w2) * p.w[1]]
        expect(Math.abs(p.w[0] * foot[0] + p.w[1] * foot[1] + p.b)).toBeLessThan(1e-9)
        expect(Math.sign(sc)).toBe(p.ys[i])
        return Math.hypot(x - foot[0], y - foot[1])
      })
      close(ans[2], Math.min(...dists), 1e-9)
      // margin bound: remove the two known terms and square the remainder
      const rest = ans[3] - p.err - Math.sqrt(Math.log(1 / p.delta) / (2 * p.n2))
      close(rest ** 2 * p.gam ** 2 * p.n2, 4 * p.R2 ** 2, 1e-6)
      // alpha minimises Z(a) = (1-eps) e^{-a} + eps e^{a}
      const a = golden((t) => (1 - p.eps) * Math.exp(-t) + p.eps * Math.exp(t), 0, 6)
      close(ans[4], a, 1e-6)
    }
  })
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('Massart identity, minimal m, numerical max-margin, SVM feasibility, numerically minimised normalisers (200 seeds)', () => {
    for (const s of seeds('D', 200)) {
      const p = D.sample(makeRng(s))
      const ans = answers(D.build(p))
      close(Math.sqrt((2 * Math.log2(p.H) * Math.LN2) / p.m1), ans[0], 1e-12)
      const gap = (m: number) => (2 * p.B * p.R) / Math.sqrt(m) + Math.sqrt(Math.log(1 / p.delta) / (2 * m))
      expect(gap(ans[1])).toBeLessThanOrEqual(p.eps)
      expect(gap(ans[1] - 1)).toBeGreaterThan(p.eps)
      // max-margin of two points: search over unit directions w, with the offset b found by ternary search
      const margin = (th: number) => {
        const w = [Math.cos(th), Math.sin(th)]
        const a = w[0] * p.pos[0] + w[1] * p.pos[1], c = w[0] * p.neg[0] + w[1] * p.neg[1]
        let lo = -50, hi = 50
        for (let i = 0; i < 80; i++) {
          const b1 = lo + (hi - lo) / 3, b2 = hi - (hi - lo) / 3
          if (Math.min(a + b1, -(c + b1)) < Math.min(a + b2, -(c + b2))) lo = b1; else hi = b2
        }
        return Math.min(a + lo, -(c + lo))
      }
      let best = 0, bestTh = 0
      for (let i = 0; i < 3600; i++) { const th = (2 * Math.PI * i) / 3600; const v = margin(th); if (v > best) { best = v; bestTh = th } }
      const th = golden((t) => -margin(t), bestTh - 0.003, bestTh + 0.003, 60)
      close(ans[2], margin(th), 1e-6)
      // 1-D SVM: |w| = ans is feasible and any smaller |w| is not
      const feasible = (w: number) => Math.max(...p.poss.map((x) => 1 - w * x)) <= Math.min(...p.negs.map((x) => -1 - w * x)) + 1e-9
      expect(feasible(ans[3])).toBe(true)
      expect(feasible(ans[3] * 0.999)).toBe(false)
      // AdaBoost product of normalisers, each from a numerical minimisation over alpha
      let prod = 1
      for (const e of p.errs) prod *= (1 - e) * Math.exp(-golden((t) => (1 - e) * Math.exp(-t) + e * Math.exp(t), 0, 6)) + e * Math.exp(golden((t) => (1 - e) * Math.exp(-t) + e * Math.exp(t), 0, 6))
      close(ans[4], prod, 1e-9)
    }
  })
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  it('binomial identity, grid supremum, sorted margin count, boosting rounds by search (200 seeds)', () => {
    for (const s of seeds('E', 200)) {
      const p = E.sample(makeRng(s))
      const ans = answers(E.build(p))
      // m C(m-1, floor((m-1)/2)) / 2^(m-1) = E|S_m|
      close(ans[0], Number((BigInt(p.m) * choose(p.m - 1, Math.floor((p.m - 1) / 2)))) / 2 ** (p.m - 1) / p.m, 1e-12)
      // sup over the ball by a grid of directions, for each of the eight sign patterns
      let tot = 0
      for (let mask = 0; mask < 8; mask++) {
        const sg = [mask & 1 ? 1 : -1, mask & 2 ? 1 : -1, mask & 4 ? 1 : -1]
        const v = [0, 1].map((c) => p.xs.reduce((t, x, i) => t + sg[i] * x[c], 0))
        let sup = -Infinity
        for (let i = 0; i < 20000; i++) { const th = (2 * Math.PI * i) / 20000; sup = Math.max(sup, p.B * (v[0] * Math.cos(th) + v[1] * Math.sin(th))) }
        tot += sup
      }
      const exact = tot / 8 / 3
      close(ans[1], exact, 1e-6)
      const sq = p.xs.reduce((t, x) => t + x[0] ** 2 + x[1] ** 2, 0)
      close(ans[2] ** 2 * 9, p.B ** 2 * sq, 1e-9)
      expect(ans[2]).toBeGreaterThanOrEqual(exact - 1e-9)
      const sorted = [...p.vals].sort((a, b) => a - b)
      close(ans[3], sorted.findIndex((v) => v > p.gamma) < 0 ? 1 : sorted.findIndex((v) => v > p.gamma) / 10, 1e-12)
      let T = 1
      while (Math.exp(-2 * T * p.g * p.g) >= 1 / p.n) T++
      expect(ans[4]).toBe(T)
    }
  })
})

// ---------- F ----------
describe('generator F against independent computation', () => {
  it('dual Perceptron, regret bound by plugging in eta, exact beta, bound inversion (300 seeds)', () => {
    for (const s of seeds('F', 300)) {
      const p = Ff.sample(makeRng(s))
      const ans = answers(Ff.build(p))
      // dual Perceptron: scores from mistake counts and the Gram matrix only
      const alpha = new Array(p.xs.length).fill(0)
      const gram = (i: number, j: number) => p.xs[i][0] * p.xs[j][0] + p.xs[i][1] * p.xs[j][1]
      for (let i = 0; i < p.xs.length; i++) {
        let score = 0
        for (let j = 0; j < i; j++) score += alpha[j] * p.ys[j] * gram(j, i)
        if (p.ys[i] * score <= 0) alpha[i] += 1
      }
      expect(ans[0]).toBe(alpha.reduce((t, a, j) => t + a * p.ys[j] * p.xs[j][0], 0))
      const eta = Math.sqrt((8 * Math.log(p.N)) / p.T)
      close(ans[1], Math.log(p.N) / eta + (eta * p.T) / 8, 1e-9)
      const beta = F(2 * p.rho * p.rho).div(F(Math.round(p.lam * 100), 100).mul(F(p.m)))
      close(ans[2], ratio(beta), 1e-12)
      close(ans[3] ** 2 * p.T2, (p.B * p.rho2) ** 2, 1e-9)
    }
  })
  it('the excess risk of least squares / minimum-norm interpolation, by Monte Carlo', () => {
    // solve A z = b by Gauss-Jordan with partial pivoting
    const solve = (A: number[][], b: number[]) => {
      const n = b.length
      const M = A.map((r, i) => [...r, b[i]])
      for (let c = 0; c < n; c++) {
        let piv = c
        for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r
        ;[M[c], M[piv]] = [M[piv], M[c]]
        for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k] }
      }
      return M.map((r, i) => r[n] / r[i])
    }
    const checked = new Set<string>()
    let done = 0
    for (let i = 0; done < 8 && i < 400; i++) {
      const p = Ff.sample(makeRng('FM' + i))
      const key = p.under + ':' + p.n + ':' + p.p
      if (checked.has(key)) continue
      checked.add(key)
      done++
      const want = answers(Ff.build(p))[4]
      const rng = makeRng('mc' + key)
      let acc = 0
      const trials = 60000
      for (let t = 0; t < trials; t++) {
        const X = Array.from({ length: p.n }, () => Array.from({ length: p.p }, () => gauss(rng)))
        const y = Array.from({ length: p.n }, () => Math.sqrt(p.sigma2) * gauss(rng))
        let beta: number[]
        if (p.under) {
          // (X'X) beta = X'y
          const XtX = Array.from({ length: p.p }, (_, a) => Array.from({ length: p.p }, (_, b) => X.reduce((s, r) => s + r[a] * r[b], 0)))
          beta = solve(XtX, Array.from({ length: p.p }, (_, a) => X.reduce((s, r, k) => s + r[a] * y[k], 0)))
        } else {
          // beta = X' (X X')^{-1} y
          const G = Array.from({ length: p.n }, (_, a) => Array.from({ length: p.n }, (_, b) => X[a].reduce((s, v, k) => s + v * X[b][k], 0)))
          const z = solve(G, y)
          beta = Array.from({ length: p.p }, (_, c) => X.reduce((s, r, a) => s + r[c] * z[a], 0))
        }
        acc += beta.reduce((s, v) => s + v * v, 0)
      }
      const mc = acc / trials
      expect(Math.abs(mc / want - 1), `${key}: mc ${mc}, want ${want}`).toBeLessThan(0.03)
    }
  }, 300000)
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  it('shifted softmax, numerical ridge minimisation, exact SGD, direct squared errors (300 seeds)', () => {
    for (const s of seeds('G', 300)) {
      const p = G.sample(makeRng(s))
      const ans = answers(G.build(p))
      const mn = Math.min(...p.L)
      const ex = p.L.map((l) => Math.exp(-p.eta * (l - mn)))
      close(ans[0], ex[0] / ex.reduce((a, b) => a + b, 0), 1e-12)
      const lam = p.lamTenths / 10
      const argmin = (xs: number[], ys: number[]) => golden((w) => xs.reduce((t, x, i) => t + (w * x - ys[i]) ** 2, 0) / xs.length + lam * w * w, -50, 50, 300)
      const wS = argmin(p.xs, p.ys)
      close(ans[1], wS, 1e-6)
      const xs2 = p.xs.map((x, i) => (i === p.k ? p.xNew : x)), ys2 = p.ys.map((y, i) => (i === p.k ? p.yNew : y))
      close(ans[2], Math.abs(wS - argmin(xs2, ys2)), 1e-6)
      // exact SGD
      let w = F(0)
      const step = F(p.eta2Halves, 2)
      let sum = F(0)
      for (const z of p.zs) {
        sum = sum.add(w)
        const zf = F(Math.round(z * 100), 100)
        w = w.cmp(zf) > 0 ? w.sub(step) : w.add(step)
      }
      close(ans[3], ratio(sum.div(F(4))), 1e-12)
      // direct: E (pred - y)^2 with y = f0 + noise, noise independent of the predictor
      const direct = p.preds.reduce((t, v) => t + (v - p.f0) ** 2, 0) / p.preds.length + p.sigma2
      close(ans[4], direct, 1e-9)
    }
  })
})

// ---------- H ----------
describe('generator H against independent computation', () => {
  it('exact mistake bound and Perceptron runs, searches for rounds and sizes, gradient descent to the minimum-norm solution (300 seeds)', () => {
    for (const s of seeds('H', 300)) {
      const p = H.sample(makeRng(s))
      const ans = answers(H.build(p))
      // exact bound
      const sc = p.xs.map((x) => Math.abs(p.u[0] * x[0] + p.u[1] * x[1]))
      const R2 = Math.max(...p.xs.map((x) => x[0] ** 2 + x[1] ** 2))
      const exact = F(R2 * (p.u[0] ** 2 + p.u[1] ** 2), Math.min(...sc) ** 2)
      close(ans[0], ratio(exact), 0.005)
      // the Perceptron, in random orders and repeated passes, never exceeds the bound
      const rng = makeRng('perm' + s)
      for (let rep = 0; rep < 5; rep++) {
        const idx = rng.shuffle(p.xs.map((_, i) => i))
        const y = p.xs.map((x) => Math.sign(p.u[0] * x[0] + p.u[1] * x[1]))
        let w = [0, 0], mistakes = 0, clean = false
        for (let pass = 0; pass < 2000 && !clean; pass++) {
          clean = true
          for (const i of idx) if (y[i] * (w[0] * p.xs[i][0] + w[1] * p.xs[i][1]) <= 0) { w = [w[0] + y[i] * p.xs[i][0], w[1] + y[i] * p.xs[i][1]]; mistakes++; clean = false }
        }
        expect(clean).toBe(true)
        expect(mistakes).toBeLessThanOrEqual(ratio(exact) + 1e-9)
      }
      // smallest T with sqrt(ln N / (2T)) <= eps
      const avg = (T: number) => Math.sqrt(T * Math.log(p.N) / 2) / T
      expect(avg(ans[1])).toBeLessThanOrEqual(p.epsH)
      expect(avg(ans[1] - 1)).toBeGreaterThan(p.epsH)
      // smallest m (exact rationals)
      const mNeed = ceilFr(F(2 * p.rho * p.rho).div(F(Math.round(p.lam * 100), 100).mul(F(Math.round(p.epsS * 100), 100))))
      expect(ans[2]).toBe(mNeed)
      expect(ans[3]).toBe(ceilFr(F((p.B * p.rho2 * 100) ** 2, p.epsPct ** 2)))
      // gradient descent on 0.5 ||X w - y||^2 from zero converges to the minimum-norm interpolator
      const tr = p.X.reduce((t, r) => t + r.reduce((a, v) => a + v * v, 0), 0)
      let w = [0, 0, 0]
      for (let it = 0; it < 40000; it++) {
        const res = p.X.map((r, i) => r.reduce((t, v, k) => t + v * w[k], 0) - p.y[i])
        w = w.map((v, k) => v - (res[0] * p.X[0][k] + res[1] * p.X[1][k]) / tr)
      }
      close(ans[4], w.reduce((t, v, k) => t + v * p.xStar[k], 0), 1e-6)
    }
  })
})
