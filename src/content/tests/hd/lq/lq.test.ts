// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: Monte Carlo in the unit ball and cube; Hoeffding checked as a valid upper bound on the exact binomial tail; a search for the sample size.
//  B: exact binomial tails are below each bound; the Bernstein and Hoeffding arithmetic recomputed.
//  C: eigenvalues of simulated Wishart matrices (Jacobi method) against the Marchenko-Pastur edges; shrinkage through an explicit rotated matrix.
//  D: a simulated spiked sample covariance, top eigenpair by power iteration, against the BBP limits.
//  E: exact inverse in fractions for the irrepresentable quantity; the union bound is checked to be valid by simulation.
//  F: a search for the number of measurements; coherence from inner products; l1 and l2 minimisers by numerical minimisation along the constraint line.
//  G: the step-up procedure scanned from the largest index; Holm through adjusted p-values; BH adjusted values by direct minimisation; FDR by simulation.
//  H: the covariance matrix from the exact inverse of the precision matrix, and partial correlation as the correlation of residuals.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import type { Rng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { F, solveFr } from '../../../shared/fraction'
import * as A from './a-concentration'
import * as B from './b-bounds'
import * as C from './c-matrices'
import * as D from './d-spiked'
import * as E from './e-sparse'
import * as Fr from './f-recovery'
import * as G from './g-testing'
import * as H from './h-graphical'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const rel = (got: number, want: number, r: number) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(r * Math.abs(want))
const lectures = topics.find((t) => t.id === 'hd')!.lectures.length
const gauss = (rng: Rng) => Math.sqrt(-2 * Math.log(1 - rng.next())) * Math.cos(2 * Math.PI * rng.next())

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

/** Cyclic Jacobi eigenvalues of a symmetric matrix. */
function jacobi(M: number[][]): number[] {
  const n = M.length
  const a = M.map((r) => [...r])
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] ** 2
    if (off < 1e-18) break
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(a[p][q]) < 1e-300) continue
      const th = (a[q][q] - a[p][p]) / (2 * a[p][q])
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1))
      const c = 1 / Math.sqrt(t * t + 1), s = t * c
      for (let k = 0; k < n; k++) { const kp = a[k][p], kq = a[k][q]; a[k][p] = c * kp - s * kq; a[k][q] = s * kp + c * kq }
      for (let k = 0; k < n; k++) { const pk = a[p][k], qk = a[q][k]; a[p][k] = c * pk - s * qk; a[q][k] = s * pk + c * qk }
    }
  }
  return a.map((r, i) => r[i]).sort((x, y) => y - x)
}
const logChoose = (n: number, k: number) => { let r = 0; for (let i = 1; i <= k; i++) r += Math.log((n - k + i) / i); return r }

// ---------- A ----------
describe('generator A against independent computation', () => {
  it('searches and exact formulas (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      close(ans[1], p.p / 6, 1e-12)
      close(ans[2], ((p.b - p.a) / 2) * Math.sqrt(p.n), 1e-12)
      let n = 1
      while (2 * Math.exp((-2 * n * p.err * p.err) / (p.b - p.a) ** 2) > p.delta) n++
      expect(ans[4]).toBe(n)
      // Hoeffding is a valid upper bound for the exact tail of a sum of n two-point variables at a and b (prob 1/2)
      const R = p.b - p.a
      let tail = 0
      for (let k = 0; k <= p.n; k++) {
        const sum = k * p.b + (p.n - k) * p.a, mean = (p.n * (p.a + p.b)) / 2
        if (sum - mean >= p.t) tail += Math.exp(logChoose(p.n, k) - p.n * Math.log(2))
      }
      expect(tail).toBeLessThanOrEqual(ans[3] + 1e-12)
      expect(ans[3]).toBeCloseTo(Math.exp((-2 * p.t * p.t) / (p.n * R * R)), 10)
    }
  })
  it('Monte Carlo: the shell fraction of the unit ball and the mean squared distance in the cube (5 seeds)', () => {
    for (const s of seeds('A', 5)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      const rng = makeRng('sim' + s)
      let inShell = 0
      const N = 200000
      for (let i = 0; i < N; i++) if (Math.pow(rng.next(), 1 / p.p) > 1 - p.eps) inShell++ // radius of a uniform point: U^(1/p)
      close(ans[0], inShell / N, 0.006)
      let d2 = 0
      const M = 40000
      for (let i = 0; i < M; i++) { let q = 0; for (let j = 0; j < p.p; j++) q += (rng.next() - rng.next()) ** 2; d2 += q }
      rel(d2 / M, ans[1], 0.02)
    }
  }, 60000)
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  it('exact tails are below every bound, arithmetic recomputed (300 seeds)', () => {
    for (const s of seeds('B', 300)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      const v = p.q * (1 - p.q)
      // exact upper tail P(mean - q >= t) and two-sided tail for Binomial(n, q)
      let up = 0, two = 0
      for (let k = 0; k <= p.n; k++) {
        const pr = Math.exp(logChoose(p.n, k) + k * Math.log(p.q) + (p.n - k) * Math.log(1 - p.q))
        const dev = k / p.n - p.q
        if (dev >= p.t - 1e-12) up += pr
        if (Math.abs(dev) >= p.t - 1e-12) two += pr
      }
      expect(two).toBeLessThanOrEqual(ans[0] + 1e-12)
      expect(up).toBeLessThanOrEqual(ans[1] + 1e-12)
      expect(up).toBeLessThanOrEqual(ans[2] + 1e-12)
      close(ans[3], ans[1], 1e-12)
      expect(ans[2]).toBeLessThanOrEqual(ans[1] + 1e-12 + (v > 0.2 ? 1 : 0))
      close(ans[0], Math.min(1, v / (p.n * p.t * p.t)), 1e-12)
      close(ans[4], Math.exp(-(p.n * p.t * p.t) / (2 * v)), 1e-12)
    }
  })
})

// ---------- C ----------
describe('generator C against independent computation', () => {
  it('exact edges, zero fraction by counting, shrinkage through a rotated matrix (300 seeds)', () => {
    for (const s of seeds('C', 300)) {
      const p = C.sample(makeRng(s))
      const ans = answers(C.build(p))
      close(ans[0], 1 + p.p / p.n + 2 * Math.sqrt(p.p / p.n), 1e-9)
      close(ans[1], 1 + p.p / p.n - 2 * Math.sqrt(p.p / p.n), 1e-9)
      close(ans[2], (p.p2 - p.n2) / p.p2, 1e-12)
      const mean = p.ev.reduce((a, v) => a + v, 0) / 4
      const rng = makeRng('rot' + s)
      // random orthogonal matrix by Gram-Schmidt
      const Q: number[][] = []
      while (Q.length < 4) {
        let v = Array.from({ length: 4 }, () => gauss(rng))
        for (const u of Q) { const d = v.reduce((a, x, i) => a + x * u[i], 0); v = v.map((x, i) => x - d * u[i]) }
        const nrm = Math.hypot(...v)
        if (nrm > 1e-6) Q.push(v.map((x) => x / nrm))
      }
      const S = [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => Q.reduce((a, row, k) => a + p.ev[k] * row[i] * row[j], 0)))
      const tr = S.reduce((a, r, i) => a + r[i], 0)
      const shrunk = S.map((r, i) => r.map((v, j) => (1 - p.delta) * v + (i === j ? p.delta * (tr / 4) : 0)))
      const eig = jacobi(shrunk)
      close(tr / 4, mean, 1e-9)
      close(ans[3], eig[0], 1e-8)
      close(ans[4], eig[3], 1e-8)
    }
  })
  it('Monte Carlo: simulated Wishart eigenvalues lie near the Marchenko-Pastur edges', () => {
    for (const [p, n] of [[80, 320], [90, 180]] as const) {
      const rng = makeRng(`wish${p}`)
      const X = Array.from({ length: n }, () => Array.from({ length: p }, () => gauss(rng)))
      const S = Array.from({ length: p }, (_, i) => Array.from({ length: p }, (_, j) => X.reduce((a, row) => a + row[i] * row[j], 0) / n))
      const eig = jacobi(S)
      const ans = answers(C.build({ p, n, p2: 100, n2: 50, ev: [4, 3, 2, 1], delta: 0.2 }))
      rel(eig[0], ans[0], 0.1)
      rel(eig[p - 1], ans[1], 0.2) // the smallest eigenvalue converges slowly (Tracy-Widom fluctuations of order p^(-2/3))
    }
  }, 120000)
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('threshold, edge, limit and cosine recomputed (300 seeds)', () => {
    for (const s of seeds('D', 300)) {
      const p = D.sample(makeRng(s))
      const ans = answers(D.build(p))
      const g = p.p / p.n
      close(ans[0], 1 + Math.sqrt(g), 1e-12)
      close(ans[1], 1 + g + 2 * Math.sqrt(g), 1e-12)
      close(ans[2], p.ell + (g * p.ell) / (p.ell - 1), 1e-12)
      close(ans[3], (1 - g / (p.ell - 1) ** 2) / (1 + g / (p.ell - 1)), 1e-12)
      close(ans[4], p.p / (p.ell - 1) ** 2, 1e-12)
      expect(p.ell).toBeGreaterThan(ans[0])
    }
  })
  it('Monte Carlo: top eigenvalue and eigenvector alignment of a simulated spiked sample covariance (3 settings)', () => {
    for (const [p, n, ell] of [[100, 400, 3], [150, 300, 4], [200, 400, 2.5]] as const) {
      const ans = answers(D.build({ p, n, ell }))
      const rng = makeRng(`spike${p}${n}`)
      const X = Array.from({ length: n }, () => Array.from({ length: p }, (_, j) => (j === 0 ? Math.sqrt(ell) : 1) * gauss(rng)))
      let v = Array.from({ length: p }, () => gauss(rng))
      let lam = 0
      for (let it = 0; it < 400; it++) {
        const xv = X.map((row) => row.reduce((a, x, j) => a + x * v[j], 0))
        const w = Array.from({ length: p }, (_, j) => X.reduce((a, row, i) => a + row[j] * xv[i], 0) / n)
        lam = Math.hypot(...w)
        v = w.map((x) => x / lam)
      }
      rel(lam, ans[2], 0.08)
      expect(Math.abs(v[0] ** 2 - ans[3])).toBeLessThan(0.08)
    }
  }, 120000)
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  it('recomputed with exact fractions and a search (300 seeds)', () => {
    for (const s of seeds('E', 300)) {
      const p = E.sample(makeRng(s))
      const ans = answers(E.build(p))
      close(ans[0], p.sigma * Math.sqrt((2 * Math.log(p.p)) / p.n), 1e-12)
      let n = 1
      while ((p.s * Math.log(p.p)) / n > p.rate) n++
      expect(ans[1]).toBe(n)
      // irrepresentable quantity by an exact solve with Sigma_SS = [[1, rho], [rho, 1]]
      const rho = F(Math.round(p.rho * 10), 10)
      const sol = solveFr([[F(1), rho], [rho, F(1)]], [F(1), F(1)])
      const c1 = F(Math.round(p.c1 * 10), 10), c2 = F(Math.round(p.c2 * 10), 10)
      close(ans[2], c1.mul(sol[0]).add(c2.mul(sol[1])).num, 1e-9)
      close(ans[3], Math.min(1, 2 * p.p * Math.exp(-(p.tt * p.tt) / (2 * p.sigma * p.sigma))), 1e-12)
      // the threshold at which the union bound equals 0.05
      const t = ans[4]
      close(2 * p.p * Math.exp(-(t * t) / (2 * p.sigma * p.sigma)), 0.05, 1e-9)
    }
  })
  it('Monte Carlo: the union bound is valid for the maximum of Gaussian noise correlations (p = 200)', () => {
    const rng = makeRng('union')
    const sigma = 1, pdim = 200, t = 3
    let hit = 0
    const runs = 20000
    for (let r = 0; r < runs; r++) { let m = 0; for (let j = 0; j < pdim; j++) m = Math.max(m, Math.abs(sigma * gauss(rng))); if (m > t) hit++ }
    expect(hit / runs).toBeLessThanOrEqual(2 * pdim * Math.exp(-(t * t) / (2 * sigma * sigma)))
  }, 60000)
})

// ---------- F ----------
describe('generator F against independent computation', () => {
  it('search for m, coherence, and l1 / l2 minimisers along the constraint line (300 seeds)', () => {
    const minimise = (f: (x: number) => number, lo: number, hi: number) => { const g = (Math.sqrt(5) - 1) / 2; for (let i = 0; i < 300; i++) { const a = hi - g * (hi - lo), b = lo + g * (hi - lo); if (f(a) < f(b)) hi = b; else lo = a } return (lo + hi) / 2 }
    for (const s of seeds('F', 300)) {
      const p = Fr.sample(makeRng(s))
      const ans = answers(Fr.build(p))
      let m = 1
      while (m < 2 * p.s * Math.log(p.p / p.s)) m++
      expect(ans[0]).toBe(m)
      const nrm = Math.sqrt(p.u[0] ** 2 + p.u[1] ** 2)
      const cols = [[1, 0], [0, 1], [p.u[0] / nrm, p.u[1] / nrm]]
      const ips: number[] = []
      cols.forEach((c, i) => cols.forEach((d, j) => { if (i < j) ips.push(Math.abs(c[0] * d[0] + c[1] * d[1])) }))
      const mu = Math.max(...ips)
      close(ans[1], mu, 1e-12)
      close(ans[2], 0.5 * (1 + 1 / mu), 1e-12)
      // minimum l1 norm on the line a1 x1 + a2 x2 = y, parametrised by x1
      const l1 = (x1: number) => Math.abs(x1) + Math.abs((p.y - p.a1 * x1) / p.a2)
      const x1 = minimise(l1, -50, 50)
      close(ans[3], l1(x1), 1e-6)
      const l2 = (x1b: number) => Math.hypot(x1b, (p.y - p.a1 * x1b) / p.a2)
      close(ans[4], l2(minimise(l2, -50, 50)), 1e-6)
    }
  })
  it('the l1 solution of the single equation has exactly one nonzero coordinate', () => {
    for (const s of seeds('F', 100)) {
      const p = Fr.sample(makeRng(s))
      const ans = answers(Fr.build(p))
      expect(ans[3]).toBeCloseTo(p.y / Math.max(p.a1, p.a2), 10)
      expect(ans[4]).toBeLessThan(ans[3])
    }
  })
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  it('rejections by scanning, Holm via adjusted values, BH adjusted values by direct minimisation (300 seeds)', () => {
    for (const s of seeds('G', 300)) {
      const p = G.sample(makeRng(s))
      const ans = answers(G.build(p))
      const P = p.ps.map((v) => v / 1000), m = P.length
      expect(ans[0]).toBe(P.filter((v) => m * v <= p.q + 1e-12).length)
      // Holm: adjusted p_(i) = max_{j<=i} (m-j+1) p_(j); reject while adjusted <= q
      let run = 0, holm = 0
      for (let i = 0; i < m; i++) { run = Math.max(run, (m - i) * P[i]); if (run <= p.q + 1e-12) holm = i + 1; else break }
      expect(ans[1]).toBe(holm)
      // BH: scan from the largest index down and stop at the first p_(i) <= i q / m
      let k = 0
      for (let i = m; i >= 1; i--) if (P[i - 1] <= (i * p.q) / m + 1e-12) { k = i; break }
      expect(ans[2]).toBe(k)
      close(ans[3], k > 0 ? P[k - 1] : 0, 1e-12)
      const idx = Math.min(p.k, m)
      let best = Infinity
      for (let j = idx; j <= m; j++) best = Math.min(best, (m * P[j - 1]) / j)
      close(ans[4], Math.min(1, best), 1e-12)
      // BH rejects at least as many as Holm and Bonferroni
      expect(ans[2]).toBeGreaterThanOrEqual(ans[1])
      expect(ans[1]).toBeGreaterThanOrEqual(ans[0])
    }
  })
  it('Monte Carlo: BH controls the FDR at q m0 / m (m = 10, 7 true nulls)', () => {
    const rng = makeRng('fdr')
    const q = 0.1, m = 10, m0 = 7
    let fdp = 0
    const runs = 20000
    for (let r = 0; r < runs; r++) {
      const P: [number, boolean][] = []
      for (let i = 0; i < m; i++) P.push(i < m0 ? [rng.next(), true] : [Math.min(1, Math.abs(gauss(rng)) * 0.002), false])
      P.sort((a, b) => a[0] - b[0])
      let k = 0
      for (let i = 1; i <= m; i++) if (P[i - 1][0] <= (i * q) / m) k = i
      if (k > 0) fdp += P.slice(0, k).filter((x) => x[1]).length / k
    }
    expect(fdp / runs).toBeLessThanOrEqual((q * m0) / m + 0.01)
  }, 60000)
})

// ---------- H ----------
describe('generator H against independent computation', () => {
  it('covariance from the exact inverse; partial correlation as a residual correlation (300 seeds)', () => {
    for (const s of seeds('H', 300)) {
      const p = H.sample(makeRng(s))
      const ans = answers(H.build(p))
      const T = p.th.map((r) => r.map((v) => F(v, 10)))
      const cols = [0, 1, 2].map((j) => solveFr(T, [0, 1, 2].map((i) => F(i === j ? 1 : 0))))
      const S = [0, 1, 2].map((i) => [0, 1, 2].map((j) => cols[j][i]))
      // partial correlation of 1,2 given 3 from the covariance: residual covariances after regressing on variable 3
      const res = (i: number, j: number) => S[i][j].sub(S[i][2].mul(S[2][j]).div(S[2][2]))
      close(ans[0], res(0, 1).num / Math.sqrt(res(0, 0).num * res(1, 1).num), 1e-9)
      // conditional variance of X1 given X2, X3: S11 - S_{1,23} S_{23}^{-1} S_{23,1}
      const sub = [[S[1][1], S[1][2]], [S[2][1], S[2][2]]]
      const b = solveFr(sub, [S[1][0], S[2][0]])
      close(ans[1], S[0][0].sub(S[1][0].mul(b[0])).sub(S[2][0].mul(b[1])).num, 1e-9)
      close(ans[2], b[1].num, 1e-9)
      const r23 = (i: number, j: number) => S[i][j].sub(S[i][0].mul(S[0][j]).div(S[0][0]))
      close(ans[3], r23(1, 2).num / Math.sqrt(r23(1, 1).num * r23(2, 2).num), 1e-9)
      let edges = 0
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (p.th[i][j] !== 0) edges++
      expect(ans[4]).toBe(edges)
    }
  })
})
