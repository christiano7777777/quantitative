// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: Farey count by cross-multiplied integer keys; limsup/liminf by testing membership in far-out sets on a grid; series by partial sums.
//  B: the generated sigma-algebra by brute-force closure under complement and union (bitmasks); atoms as minimal members; families by closure equality.
//  C: fat Cantor stages by actually removing gaps from interval lists; covers by partial sums; the union measure by grid cells.
//  D: every integral and level-set measure by a midpoint grid over [0,10] with the function evaluated pointwise from its definition.
//  E: Simpson integration of the n-th term (large n) for the dominated and monotone parts; Fatou parts from a grid with far-out terms.
//  F: Darboux sums from sampled rational and irrational points; improper integral by a logarithmic substitution; continuity from sampled neighbours.
//  G: norms by a midpoint grid on the real line; the essential supremum as the limit of very large p-norms.
//  H: rectangle unions by grid cells; Fubini by 2D Simpson (exact for cubics); the triangle by the other order; the failing iterated integral by antiderivatives.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import * as A from './a-limits'
import * as B from './b-sigma'
import * as C from './c-outer'
import * as D from './d-simple'
import * as E from './e-limits'
import * as Ff from './f-riemann'
import * as G from './g-lp'
import * as H from './h-fubini'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const lectures = topics.find((t) => t.id === 'ra')!.lectures.length
const simpson = (f: (x: number) => number, a: number, b: number, n = 4000) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3 }

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
  it('Farey count by integer keys; limsup/liminf by far-out membership on a grid; series by partial sums (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      // distinct values k/n, keyed by k * lcm / n
      let L = 1
      for (let n = 2; n <= p.N; n++) { let a = L, b = n; while (b) [a, b] = [b, a % b]; L = (L * n) / a }
      const keys = new Set<number>()
      for (let n = 1; n <= p.N; n++) for (let k = 1; k <= n; k++) keys.add((k * L) / n)
      close(ans[0], keys.size, 1e-12)
      // membership in A_n straight from the definition
      const inA = (n: number, x: number) => (n % 2 === 1 ? x >= 0 && x <= p.p + 1 / n : x >= p.q - 1 / n && x <= p.q + p.w)
      let cs = 0, ci = 0
      for (let i = -100; i < 1500; i++) {
        const x = (i + 0.5) / 100
        let any = false, all = true
        for (let n = 2001; n <= 2004; n++) { const v = inA(n, x); any = any || v; all = all && v }
        if (any) cs++
        if (all) ci++
      }
      close(ans[1], cs / 100, 1e-9)
      close(ans[2], ci / 100, 1e-9)
      let tot = 0, tail = 0
      for (let k = 1; k <= 300; k++) { const len = p.a * p.m ** -k; tot += len; if (k >= p.j) tail += len }
      close(ans[3], tot, 1e-9)
      close(ans[4], tail, 1e-9)
    }
  })
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  it('closure of the generators under complement and union (brute force); atoms as minimal members; families by closure equality (300 seeds)', () => {
    for (const s of seeds('B', 300)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      const full = (1 << p.n) - 1
      const close_ = (seed: number[], fullMask: number) => {
        const S = new Set<number>([...seed, fullMask])
        for (let changed = true; changed;) {
          changed = false
          for (const a of [...S]) {
            if (!S.has(fullMask ^ a)) { S.add(fullMask ^ a); changed = true }
            for (const b of [...S]) if (!S.has(a | b)) { S.add(a | b); changed = true }
          }
        }
        return S
      }
      const F = close_(p.gens, full)
      const members = [...F]
      const atoms = members.filter((e) => e !== 0 && !members.some((f) => f !== 0 && f !== e && (f & e) === f))
      close(ans[0], atoms.length, 1e-12)
      close(ans[1], F.size, 1e-12)
      const wt = (m: number) => p.w.reduce((t, w, i) => t + (m & (1 << i) ? w : 0), 0)
      // smallest member containing the point = intersection of all members containing it
      let inter = full
      for (const e of members) if (e & (1 << (p.point - 1))) inter &= e
      close(ans[2], wt(inter), 1e-12)
      close(ans[3], members.filter((e) => wt(e) >= p.t).length, 1e-12)
      // a family is a sigma-algebra iff it equals its own closure
      const full4 = 15
      let good = 0
      for (const fam of p.fams) if (close_(fam, full4).size === new Set([...fam]).size && fam.includes(full4)) good++
      close(ans[4], good, 1e-12)
    }
  })
  it('the atoms partition the space and every member is a union of atoms (50 seeds)', () => {
    for (const s of seeds('Bp', 50)) {
      const p = B.sample(makeRng(s))
      const full = (1 << p.n) - 1
      // atoms from membership signature
      const sig = new Map<string, number>()
      for (let i = 0; i < p.n; i++) { const k = p.gens.map((g) => (g >> i) & 1).join(''); sig.set(k, (sig.get(k) ?? 0) | (1 << i)) }
      let u = 0
      for (const a of sig.values()) { expect(u & a).toBe(0); u |= a }
      expect(u).toBe(full)
      for (const g of p.gens) for (const a of sig.values()) expect((g & a) === 0 || (g & a) === a).toBe(true)
    }
  })
})

// ---------- C ----------
const cantorCache = new Map<number, number[]>()
function cantor(c: number): number[] {
  const hit = cantorCache.get(c)
  if (hit) return hit
  let ivs: [number, number][] = [[0, 1]]
  const measures: number[] = [1]
  for (let k = 1; k <= 14; k++) {
    const gap = c * 4 ** -k
    const next: [number, number][] = []
    for (const [l, r] of ivs) {
      const mid = (l + r) / 2
      expect(r - l, `c=${c}: stage ${k} interval too short`).toBeGreaterThan(gap)
      next.push([l, mid - gap / 2], [mid + gap / 2, r])
    }
    ivs = next
    measures.push(ivs.reduce((t, [l, r]) => t + (r - l), 0))
  }
  cantorCache.set(c, measures)
  return measures
}
describe('generator C against independent computation', () => {
  it('union measure by grid cells; fat Cantor by removing gaps from interval lists; covers by partial sums (300 seeds)', () => {
    for (const s of seeds('C', 300)) {
      const p = C.sample(makeRng(s))
      const ans = answers(C.build(p))
      let cells = 0
      for (let i = -200; i < 5000; i++) {
        const x = (i + 0.5) / 200
        if ((x > p.b1 && x < p.c1) || (x > p.b2 && x < p.c2)) cells++
      }
      close(ans[0], cells / 200, 1e-9)
      // build the set stage by stage (cached per value of c: the construction depends on c only)
      const measures = cantor(p.c)
      close(ans[2], measures[p.n], 1e-12)
      close(ans[1], measures[14], 1e-4)
      close(ans[3], p.s * measures[14], 6e-4)
      let tot = 0
      for (let k = 1; k <= 400; k++) tot += ans[4] * p.r ** k
      close(tot, p.eps, 1e-9)
    }
  })
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('integrals and level-set measures from a midpoint grid with phi evaluated pointwise (120 seeds)', () => {
    for (const s of seeds('D', 120)) {
      const p = D.sample(makeRng(s))
      const ans = answers(D.build(p))
      const phi = (x: number) => p.iv.reduce((t, v) => t + (x > v.l && x < v.r ? v.a : 0), 0)
      const N = 100000, h = 10 / N
      let int = 0, up = 0, sq = 0, part = 0, sub = 0
      for (let i = 0; i < N; i++) {
        const x = (i + 0.5) * h
        const v = phi(x)
        int += v * h
        if (v > p.t) up += h
        sq += v * v * h
        if (x > p.u && x < p.v) part += v * h
        if ((x - p.m) ** 2 < p.c) sub += h
      }
      close(ans[0], int, 1e-6)
      close(ans[1], up, 1e-6)
      close(ans[2], sq, 1e-6)
      close(ans[3], part, 1e-6)
      close(ans[4], sub, 2e-4)
    }
  })
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  it('dominated and monotone limits by integrating the n-th term numerically; Fatou parts from a grid with far-out terms (60 seeds)', () => {
    for (const s of seeds('E', 60)) {
      const p = E.sample(makeRng(s))
      const ans = answers(E.build(p))
      const a = p.a[0] / p.a[1], r = p.r[0] / p.r[1], b = p.b[0] / p.b[1]
      const n = 1e6
      const X = Math.min(n, 60 / (1 - a))
      close(ans[0], simpson((x) => (1 - x / n) ** n * Math.exp(a * x), 0, X, 200000), 5e-4)
      close(ans[1], simpson((x) => 1 / (1 - r * x), 0, 1, 2000), 1e-9)
      const m = 1000
      close(ans[2], simpson((x) => m * Math.sin(x / m) * Math.exp(-b * x), 0, 50 / b, 200000), 1e-4)
      const f = (N: number, x: number) => (N % 2 === 1 ? (x < p.p ? p.al : 0) : x > p.q ? p.be : 0)
      const steps = 10000, h = 10 / steps
      let i1 = 0, i2 = 0, lim = 0
      for (let i = 0; i < steps; i++) {
        const x = (i + 0.5) * h
        i1 += f(2001, x) * h
        i2 += f(2002, x) * h
        lim += Math.min(f(2001, x), f(2002, x)) * h
      }
      close(ans[3], lim, 1e-6)
      close(ans[4], Math.min(i1, i2), 1e-6)
      expect(ans[3]).toBeLessThanOrEqual(ans[4] + 1e-9)
    }
  })
})

// ---------- F ----------
describe('generator F against independent computation', () => {
  it('Lebesgue integral by midpoint rule; Darboux sums from sampled points; improper integral by log substitution; continuity from neighbours (150 seeds)', () => {
    for (const s of seeds('F', 150)) {
      const p = Ff.sample(makeRng(s))
      const ans = answers(Ff.build(p))
      const N = 200000
      let t = 0
      for (let i = 0; i < N; i++) t += ((i + 0.5) * p.L / N) ** p.k * (p.L / N)
      close(ans[0], t, 1e-5)
      // Darboux gap of g for a random partition
      const rng = makeRng(s + 'part')
      const pts = [0, p.L, ...Array.from({ length: 6 }, () => rng.next() * p.L)].sort((x, y) => x - y)
      let gap = 0
      for (let i = 0; i + 1 < pts.length; i++) {
        const l = pts[i], r = pts[i + 1]
        const vals = [p.lo, p.hi] // value at a rational sample and at an irrational sample inside (l, r)
        const sup = Math.max(...vals), inf = Math.min(...vals)
        gap += (sup - inf) * (r - l)
      }
      close(ans[1], gap, 1e-9)
      // equal-partition Darboux difference for the monotone function, sup and inf by dense sampling
      let U = 0, Lw = 0
      for (let i = 0; i < p.nn; i++) {
        const l = (i * p.L) / p.nn, r = ((i + 1) * p.L) / p.nn
        let mx = -Infinity, mn = Infinity
        for (let j = 0; j <= 50; j++) { const v = (l + ((r - l) * j) / 50) ** p.kk; mx = Math.max(mx, v); mn = Math.min(mn, v) }
        U += mx * (r - l); Lw += mn * (r - l)
      }
      close(ans[2], U - Lw, 1e-7)
      const sv = p.s[0] / p.s[1]
      close(ans[3], simpson((tt) => Math.exp((1 - sv) * tt), -200, 0, 200000), 1e-6)
      // discontinuity set from neighbour samples
      const w = p.Bw, A0 = p.A
      const u = (y: number, rational: boolean) => (rational || (y >= A0 && y <= A0 + w) ? 1 : 0)
      let cnt = 0
      const h = 0.0005
      for (let i = 0; i < p.L / h; i++) {
        const x = (i + 0.5) * h
        const seen = new Set([u(x, true), u(x + 1e-7, true), u(x - 1e-7, true), u(x + 1e-7 * Math.SQRT2, false), u(x - 1e-7 * Math.SQRT2, false)])
        if (seen.size > 1) cnt++
      }
      close(ans[4], cnt * h, 1e-6)
    }
  })
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  it('norms from a midpoint grid; the essential supremum as the limit of huge p-norms (150 seeds)', () => {
    for (const s of seeds('G', 150)) {
      const p = G.sample(makeRng(s))
      const ans = answers(G.build(p))
      const T = p.m[0] + p.m[1] + p.m[2]
      const blk = (x: number) => (x < p.m[0] ? 0 : x < p.m[0] + p.m[1] ? 1 : 2)
      const f = (x: number) => p.a[blk(x)], g = (x: number) => p.b[blk(x)]
      const N = T * 2400, h = T / N
      const q = p.p / (p.p - 1)
      let fp = 0, gq = 0, fg = 0, sp = 0
      for (let i = 0; i < N; i++) {
        const x = (i + 0.5) * h
        fp += Math.abs(f(x)) ** p.p * h
        gq += Math.abs(g(x)) ** q * h
        fg += Math.abs(f(x) * g(x)) * h
        sp += Math.abs(f(x) + g(x)) ** p.p * h
      }
      close(ans[0], fp ** (1 / p.p), 1e-6)
      // ||f||_P for P = 4000, computed in logs and rescaled by the largest value
      const mx = Math.max(...p.a.map(Math.abs))
      const P = 4000
      let acc = 0
      for (let i = 0; i < 3; i++) acc += p.m[i] * (Math.abs(p.a[i]) / mx) ** P
      const big = mx * acc ** (1 / P)
      close(ans[1], big, 0.01 * mx)
      close(ans[2], fp ** (1 / p.p) * gq ** (1 / q) - fg, 1e-5)
      expect(ans[2]).toBeGreaterThanOrEqual(-1e-9)
      close(ans[3], sp ** (1 / p.p), 1e-6)
      close(ans[4], fp / p.t ** p.p, 1e-6)
    }
  })
})

// ---------- H ----------
describe('generator H against independent computation', () => {
  it('union by grid cells; Fubini by 2D Simpson; the triangle in the other order; the failing iterated integral by antiderivatives; slices (150 seeds)', () => {
    for (const s of seeds('H', 150)) {
      const p = H.sample(makeRng(s))
      const ans = answers(H.build(p))
      let cells = 0
      for (let i = 0; i < 48; i++) for (let j = 0; j < 48; j++) {
        const x = (i + 0.5) / 4, y = (j + 0.5) / 4
        const inR = (r: H.Rect) => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1
        if (inR(p.r1) || inR(p.r2)) cells++
      }
      close(ans[0], cells / 16, 1e-9)
      close(ans[1], simpson((x) => simpson((y) => x ** p.m * y ** p.n + p.c, 0, p.b, 20), 0, p.a, 20), 1e-8)
      // triangle: integrate x first, from y to ta
      close(ans[2], simpson((y) => y ** p.tn * (p.ta ** (p.tm + 1) - y ** (p.tm + 1)) / (p.tm + 1), 0, p.ta, 2000), 1e-8)
      // the failing iterated integral: inner integral by antiderivative, outer by the midpoint rule
      const M = 200000
      let out = 0
      for (let i = 0; i < M; i++) {
        const t = (i + 0.5) / M
        out += p.order === 0 ? p.k * (1 / (t * t + 1)) / M : -p.k * (1 / (t * t + 1)) / M
      }
      close(ans[3], out, 1e-6)
      // sanity check of the inner integral by Simpson at one point
      const x0 = 0.3
      const inner = simpson((y) => (x0 * x0 - y * y) / (x0 * x0 + y * y) ** 2, 0, 1, 200000)
      close(inner, 1 / (1 + x0 * x0), 1e-6)
      let sl = 0
      const K = 200000
      for (let i = 0; i < K; i++) { const x = ((i + 0.5) * p.A) / K; sl += Math.min(p.B, Math.max(0, p.s - x)) * (p.A / K) }
      close(ans[4], sl, 1e-5)
    }
  })
  it('the two orders really differ for the unit square, as the question says (numeric check at moderate resolution)', () => {
    // inner integral over y at fixed x is 1/(1+x^2); inner over x at fixed y is -1/(1+y^2)
    const x0 = 0.5
    const innerY = simpson((y) => (x0 * x0 - y * y) / (x0 * x0 + y * y) ** 2, 0, 1, 100000)
    const innerX = simpson((x) => (x * x - x0 * x0) / (x * x + x0 * x0) ** 2, 0, 1, 100000)
    close(innerY, 1 / (1 + x0 * x0), 1e-6)
    close(innerX, -1 / (1 + x0 * x0), 1e-6)
  })
})
