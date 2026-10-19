// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: exact binomial in fractions; W+ and its moments from all 2^8 sign patterns; the efficiency constant by numerical integration of the normal density.
//  B: U by counting pairs; the null variance of U by enumerating every assignment; the average of H and of the Friedman statistic over all arrangements equals k-1.
//  C: the supremum of |F_n - F_0| found on a fine grid.
//  D: Pearson correlation of ranks, and Kendall's tau by counting pairs.
//  E: the 20 assignments enumerated with bitmasks and exact fractions.
//  F: jackknife bias of the squared mean equals s^2/n exactly; the inclusion probability by exact enumeration of resamples.
//  G: kernel densities integrate to one numerically; the Epanechnikov window counted directly.
//  H: weighted least squares solved by elimination; local linear fits reproduce straight lines exactly.
//  I: order-statistic probabilities by exact enumeration of the 2^n below/above patterns; the Beta mean by numerical integration; median-interval coverage by enumeration and by simulation.
//  J: the plug-in variance from the unbiased one; the influence value as a numerical derivative of the functional at a contaminated empirical distribution; the DKW constants by solving the bound; a simulation of the bound.
//  K: Kendall distance by bubble-sort swaps, Spearman by lookup; Mallows probability from all 24 rankings in exact fractions; Plackett-Luce by exact marginals and an exponential-race simulation; Borda by counting items ranked below.
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
import * as I from './i-orderstat'
import * as J from './j-functional'
import * as K from './k-ranking'
import * as L from './l-intro'
import * as M from './m-sign'
import * as N from './n-cicdf'
import * as O from './o-hl'
import * as P from './p-scale'
import * as Q from './q-kw'
import * as R from './r-mult'
import * as S from './s-block'
import * as T from './t-bootci'
import * as U from './u-pivotal'
import * as V from './v-bootreg'
import * as W from './w-signci'
import * as Lec2 from './lec2'
import * as Lec3 from './lec3'
import * as Lec4 from './lec4'
import * as Lec5 from './lec5'
import * as Lec6 from './lec6'
import * as Lec7 from './lec7'
import * as Lec8 from './lec8'
import * as Lec9 from './lec9'
import * as Lec10 from './lec10'
import * as Lec11 from './lec11'
import * as Lec12 from './lec12'

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
  ['I', { id: 'I', generate: (r) => I.build(I.sample(r)) }, 5],
  ['J', { id: 'J', generate: (r) => J.build(J.sample(r)) }, 5],
  ['K', { id: 'K', generate: (r) => K.build(K.sample(r)) }, 5],
  ['L', { id: 'L', generate: (r) => L.build(L.sample(r)) }, 5],
  ['M', { id: 'M', generate: (r) => M.build(M.sample(r)) }, 5],
  ['N', { id: 'N', generate: (r) => N.build(N.sample(r)) }, 5],
  ['O', { id: 'O', generate: (r) => O.build(O.sample(r)) }, 5],
  ['P', { id: 'P', generate: (r) => P.build(P.sample(r)) }, 5],
  ['Q', { id: 'Q', generate: (r) => Q.build(Q.sample(r)) }, 5],
  ['R', { id: 'R', generate: (r) => R.build(R.sample(r)) }, 5],
  ['S', { id: 'S', generate: (r) => S.build(S.sample(r)) }, 5],
  ['T', { id: 'T', generate: (r) => T.build(T.sample(r)) }, 5],
  ['U', { id: 'U', generate: (r) => U.build(U.sample(r)) }, 5],
  ['V', { id: 'V', generate: (r) => V.build(V.sample(r)) }, 5],
  ['W', { id: 'W', generate: (r) => W.build(W.sample(r)) }, 6],
  ['Lec2', { id: 'Lec2', generate: (r) => Lec2.build(Lec2.sample(r)) }, 6],
  ['Lec3', { id: 'Lec3', generate: (r) => Lec3.build(Lec3.sample(r)) }, 6],
  ['Lec4', { id: 'Lec4', generate: (r) => Lec4.build(Lec4.sample(r)) }, 6],
  ['Lec5', { id: 'Lec5', generate: (r) => Lec5.build(Lec5.sample(r)) }, 6],
  ['Lec6', { id: 'Lec6', generate: (r) => Lec6.build(Lec6.sample(r)) }, 6],
  ['Lec7', { id: 'Lec7', generate: (r) => Lec7.build(Lec7.sample(r)) }, 6],
  ['Lec8', { id: 'Lec8', generate: (r) => Lec8.build(Lec8.sample(r)) }, 6],
  ['Lec9', { id: 'Lec9', generate: (r) => Lec9.build(Lec9.sample(r)) }, 6],
  ['Lec10', { id: 'Lec10', generate: (r) => Lec10.build(Lec10.sample(r)) }, 5],
  ['Lec11', { id: 'Lec11', generate: (r) => Lec11.build(Lec11.sample(r)) }, 5],
  ['Lec12', { id: 'Lec12', generate: (r) => Lec12.build(Lec12.sample(r)) }, 6],
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

// ---------- I ----------
describe('generator I against independent computation', () => {
  it('order-statistic probabilities by enumerating every below/above pattern in exact fractions; Beta mean by integration; coverage by enumeration (300 seeds)', () => {
    const cnt = (mask: number) => { let c = 0; for (let m = mask; m; m >>= 1) c += m & 1; return c }
    const probAtLeast = (n: number, k: number, c10: number) => {
      // each observation is <= c with probability c10/10; sum the probabilities of all patterns with at least k below
      let tot = F(0)
      for (let mask = 0; mask < 1 << n; mask++) {
        if (cnt(mask) < k) continue
        let pr = F(1)
        for (let i = 0; i < n; i++) pr = pr.mul(mask & (1 << i) ? F(c10, 10) : F(10 - c10, 10))
        tot = tot.add(pr)
      }
      return tot.num
    }
    for (const s of seeds('I', 300)) {
      const p = I.sample(makeRng(s))
      const ans = answers(I.build(p))
      const n = p.n
      close(ans[0], probAtLeast(n, n, Math.round(p.cMax * 10)), 1e-12) // maximum <= c: all below
      close(ans[1], probAtLeast(n, 1, Math.round(p.cMin * 10)), 1e-12) // minimum <= c: at least one below
      close(ans[2], probAtLeast(n, p.k, Math.round(p.cK * 10)), 1e-12)
      // E X_(k) by integrating x times the density n!/((k-1)!(n-k)!) x^(k-1) (1-x)^(n-k)
      const fact = (m: number) => { let r = 1; for (let i = 2; i <= m; i++) r *= i; return r }
      const dens = (x: number) => (fact(n) / (fact(p.k - 1) * fact(n - p.k))) * x ** (p.k - 1) * (1 - x) ** (n - p.k)
      close(ans[3], simpson((x) => x * dens(x), 0, 1, 2000), 1e-9)
      close(simpson(dens, 0, 1, 2000), 1, 1e-9)
      // coverage of (X_(r), X_(n+1-r)) for the median: count patterns of "below the median" (probability 1/2 each)
      let good = 0
      for (let mask = 0; mask < 1 << n; mask++) { const below = cnt(mask); if (below >= p.r && below <= n - p.r) good++ }
      close(ans[4], good / 2 ** n, 1e-12)
    }
  })
  it('simulated uniform samples agree with the probabilities and the coverage', () => {
    const rng = makeRng('simI')
    for (const n of [6, 8, 10]) for (const r of [2, 3]) {
      const p: I.Params = { n, cMax: 0.8, cMin: 0.2, k: 3, cK: 0.5, r }
      const ans = answers(I.build(p))
      const T = 60000
      const hit = [0, 0, 0, 0, 0]
      for (let t = 0; t < T; t++) {
        const x = Array.from({ length: n }, () => rng.next()).sort((a, b) => a - b)
        if (x[n - 1] <= 0.8) hit[0]++
        if (x[0] <= 0.2) hit[1]++
        if (x[2] <= 0.5) hit[2]++
        hit[3] += x[2]
        if (x[r - 1] < 0.5 && 0.5 < x[n - r]) hit[4]++
      }
      for (const i of [0, 1, 2, 3, 4]) close(hit[i] / T, ans[i], 0.01)
    }
  })
})

// ---------- J ----------
describe('generator J against independent computation', () => {
  it('plug-in variance from the unbiased one; influence value as a numerical derivative of the functional; DKW constants (300 seeds)', () => {
    for (const s of seeds('J', 300)) {
      const p = J.sample(makeRng(s))
      const ans = answers(J.build(p))
      const n = p.x.length
      const mean = p.x.reduce((a, v) => a + v, 0) / n
      const unb = p.x.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1)
      close(ans[1], unb * ((n - 1) / n), 1e-9)
      expect(ans[0] * n).toBeCloseTo(p.x.filter((v) => v > p.a && v <= p.b).length, 9)
      // T((1-e) Fn + e delta_x0) for the variance functional, as a weighted variance; derivative at e = 0
      const T = (e: number) => {
        const pts = [...p.x, p.x0], wts = [...p.x.map(() => (1 - e) / n), e]
        const m = pts.reduce((a, v, i) => a + v * wts[i], 0)
        return pts.reduce((a, v, i) => a + wts[i] * (v - m) ** 2, 0)
      }
      close(ans[2], (T(1e-7) - T(0)) / 1e-7, 1e-3)
      // the DKW half-width solves 2 exp(-2 N eps^2) = alpha
      close(2 * Math.exp(-2 * p.N * ans[3] ** 2), p.alpha, 1e-12)
      // the smallest n with 2 exp(-2 n eps0^2) <= alpha
      const bound = (m: number) => 2 * Math.exp(-2 * m * p.eps0 ** 2)
      expect(bound(ans[4])).toBeLessThanOrEqual(p.alpha + 1e-12)
      expect(bound(ans[4] - 1)).toBeGreaterThan(p.alpha)
    }
  })
  it('the DKW band holds at least as often as claimed in simulation', () => {
    const rng = makeRng('simJ')
    for (const [N, alpha] of [[20, 0.05], [50, 0.1]] as [number, number][]) {
      const eps = answers(J.build({ x: [1, 2, 3, 4, 5, 6], a: 3, b: 5, x0: 20, alpha, N, eps0: 0.1 }))[3]
      let bad = 0
      const T = 5000
      for (let t = 0; t < T; t++) {
        const u = Array.from({ length: N }, () => rng.next()).sort((a, b) => a - b)
        let sup = 0
        u.forEach((v, i) => { sup = Math.max(sup, Math.abs((i + 1) / N - v), Math.abs(i / N - v)) })
        if (sup > eps) bad++
      }
      expect(bad / T).toBeLessThanOrEqual(alpha)
    }
  })
})

// ---------- K ----------
describe('generator K against independent computation', () => {
  const perms = (xs: number[]): number[][] => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((r) => [x, ...r])))
  const all = perms([0, 1, 2, 3])
  // Kendall distance as the number of adjacent swaps bubble sort needs to turn `a` into `b`
  const swaps = (a: number[], b: number[]) => {
    const seq = a.map((item) => b.indexOf(item))
    let c = 0
    for (let pass = 0; pass < seq.length; pass++) for (let i = 0; i + 1 < seq.length; i++) if (seq[i] > seq[i + 1]) { [seq[i], seq[i + 1]] = [seq[i + 1], seq[i]]; c++ }
    return c
  }
  const plProb = (r: number[], w: number[]) => { let pr = F(1); r.forEach((item, t) => { pr = pr.mul(F(w[item], r.slice(t).reduce((s, j) => s + w[j], 0))) }); return pr }
  it('distances, Mallows probability from all 24 rankings, Plackett-Luce, Borda (300 seeds)', () => {
    expect(all).toHaveLength(24)
    for (const s of seeds('K', 300)) {
      const p = K.sample(makeRng(s))
      const ans = answers(K.build(p))
      expect(ans[0]).toBe(swaps(p.pi, p.centre))
      expect(ans[1]).toBe([0, 1, 2, 3].reduce((a, i) => a + (p.pi.indexOf(i) - p.centre.indexOf(i)) ** 2, 0))
      // Mallows: normalise over every ranking
      const q = F(p.q[0], p.q[1])
      const qd = (d: number) => { let r = F(1); for (let i = 0; i < d; i++) r = r.mul(q); return r }
      const Z = all.reduce((a, r) => a.add(qd(swaps(r, p.centre))), F(0))
      close(ans[2], qd(swaps(p.pi, p.centre)).div(Z).num, 1e-12)
      // Plackett-Luce: exact product, probabilities of all rankings sum to one, first-place marginal is w_i / W
      close(ans[3], plProb(p.pi, p.w).num, 1e-12)
      expect(all.reduce((a, r) => a.add(plProb(r, p.w)), F(0)).num).toBeCloseTo(1, 12)
      const W = p.w.reduce((a, v) => a + v, 0)
      for (let i = 0; i < 4; i++) close(all.filter((r) => r[0] === i).reduce((a, r) => a.add(plProb(r, p.w)), F(0)).num, p.w[i] / W, 1e-12)
      // Borda: for each voter count the items ranked below the chosen item
      expect(ans[4]).toBe(p.voters.reduce((a, v) => a + v.slice(v.indexOf(p.item) + 1).length, 0))
    }
  })
  it('Plackett-Luce probabilities agree with an exponential-race simulation; a Mallows ranking is most likely at the centre', () => {
    const rng = makeRng('simK')
    const w = [1, 2, 3, 4]
    const T = 200000
    const counts = new Map<string, number>()
    for (let t = 0; t < T; t++) {
      const times = w.map((wi) => -Math.log(1 - rng.next()) / wi)
      const key = [0, 1, 2, 3].sort((a, b) => times[a] - times[b]).join('')
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    for (const r of [[3, 2, 1, 0], [0, 1, 2, 3], [2, 3, 1, 0], [1, 0, 3, 2]]) {
      const p = K.sample(makeRng('fixed'))
      const got = answers(K.build({ ...p, pi: r, w }))[3]
      close((counts.get(r.join('')) ?? 0) / T, got, 0.003)
    }
    const pc = K.sample(makeRng('c'))
    close(answers(K.build({ ...pc, pi: pc.centre, q: [1, 2] }))[2], 1 / (1 * 1.5 * 1.75 * 1.875), 1e-12)
  })
})
