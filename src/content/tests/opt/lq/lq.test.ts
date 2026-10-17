// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: basic feasible solutions of the slack form by exact fractions (generator: line intersections); optimal value from the DUAL by enumerating dual basic solutions.
//  B: Phase I run on a full exact tableau (generator: closed forms); optimal cost from basic solutions of the standard form.
//  C: shadow prices by finite differences of the re-solved LP; dual optimum by dual vertex enumeration; both ranges by bisection on the re-solved LP.
//  D: capacities read back from the printed text; maximum flow as the minimum over ALL 16 cuts (generator: augmenting paths); the exchange cycle in exact fractions and by Bellman-Ford.
//  E: relaxation and branch bounds by ternary search on a concave profile; Gomory row by exact inversion and its VALIDITY over all integer points; integer optimum by brute force over the grid.
//  F: eigenvalues as extreme Rayleigh quotients; minimum by gradient descent; line-search step by golden-section search.
//  G: the constrained minimum by golden-section search along the boundary line plus random feasible points; the multiplier from the gradient; the dual function by separable minimisation and by maximising over lambda.
//  H: exact Gauss-Jordan solve of the Lagrange system; nested ternary search over the two free weights; exact quadratic forms.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { F, Fr, solveFr } from '../../../shared/fraction'
import * as A from './a-graphical'
import * as B from './b-twophase'
import * as C from './c-duality'
import * as D from './d-network'
import * as E from './e-integer'
import * as Fq from './f-quadratic'
import * as G from './g-kkt'
import * as H from './h-portfolio'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const lectures = topics.find((t) => t.id === 'opt')!.lectures.length

const gens: [string, LQGenerator, number][] = [
  ['A', { id: 'A', generate: (r) => A.build(A.sample(r)) }, 5],
  ['B', { id: 'B', generate: (r) => B.build(B.sample(r)) }, 5],
  ['C', { id: 'C', generate: (r) => C.build(C.sample(r)) }, 5],
  ['D', { id: 'D', generate: (r) => D.build(D.sample(r)) }, 5],
  ['E', { id: 'E', generate: (r) => E.build(E.sample(r)) }, 5],
  ['F', { id: 'F', generate: (r) => Fq.build(Fq.sample(r)) }, 5],
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
        expect(/[\u0000-\u001f\u007f]/.test(text.replace(/\n/g, ' ')), `${s}: control character in ${JSON.stringify(text)}`).toBe(false)
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
  for (const [name, gen] of gens) for (const s of seeds(name, 40)) gen.generate(makeRng(s)).parts.forEach((p) => seen.add(p.lecture))
  expect([...seen].sort((a, b) => a - b)).toEqual(Array.from({ length: lectures }, (_, i) => i + 1))
})

// ---------- shared helpers ----------
/** All k-subsets of 0..n-1. */
function subsets(n: number, k: number): number[][] {
  const out: number[][] = []
  const rec = (start: number, cur: number[]) => {
    if (cur.length === k) { out.push([...cur]); return }
    for (let i = start; i < n; i++) { cur.push(i); rec(i + 1, cur); cur.pop() }
  }
  rec(0, [])
  return out
}

/** Basic solutions of M z = rhs (m rows, n columns) in exact arithmetic; only the non-negative ones are returned. */
function basicSolutions(M: Fr[][], rhs: Fr[]): { z: Fr[]; basis: number[] }[] {
  const m = M.length, n = M[0].length
  const out: { z: Fr[]; basis: number[] }[] = []
  for (const basis of subsets(n, m)) {
    let sol: Fr[]
    try { sol = solveFr(M.map((row) => basis.map((j) => row[j])), rhs) } catch { continue }
    if (sol.some((v) => v.n < 0n)) continue
    const z = Array.from({ length: n }, () => F(0))
    basis.forEach((j, i) => { z[j] = sol[i] })
    out.push({ z, basis })
  }
  return out
}

const sum = (xs: Fr[]) => xs.reduce((a, v) => a.add(v), F(0))
const dotFr = (u: Fr[], v: Fr[]) => sum(u.map((x, i) => x.mul(v[i])))

/** Float LP over {A x <= b, x >= 0} (two variables) by brute-force vertex enumeration, maximising c.x. */
function lpOpt(c: number[], A2: number[][], b: number[]) {
  const lines = [...A2.map((r, i) => [r[0], r[1], b[i]]), [-1, 0, 0], [0, -1, 0]]
  let best = { val: -Infinity, pt: [0, 0] }
  for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) {
    const det = lines[i][0] * lines[j][1] - lines[j][0] * lines[i][1]
    if (Math.abs(det) < 1e-12) continue
    const x = (lines[i][2] * lines[j][1] - lines[j][2] * lines[i][1]) / det
    const y = (lines[i][0] * lines[j][2] - lines[j][0] * lines[i][2]) / det
    if (lines.every((l) => l[0] * x + l[1] * y <= l[2] + 1e-9)) {
      const v = c[0] * x + c[1] * y
      if (v > best.val) best = { val: v, pt: [x, y] }
    }
  }
  return best
}

const ternaryMax = (f: (t: number) => number, lo: number, hi: number, iters = 120) => {
  for (let i = 0; i < iters; i++) {
    const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3
    if (f(m1) < f(m2)) lo = m1; else hi = m2
  }
  return (lo + hi) / 2
}
const goldenMin = (f: (t: number) => number, lo: number, hi: number) => ternaryMax((t) => -f(t), lo, hi)

// ---------- A ----------
describe('generator A against independent computation', () => {
  it('basic feasible solutions of the slack form in exact fractions; optimal value from the dual (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      // slack form [A | I] z = r, z = (x, y, s1, s2, s3)
      const M = p.cons.map((k, i) => [F(k.a[0]), F(k.a[1]), ...[0, 1, 2].map((j) => F(i === j ? 1 : 0))])
      const bfs = basicSolutions(M, p.cons.map((k) => F(k.r)))
      const objs = bfs.map((b) => F(p.c[0]).mul(b.z[0]).add(F(p.c[1]).mul(b.z[1])))
      expect(ans[2], s).toBe(bfs.length)
      const order = objs.map((_, i) => i).sort((i, j) => objs[j].cmp(objs[i]))
      const bestI = order[0]
      close(ans[0], objs[bestI].num)
      close(ans[1], bfs[bestI].z[0].num)
      close(ans[4], objs[order[1]].num)
      const positive = [2, 3, 4].filter((j) => !bfs[bestI].z[j].zero)
      expect(positive, s).toHaveLength(1)
      close(ans[3], bfs[bestI].z[positive[0]].num)
      // dual: min r.u subject to A^T u - v = c, u, v >= 0 (basic solutions of the dual in exact fractions)
      const Md = [0, 1].map((j) => [...p.cons.map((k) => F(k.a[j])), ...[0, 1].map((i) => F(i === j ? -1 : 0))])
      const dual = basicSolutions(Md, p.c.map((v) => F(v)))
      const dmin = dual.map((d) => dotFr(p.cons.map((k) => F(k.r)), d.z.slice(0, 3))).reduce((a, v) => (v.cmp(a) < 0 ? v : a))
      close(ans[0], dmin.num)
    }
  })
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  it('Phase I on a full exact tableau; optimal cost from basic solutions of the standard form (300 seeds)', () => {
    for (const s of seeds('B', 300)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      // columns x1, x2, s1, s2, t1, t2 | rhs
      const T: Fr[][] = p.rows.map((q, i) => [F(q.a), F(q.b), F(i === 0 ? -1 : 0), F(i === 1 ? -1 : 0), F(i === 0 ? 1 : 0), F(i === 1 ? 1 : 0), F(q.r)])
      const cost = [F(0), F(0), F(0), F(0), F(1), F(1)]
      const basis = [4, 5]
      const wVal = () => T.reduce((a, row, i) => a.add(cost[basis[i]].mul(row[6])), F(0))
      expect(ans[0], s).toBe(wVal().num)
      const reduced = (j: number) => T.reduce((a, row, i) => a.sub(cost[basis[i]].mul(row[j])), cost[j])
      let enter = 0
      for (let j = 1; j < 4; j++) if (reduced(j).cmp(reduced(enter)) < 0) enter = j
      expect(ans[1], s).toBe(enter + 1)
      let leave = -1
      let theta = F(0)
      for (let i = 0; i < 2; i++) {
        if (T[i][enter].n <= 0n) continue
        const r = T[i][6].div(T[i][enter])
        if (leave < 0 || r.cmp(theta) < 0) { theta = r; leave = i }
      }
      close(ans[2], theta.num)
      // pivot
      const piv = T[leave][enter]
      T[leave] = T[leave].map((v) => v.div(piv))
      for (let i = 0; i < 2; i++) if (i !== leave && !T[i][enter].zero) { const f = T[i][enter]; T[i] = T[i].map((v, k) => v.sub(f.mul(T[leave][k]))) }
      basis[leave] = enter
      close(ans[3], wVal().num)
      // standard-form basic solutions: [rows | surplus] z = r with z = (x1, x2, s1, s2)
      const M = p.rows.map((q, i) => [F(q.a), F(q.b), F(i === 0 ? -1 : 0), F(i === 1 ? -1 : 0)])
      const bfs = basicSolutions(M, p.rows.map((q) => F(q.r)))
      const costs = bfs.map((b) => F(p.c[0]).mul(b.z[0]).add(F(p.c[1]).mul(b.z[1])))
      close(ans[4], costs.reduce((a, v) => (v.cmp(a) < 0 ? v : a)).num)
    }
  })
})

// ---------- C ----------
describe('generator C against independent computation', () => {
  it('finite-difference shadow prices, dual vertex enumeration, ranges by bisection (150 seeds)', () => {
    for (const s of seeds('C', 150)) {
      const p = C.sample(makeRng(s))
      const ans = answers(C.build(p))
      const solve = (b: number[], c: number[] = p.c) => lpOpt(c, p.A, b)
      const base = solve(p.b)
      close(ans[2], base.val, 1e-7)
      const h = 1e-4
      close(ans[0], (solve([p.b[0] + h, p.b[1]]).val - base.val) / h, 1e-5)
      close(ans[1], (solve([p.b[0], p.b[1] + h]).val - base.val) / h, 1e-5)
      // dual: min b.y s.t. A^T y >= c, y >= 0, by vertex enumeration (written as a max problem for -b.y)
      const lines = [[-p.A[0][0], -p.A[1][0], -p.c[0]], [-p.A[0][1], -p.A[1][1], -p.c[1]], [-1, 0, 0], [0, -1, 0]]
      let dmin = Infinity
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
        const det = lines[i][0] * lines[j][1] - lines[j][0] * lines[i][1]
        if (Math.abs(det) < 1e-12) continue
        const y1 = (lines[i][2] * lines[j][1] - lines[j][2] * lines[i][1]) / det
        const y2 = (lines[i][0] * lines[j][2] - lines[j][0] * lines[i][2]) / det
        if (lines.every((l) => l[0] * y1 + l[1] * y2 <= l[2] + 1e-9)) dmin = Math.min(dmin, p.b[0] * y1 + p.b[1] * y2)
      }
      close(ans[2], dmin, 1e-7)
      // b1 range: the optimal value stays on the line z + y1 (b1' - b1) exactly as long as the basis is feasible
      const linear = (b1: number) => Math.abs(solve([b1, p.b[1]]).val - (base.val + ans[0] * (b1 - p.b[0]))) < 1e-7
      expect(linear(p.b[0] + 1e-3)).toBe(true)
      let lo = p.b[0], hi = p.b[0] + 500
      expect(linear(hi)).toBe(false)
      for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (linear(mid)) lo = mid; else hi = mid }
      close(ans[3], lo, 1e-5)
      // c1 range: the same vertex stays optimal as long as the re-solved optimum equals c'.x*
      const stays = (c1: number) => Math.abs(solve(p.b, [c1, p.c[1]]).val - (c1 * base.pt[0] + p.c[1] * base.pt[1])) < 1e-7
      expect(stays(p.c[0])).toBe(true)
      lo = p.c[0]; hi = p.c[0] + 500
      expect(stays(hi)).toBe(false)
      for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (stays(mid)) lo = mid; else hi = mid }
      close(ans[4], lo, 1e-5)
    }
  })
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('capacities parsed from the text; max flow as the minimum over all cuts; the exchange cycle exactly and by Bellman-Ford (300 seeds)', () => {
    const idx: Record<string, number> = { s: 0, a: 1, b: 2, c: 3, d: 4, t: 5 }
    for (const s of seeds('D', 300)) {
      const p = D.sample(makeRng(s))
      const inst = D.build(p)
      const ans = answers(inst)
      const cap = Array.from({ length: 6 }, () => new Array<number>(6).fill(0))
      for (const m of inst.intro.matchAll(/\$([sabcdt])\\to ([sabcdt]):(\d+)\$/g)) cap[idx[m[1]]][idx[m[2]]] = +m[3]
      expect(cap.flat().filter((v) => v > 0)).toHaveLength(8)
      // minimum over all 2^4 cuts (s on the source side, t on the sink side)
      const minCut = (c: number[][]) => {
        let best = Infinity
        for (let mask = 0; mask < 16; mask++) {
          const inS = [true, ...[0, 1, 2, 3].map((k) => Boolean((mask >> k) & 1)), false]
          let tot = 0
          for (let u = 0; u < 6; u++) for (let v = 0; v < 6; v++) if (inS[u] && !inS[v]) tot += c[u][v]
          best = Math.min(best, tot)
        }
        return best
      }
      // the cut of part 1: its set is printed in the prompt
      const names = inst.parts[0].prompt.match(/\\\{([^}]*)\\\}/)![1].split(',')
      const inS = ['s', 'a', 'b', 'c', 'd', 't'].map((n) => names.includes(n))
      let cut = 0
      for (let u = 0; u < 6; u++) for (let v = 0; v < 6; v++) if (inS[u] && !inS[v]) cut += cap[u][v]
      expect(ans[0], s).toBe(cut)
      expect(ans[1], s).toBe(minCut(cap))
      const em = inst.parts[2].prompt.match(/edge \$([sabcdt])\\to ([sabcdt])\$ is raised by (\d+)/)!
      const cap2 = cap.map((r) => [...r])
      cap2[idx[em[1]]][idx[em[2]]] += +em[3]
      expect(ans[2], s).toBe(minCut(cap2))
      expect(ans[2]).not.toBe(ans[1])
      // exchange cycle in exact fractions
      const rates = [...inst.intro.matchAll(/buys \$([0-9.]+)\$/g)].map((m) => m[1])
      expect(rates).toHaveLength(3)
      const fr = rates.map((r) => F(Math.round(parseFloat(r) * 1000), 1000))
      let amount = F(1000)
      for (const r of fr) amount = amount.mul(r)
      close(ans[3], amount.num, 1e-9)
      expect(amount.cmp(F(1000))).toBeGreaterThan(0)
      // Bellman-Ford on weights -ln r: a negative cycle exists and the cycle weight is the answer
      const w = fr.map((r) => -Math.log(r.num))
      const edges: [number, number, number][] = [[0, 1, w[0]], [1, 2, w[1]], [2, 0, w[2]]]
      const dist = [0, 0, 0]
      for (let it = 0; it < 3; it++) for (const [u, v, wt] of edges) if (dist[u] + wt < dist[v]) dist[v] = dist[u] + wt
      expect(edges.some(([u, v, wt]) => dist[u] + wt < dist[v] - 1e-12), s).toBe(true)
      close(ans[4], w[0] + w[1] + w[2], 1e-9)
    }
  })
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  it('relaxation and branch bounds by ternary search; Gomory row by exact inversion and validity; brute-force integer optimum (200 seeds)', () => {
    for (const s of seeds('E', 200)) {
      const p = E.sample(makeRng(s))
      const ans = answers(E.build(p))
      const { A: M, r, c } = p
      const profile = (t: number) => c[0] * t + c[1] * Math.min((r[0] - M[0][0] * t) / M[0][1], (r[1] - M[1][0] * t) / M[1][1])
      const tmax = Math.min(r[0] / M[0][0], r[1] / M[1][0])
      const t0 = ternaryMax(profile, 0, tmax)
      close(ans[0], profile(t0), 1e-7)
      close(ans[1], t0, 1e-5)
      const k = Math.floor(t0)
      const tk = ternaryMax(profile, 0, Math.min(k, tmax))
      close(ans[2], profile(tk), 1e-7)
      // brute force over the integer grid
      let best = -Infinity
      const pts: [number, number][] = []
      for (let x1 = 0; x1 <= 60; x1++) for (let x2 = 0; x2 <= 60; x2++) {
        if (M[0][0] * x1 + M[0][1] * x2 <= r[0] && M[1][0] * x1 + M[1][1] * x2 <= r[1]) { pts.push([x1, x2]); best = Math.max(best, c[0] * x1 + c[1] * x2) }
      }
      expect(ans[4], s).toBe(best)
      expect(best).toBeLessThan(ans[0])
      // Gomory row: first row of A^{-1} from A^T u = e1, exactly
      const g = solveFr([[F(M[0][0]), F(M[1][0])], [F(M[0][1]), F(M[1][1])]], [F(1), F(0)])
      const x = solveFr([[F(M[0][0]), F(M[0][1])], [F(M[1][0]), F(M[1][1])]], [F(r[0]), F(r[1])])
      const frac = (v: Fr) => {
        let q = v.n / v.d
        if (v.n < 0n && v.n % v.d !== 0n) q -= 1n
        return v.sub(new Fr(q))
      }
      const f1 = frac(g[0]), f2 = frac(g[1]), f0 = frac(x[0])
      close(ans[3], f1.num, 1e-12)
      expect(f0.cmp(F(0))).toBeGreaterThan(0)
      // validity: every integer feasible point satisfies the cut, the LP optimum (s = 0) violates it
      for (const [x1, x2] of pts) {
        const s1 = F(r[0] - M[0][0] * x1 - M[0][1] * x2), s2 = F(r[1] - M[1][0] * x1 - M[1][1] * x2)
        expect(f1.mul(s1).add(f2.mul(s2)).cmp(f0), `${s}: cut cuts off (${x1},${x2})`).toBeGreaterThanOrEqual(0)
      }
    }
  })
})

// ---------- F ----------
describe('generator F against independent computation', () => {
  it('Rayleigh quotients, gradient descent, golden-section line search (300 seeds)', () => {
    for (const s of seeds('F', 300)) {
      const p = Fq.sample(makeRng(s))
      const ans = answers(Fq.build(p))
      const f = (x: number, y: number) => p.p * x * x + p.q * x * y + p.r * y * y - p.b1 * x - p.b2 * y
      const grad = (x: number, y: number) => [(f(x + 1e-3, y) - f(x - 1e-3, y)) / 2e-3, (f(x, y + 1e-3) - f(x, y - 1e-3)) / 2e-3]
      // Hessian eigenvalues as extreme values of the Rayleigh quotient
      let lo = Infinity, hi = -Infinity
      const n = 40000
      for (let i = 0; i < n; i++) {
        const th = (Math.PI * i) / n
        const c = Math.cos(th), si = Math.sin(th)
        const rq = 2 * p.p * c * c + 2 * p.q * c * si + 2 * p.r * si * si
        lo = Math.min(lo, rq); hi = Math.max(hi, rq)
      }
      close(ans[0], lo, 1e-6)
      close(ans[1], hi, 1e-6)
      close(ans[0] * ans[1], 4 * p.p * p.r - p.q * p.q, 1e-9)
      // minimum by gradient descent with step 1/(Gershgorin bound)
      const L = Math.max(2 * p.p + Math.abs(p.q), 2 * p.r + Math.abs(p.q))
      let x = 0, y = 0
      for (let i = 0; i < 30000; i++) { const [gx, gy] = grad(x, y); x -= gx / L; y -= gy / L }
      close(ans[2], f(x, y), 1e-6)
      // exact line search
      const [g0x, g0y] = grad(p.u, p.v)
      const phi = (t: number) => f(p.u - t * g0x, p.v - t * g0y)
      const tStar = goldenMin(phi, 0, 20)
      close(ans[3], tStar, 1e-5)
      close(ans[4], phi(tStar), 1e-7)
    }
  })
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  it('golden-section search on the boundary, random feasible points, multiplier from the gradient, dual function by separable minimisation (300 seeds)', () => {
    for (const s of seeds('G', 300)) {
      const p = G.sample(makeRng(s))
      const ans = answers(G.build(p))
      const f = (x: number, y: number) => (x - p.p) ** 2 + (y - p.q) ** 2
      // along the boundary m x + n y = r
      const onLine = (t: number) => f(t, (p.r - p.m * t) / p.n)
      const xs = goldenMin(onLine, -200, 200)
      const ys = (p.r - p.m * xs) / p.n
      close(ans[1], xs, 1e-5)
      close(ans[2], ys, 1e-5)
      close(ans[3], f(xs, ys), 1e-6)
      // nothing feasible is better (random points in a box, projected into the half-plane when infeasible is not needed: reject them)
      const rng = makeRng('G-mc' + s)
      for (let i = 0; i < 400; i++) {
        const x = rng.next() * 30 - 15, y = rng.next() * 30 - 15
        if (p.m * x + p.n * y <= p.r) expect(f(x, y)).toBeGreaterThanOrEqual(ans[3] - 1e-9)
      }
      // multiplier: grad f = -lambda (m, n)
      const h = 1e-4
      const fx = (f(xs + h, ys) - f(xs - h, ys)) / (2 * h), fy = (f(xs, ys + h) - f(xs, ys - h)) / (2 * h)
      close(ans[0], -fx / p.m, 1e-5)
      close(ans[0], -fy / p.n, 1e-5)
      expect(ans[0]).toBeGreaterThan(0)
      // dual function: separable minimisation of the Lagrangian
      const g = (lam: number) => {
        const tx = goldenMin((x) => (x - p.p) ** 2 + lam * p.m * x, -100, 100)
        const ty = goldenMin((y) => (y - p.q) ** 2 + lam * p.n * y, -100, 100)
        return (tx - p.p) ** 2 + (ty - p.q) ** 2 + lam * (p.m * tx + p.n * ty - p.r)
      }
      close(ans[4], g(p.lam0), 1e-6)
      expect(g(p.lam0)).toBeLessThanOrEqual(ans[3] + 1e-9)
      const lamBest = ternaryMax(g, 0, 60)
      close(lamBest, ans[0], 1e-4)
      close(g(lamBest), ans[3], 1e-6)
    }
  })
})

// ---------- H ----------
describe('generator H against independent computation', () => {
  it('exact Lagrange system; nested ternary search over the free weights; exact quadratic forms (200 seeds)', () => {
    for (const s of seeds('H', 200)) {
      const p = H.sample(makeRng(s))
      const ans = answers(H.build(p))
      const S = p.S.map((row) => row.map((v) => F(v)))
      // equal weights, exactly
      const third = F(1, 3)
      let eq = F(0)
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) eq = eq.add(third.mul(S[i][j]).mul(third))
      close(ans[0], eq.num, 1e-12)
      // Lagrange system [S 1; 1' 0] (w, -lambda) = (0, 1), solved exactly
      const K = [
        [S[0][0], S[0][1], S[0][2], F(1)],
        [S[1][0], S[1][1], S[1][2], F(1)],
        [S[2][0], S[2][1], S[2][2], F(1)],
        [F(1), F(1), F(1), F(0)],
      ]
      const sol = solveFr(K, [F(0), F(0), F(0), F(1)])
      const w = sol.slice(0, 3)
      close(ans[1], w[0].num, 1e-12)
      close(ans[2], w[1].num, 1e-12)
      const variance = dotFr(w, S.map((row) => dotFr(row, w)))
      close(ans[3], variance.num, 1e-12)
      close(ans[4], dotFr(w, p.mu.map((v) => F(v))).num, 1e-12)
      // nested ternary search over (w1, w2) with w3 = 1 - w1 - w2
      const quad = (w1: number, w2: number) => {
        const v = [w1, w2, 1 - w1 - w2]
        let t = 0
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) t += v[i] * p.S[i][j] * v[j]
        return t
      }
      const inner = (w1: number) => { const w2 = goldenMin((u) => quad(w1, u), -6, 6); return quad(w1, w2) }
      const w1 = goldenMin(inner, -6, 6)
      const w2 = goldenMin((u) => quad(w1, u), -6, 6)
      close(ans[1], w1, 1e-5)
      close(ans[2], w2, 1e-5)
      close(ans[3], quad(w1, w2), 1e-7)
    }
  })
})
