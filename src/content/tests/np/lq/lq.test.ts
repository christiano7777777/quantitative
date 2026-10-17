// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: exact binomial in fractions; W+ and its moments from all 2^8 sign patterns; the efficiency constant by numerical integration of the normal density.
//  B: U by counting pairs; the null variance of U by enumerating every assignment; the average of H and of the Friedman statistic over all arrangements equals k-1.
//  C: the supremum of |F_n - F_0| found on a fine grid.
//  D: Pearson correlation of ranks, and Kendall's tau by counting pairs.
//  E: the 20 assignments enumerated with bitmasks and exact fractions.
//  F: jackknife bias of the squared mean equals s^2/n exactly; the inclusion probability by exact enumeration of resamples.
//  G: kernel densities integrate to one numerically; the Epanechnikov window counted directly.
//  H: weighted least squares solved by elimination; local linear fits reproduce straight lines exactly.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { F } from '../../../shared/fraction'
import * as A from './a-signed'
import * as B from './b-ranksum'
import * as C from './c-ks'
import * as D from './d-rankcorr'
import * as E from './e-permutation'
import * as Fj from './f-jackknife'
import * as G from './g-kde'
import * as H from './h-regression'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const lectures = topics.find((t) => t.id === 'np')!.lectures.length
const simpson = (f: (x: number) => number, a: number, b: number, n = 20000) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3 }

const gens: [string, LQGenerator, number][] = [
  ['A', { id: 'A', generate: (r) => A.build(A.sample(r)) }, 5],
  ['B', { id: 'B', generate: (r) => B.build(B.sample(r)) }, 5],
  ['C', { id: 'C', generate: (r) => C.build(C.sample(r)) }, 5],
  ['D', { id: 'D', generate: (r) => D.build(D.sample(r)) }, 5],
  ['E', { id: 'E', generate: (r) => E.build(E.sample(r)) }, 5],
  ['F', { id: 'F', generate: (r) => Fj.build(Fj.sample(r)) }, 5],
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
  it('exact binomial tail, W+ and its null moments from all sign patterns, the efficiency constant by integration (300 seeds)', () => {
    // moments of W+ from all 2^8 patterns of signs for the ranks 1..8
    let m = 0, m2 = 0
    for (let mask = 0; mask < 256; mask++) { let w = 0; for (let i = 0; i < 8; i++) if (mask & (1 << i)) w += i + 1; m += w; m2 += w * w }
    m /= 256; m2 /= 256
    close(m, 18, 1e-12)
    close(m2 - m * m, (8 * 9 * 17) / 24, 1e-9)
    // ARE of Wilcoxon vs t for normal data: 12 sigma^2 (integral of f^2)^2 = 3/pi
    const phi = (x: number) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI)
    const are = 12 * simpson((x) => phi(x) ** 2, -10, 10) ** 2
    close(are, 3 / Math.PI, 1e-9)
    for (const s of seeds('A', 300)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      const pos = p.d.filter((v) => v > 0).length
      expect(ans[0]).toBe(pos)
      const k = Math.min(pos, 8 - pos)
      let tail = F(0)
      const choose = (n: number, j: number) => { let r = 1n; for (let i = 1; i <= j; i++) r = (r * BigInt(n - j + i)) / BigInt(i); return Number(r) }
      for (let j = 0; j <= k; j++) tail = tail.add(F(choose(8, j), 256))
      close(ans[1], Math.min(1, 2 * tail.num), 1e-12)
      // W+ by sorting absolute values with an explicit rank lookup
      const abs = p.d.map(Math.abs)
      const wPlus = p.d.reduce((a, v) => a + (v > 0 ? abs.filter((q) => q <= Math.abs(v)).length : 0), 0)
      expect(ans[2]).toBe(wPlus)
      close(ans[3], (wPlus - m) / Math.sqrt(m2 - m * m), 1e-9)
      expect(ans[4]).toBe(Math.ceil(p.nt / are - 1e-9))
    }
  })
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  it('U by counting pairs; the null moments of U from all 126 assignments; averages of H and chi-square over all arrangements equal k-1', () => {
    // null moments of U for n1 = 4, n2 = 5
    let us: number[] = []
    for (let a = 0; a < 9; a++) for (let b = a + 1; b < 9; b++) for (let c = b + 1; c < 9; c++) for (let d = c + 1; d < 9; d++) {
      const sel = [a, b, c, d]
      let u = 0
      for (const i of sel) for (let j = 0; j < 9; j++) if (!sel.includes(j) && i > j) u++
      us.push(u)
    }
    expect(us).toHaveLength(126)
    const mu = us.reduce((s, v) => s + v, 0) / 126
    const va = us.reduce((s, v) => s + (v - mu) ** 2, 0) / 126
    close(mu, 10, 1e-12)
    close(va, (4 * 5 * 10) / 12, 1e-9)
    us = []
    // Kruskal-Wallis H over all assignments of ranks 1..9 to three groups of three: mean k - 1 = 2
    const Hof = (R: number[]) => (12 / 90) * R.reduce((a, v) => a + (v * v) / 3, 0) - 30
    let tot = 0, cnt = 0
    for (let a = 0; a < 9; a++) for (let b = a + 1; b < 9; b++) for (let c = b + 1; c < 9; c++) {
      const g1 = [a, b, c], rest = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((i) => !g1.includes(i))
      for (let d = 0; d < 6; d++) for (let e = d + 1; e < 6; e++) for (let f = e + 1; f < 6; f++) {
        const g2 = [rest[d], rest[e], rest[f]], g3 = rest.filter((_, i) => ![d, e, f].includes(i))
        const sum = (g: number[]) => g.reduce((q, v) => q + v + 1, 0)
        tot += Hof([sum(g1), sum(g2), sum(g3)]); cnt++
      }
    }
    expect(cnt).toBe(1680)
    close(tot / cnt, 2, 1e-9)
    // Friedman statistic averaged over all 6^4 arrangements of ranks within four blocks equals k - 1 = 2
    const perms = [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]
    let t2 = 0
    for (const p1 of perms) for (const p2 of perms) for (const p3 of perms) for (const p4 of perms) {
      const R = [0, 1, 2].map((j) => p1[j] + p2[j] + p3[j] + p4[j])
      t2 += (12 / 48) * R.reduce((a, v) => a + v * v, 0) - 48
    }
    close(t2 / 1296, 2, 1e-9)
  })
  it('the generator values equal direct recomputation (300 seeds)', () => {
    for (const s of seeds('B', 300)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      // U1 by counting pairs, W from U1
      let U1 = 0
      for (const a of p.x) for (const b of p.y) if (a > b) U1++
      expect(ans[1]).toBe(U1)
      expect(ans[0]).toBe(U1 + 10)
      close(ans[2], (U1 - 10) / Math.sqrt((4 * 5 * 10) / 12), 1e-12)
      // Kruskal-Wallis through the ANOVA identity: H = (N-1) SSB / SST on the ranks
      const flat = p.groups.flat()
      const rk = flat.map((v) => flat.filter((q) => q < v).length + 1)
      const gm = 5
      const ssb = [0, 1, 2].reduce((a, j) => { const m = (rk[3 * j] + rk[3 * j + 1] + rk[3 * j + 2]) / 3; return a + 3 * (m - gm) ** 2 }, 0)
      const sst = rk.reduce((a, v) => a + (v - gm) ** 2, 0)
      close(ans[3], (8 * ssb) / sst, 1e-9)
      // Friedman through the ANOVA identity: chi2 = (k-1) * b * SS_treatments_of_means / total... use rank sums directly
      const R = [0, 1, 2].map((j) => p.blocks.reduce((a, row) => a + (row.filter((q) => q < row[j]).length + 1), 0))
      close(ans[4], (12 / 48) * R.reduce((a, v) => a + v * v, 0) - 48, 1e-9)
    }
  })
})

// ---------- C ----------
describe('generator C against independent computation', () => {
  it('the supremum of |F_n - F_0| on a fine grid (300 seeds)', () => {
    for (const s of seeds('C', 300)) {
      const p = C.sample(makeRng(s))
      const ans = answers(C.build(p))
      const xs = p.x.map((v) => v / 100)
      const Fn = (t: number) => xs.filter((v) => v <= t).length / xs.length
      let sup = 0, plus = 0, minus = 0
      const grid = 200000
      for (let i = 0; i <= grid; i++) { const t = i / grid; const d = Fn(t) - t; sup = Math.max(sup, Math.abs(d)); plus = Math.max(plus, d); minus = Math.max(minus, -d) }
      close(ans[0], plus, 1e-4)
      close(ans[1], minus, 1e-4)
      close(ans[2], sup, 1e-4)
      close(ans[3], 1.36 / Math.sqrt(5), 1e-12)
      close(ans[4], Math.sqrt(5) * ans[2], 1e-12)
    }
  })
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('Pearson correlation of ranks, Kendall by counting (300 seeds)', () => {
    for (const s of seeds('D', 300)) {
      const p = D.sample(makeRng(s))
      const ans = answers(D.build(p))
      const rk = (v: number[]) => v.map((a) => v.filter((b) => b <= a).length)
      const pearson = (a: number[], b: number[]) => { const n = a.length, ma = a.reduce((q, v) => q + v, 0) / n, mb = b.reduce((q, v) => q + v, 0) / n; return a.reduce((q, v, i) => q + (v - ma) * (b[i] - mb), 0) / Math.sqrt(a.reduce((q, v) => q + (v - ma) ** 2, 0) * b.reduce((q, v) => q + (v - mb) ** 2, 0)) }
      close(ans[0], pearson(rk(p.x), rk(p.y)), 1e-9)
      let conc = 0, disc = 0
      for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if (i !== j) { if (p.x[i] < p.x[j] && p.y[i] < p.y[j]) conc++; if (p.x[i] < p.x[j] && p.y[i] > p.y[j]) disc++ }
      expect(ans[1]).toBe(conc)
      expect(ans[2]).toBe(disc)
      close(ans[3], (conc - disc) / 15, 1e-12)
      close(ans[4], pearson(p.x, p.y), 1e-9)
    }
  })
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  it('bitmask enumeration of the 20 assignments with exact fractions (300 seeds)', () => {
    for (const s of seeds('E', 300)) {
      const p = E.sample(makeRng(s))
      const ans = answers(E.build(p))
      const v = [...p.a, ...p.b]
      const obs = F(p.a.reduce((q, x) => q + x, 0), 3).sub(F(p.b.reduce((q, x) => q + x, 0), 3))
      let n = 0, one = 0, two = 0
      for (let mask = 0; mask < 64; mask++) {
        if (mask.toString(2).split('1').length - 1 !== 3) continue
        n++
        let sa = 0, sb = 0
        v.forEach((x, i) => { if (mask & (1 << i)) sa += x; else sb += x })
        const d = F(sa, 3).sub(F(sb, 3))
        if (d.cmp(obs) >= 0) one++
        if (Math.abs(d.num) >= Math.abs(obs.num) - 1e-12) two++
      }
      expect(n).toBe(20)
      expect(ans[0]).toBe(20)
      close(ans[1], obs.num, 1e-12)
      expect(ans[2]).toBe(one)
      close(ans[3], one / 20, 1e-12)
      close(ans[4], two / 20, 1e-12)
      expect(one).toBeGreaterThanOrEqual(1)
    }
  })
})

// ---------- F ----------
describe('generator F against independent computation', () => {
  it('jackknife bias of the squared mean equals s^2/n; SE recomputed; inclusion probability by exact enumeration (300 seeds)', () => {
    for (const s of seeds('F', 300)) {
      const p = Fj.sample(makeRng(s))
      const ans = answers(Fj.build(p))
      const n = p.x.length
      const mean = p.x.reduce((a, v) => a + v, 0) / n
      const s2 = p.x.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1)
      close(ans[0], mean * mean, 1e-9)
      close(ans[1], s2 / n, 1e-9) // exact identity for the squared mean
      const loo = p.x.map((_, i) => { const r = p.x.filter((__, j) => j !== i); const m = r.reduce((a, v) => a + v, 0) / (n - 1); return m * m })
      const bar = loo.reduce((a, v) => a + v, 0) / n
      close(ans[2], Math.sqrt(((n - 1) / n) * loo.reduce((a, v) => a + (v - bar) ** 2, 0)), 1e-9)
      close(ans[3], ans[0] - ans[1], 1e-12)
    }
    // probability that observation 0 is absent from a resample: enumerate all n^n ordered resamples for n = 5
    for (const n of [5, 6]) {
      let missing = 0
      const total = n ** n
      for (let code = 0; code < total; code++) { let c = code, has = false; for (let i = 0; i < n; i++) { if (c % n === 0) has = true; c = Math.floor(c / n) } if (!has) missing++ }
      close(answers(Fj.build({ x: Array.from({ length: n }, (_, i) => i + 1) }))[4], missing / total, 1e-12)
    }
  })
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  it('kernels integrate to one; the estimates recomputed; the window counted (300 seeds)', () => {
    close(simpson(G.gauss, -10, 10), 1, 1e-9)
    close(simpson(G.epan, -1, 1), 1, 1e-9)
    for (const s of seeds('G', 300)) {
      const p = G.sample(makeRng(s))
      const ans = answers(G.build(p))
      // a kernel density estimate integrates to one: check on a wide grid for the Gaussian version
      if (s.endsWith('0') || s.endsWith('7')) close(simpson((t) => G.kde(p.x, t, p.h, G.gauss), -30, 35, 6000), 1, 1e-6)
      let g = 0, e = 0
      for (const v of p.x) { const u = (p.x0 - v) / p.h; g += Math.exp(-u * u / 2) / Math.sqrt(2 * Math.PI); if (Math.abs(u) <= 1) e += 0.75 * (1 - u * u) }
      close(ans[0], g / (5 * p.h), 1e-12)
      close(ans[1], e / (5 * p.h), 1e-12)
      expect(ans[2]).toBe(p.x.filter((v) => Math.abs(v - p.x0) <= p.h).length)
      const mean = p.x.reduce((a, v) => a + v, 0) / 5
      close(ans[3], 1.06 * Math.sqrt(p.x.reduce((a, v) => a + (v - mean) ** 2, 0) / 4) * Math.pow(5, -0.2), 1e-12)
      close(ans[4], Math.exp(-0.8 * Math.log(p.m)), 1e-12)
    }
  })
})

// ---------- H ----------
describe('generator H against independent computation', () => {
  it('weighted least squares by elimination; local linear reproduces straight lines; box window counted (300 seeds)', () => {
    for (const s of seeds('H', 300)) {
      const p = H.sample(makeRng(s))
      const ans = answers(H.build(p))
      const w = p.x.map((v) => Math.exp(-0.5 * ((p.x0 - v) / p.h) ** 2))
      // weighted least squares for y = a + b (x - x0) via the 2x2 normal equations and Gaussian elimination
      const rows = [[0, 0, 0], [0, 0, 0]]
      p.x.forEach((v, i) => { const d = v - p.x0; rows[0][0] += w[i]; rows[0][1] += w[i] * d; rows[0][2] += w[i] * p.y[i]; rows[1][0] += w[i] * d; rows[1][1] += w[i] * d * d; rows[1][2] += w[i] * d * p.y[i] })
      const f = rows[1][0] / rows[0][0]
      const b = (rows[1][2] - f * rows[0][2]) / (rows[1][1] - f * rows[0][1])
      const a = (rows[0][2] - rows[0][1] * b) / rows[0][0]
      close(ans[1], a, 1e-9)
      const nwv = p.y.reduce((q, v, i) => q + w[i] * v, 0) / w.reduce((q, v) => q + v, 0)
      close(ans[0], nwv, 1e-12)
      close(ans[2], nwv - a, 1e-9)
      const inWin = p.x.map((v, i) => i).filter((i) => Math.abs(p.x[i] - p.x0) <= p.h)
      close(ans[3], inWin.reduce((q, i) => q + p.y[i], 0) / inWin.length, 1e-12)
      expect(ans[4]).toBe(inWin.length)
      // local linear regression reproduces a straight line exactly, whatever the weights
      const line = p.x.map((v) => 3 - 0.5 * v)
      close(H.localLinear(p.x, line, p.x0, p.h), 3 - 0.5 * p.x0, 1e-9)
    }
  })
})
