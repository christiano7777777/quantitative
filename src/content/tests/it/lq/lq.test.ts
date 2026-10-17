// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: entropies from the count table with the identity H = log N - (1/N) sum m log m, conditional entropy as a weighted average of row entropies, mutual information as the divergence from the product distribution.
//  B: the joint pmf of (X, Y, Z = X xor Y) is enumerated and every measure comes from marginal entropies by inclusion-exclusion.
//  C: the Huffman length by brute-force search over all length assignments obeying Kraft (exact integers); Kraft and Shannon lengths in integer arithmetic.
//  D: all 2^n sequences are enumerated: nH as the expected log-probability, the type class by counting, its probability by summing.
//  E: capacities by a ternary search of the mutual information computed from the channel's joint pmf; the BEC and Z-channel are treated as 2x3 and 2x2 joint tables.
//  F: the optimal test channels are built explicitly and their mutual information computed from the joint pmf (plus a grid search for Bernoulli); Gaussian via the correlation coefficient.
//  G: the update through the posterior form r(x) prod_y q(x|y)^W(y|x); the bounds from H(Y) - H(Y|X); the capacity from a ternary search lies inside the bracket.
//  H: differential entropies by Simpson integration of -f log f; water-filling by bisection on the level and a grid search over the power splits.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import bank from '../index'
import * as A from './a-joint'
import * as B from './b-xor'
import * as C from './c-huffman'
import * as D from './d-typical'
import * as E from './e-channel'
import * as Ff from './f-ratedist'
import * as G from './g-ba'
import * as Hh from './h-continuous'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const lectures = topics.find((t) => t.id === 'it')!.lectures.length
const lg = Math.log2
const xlogx = (x: number) => (x > 0 ? x * lg(x) : 0)
const simpson = (f: (x: number) => number, a: number, b: number, n = 20000) => {
  const h = (b - a) / n
  let s = f(a) + f(b)
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2)
  return (s * h) / 3
}
/** Ternary search for the maximum of a concave function on [0,1]. */
const maxConcave = (f: (x: number) => number) => {
  let lo = 0
  let hi = 1
  for (let i = 0; i < 200; i++) {
    const m1 = lo + (hi - lo) / 3
    const m2 = hi - (hi - lo) / 3
    if (f(m1) < f(m2)) lo = m1
    else hi = m2
  }
  return f((lo + hi) / 2)
}
/** Mutual information of a joint table, as the divergence from the product of the marginals. */
const mutualInfo = (J: number[][]) => {
  const px = J.map((r) => r.reduce((s, x) => s + x, 0))
  const py = J[0].map((_, j) => J.reduce((s, r) => s + r[j], 0))
  let s = 0
  J.forEach((r, i) => r.forEach((p, j) => { if (p > 0) s += p * lg(p / (px[i] * py[j])) }))
  return s
}

const gens: [string, LQGenerator][] = [
  ['A', { id: 'A', generate: (r) => A.build(A.sample(r)) }],
  ['B', { id: 'B', generate: (r) => B.build(B.sample(r)) }],
  ['C', { id: 'C', generate: (r) => C.build(C.sample(r)) }],
  ['D', { id: 'D', generate: (r) => D.build(D.sample(r)) }],
  ['E', { id: 'E', generate: (r) => E.build(E.sample(r)) }],
  ['F', { id: 'F', generate: (r) => Ff.build(Ff.sample(r)) }],
  ['G', { id: 'G', generate: (r) => G.build(G.sample(r)) }],
  ['H', { id: 'H', generate: (r) => Hh.build(Hh.sample(r)) }],
]

describe.each(gens)('generator %s: generic rules', (name, gen) => {
  it('has 5 well-formed parts, text and answers (300 seeds)', () => {
    for (const s of seeds(name, 300)) {
      const inst = gen.generate(makeRng(s))
      expect(inst.parts, s).toHaveLength(5)
      for (const text of [inst.intro, ...inst.parts.flatMap((p) => [p.prompt, p.explanation])]) {
        expect(text, s).not.toMatch(/NaN|undefined|Infinity|\[object/)
        expect(/[\u0000-\u001f\u007f]/.test(text), `${s}: control character in ${JSON.stringify(text)}`).toBe(false)
        expect((text.match(/\$/g) ?? []).length % 2, `${s}: ${text}`).toBe(0)
      }
      for (const p of inst.parts) {
        expect(Number.isFinite(p.answer), s).toBe(true)
        expect(p.lecture).toBeGreaterThanOrEqual(1)
        expect(p.lecture).toBeLessThanOrEqual(lectures)
        expect((p.tolerance?.abs ?? 0) + (p.tolerance?.rel ?? 0)).toBeGreaterThan(0)
      }
    }
  })
  it('is deterministic per seed and varies across seeds', () => {
    expect(JSON.stringify(gen.generate(makeRng('x')))).toBe(JSON.stringify(gen.generate(makeRng('x'))))
    const text = (s: string) => { const i = gen.generate(makeRng(s)); return i.intro + i.parts.map((p) => p.prompt).join('|') }
    expect(new Set(seeds(name, 100).map(text)).size).toBeGreaterThan(15)
  })
})

describe('blueprint', () => {
  it('the LQ bank touches all lectures, and each generator stays inside its slot lectures', () => {
    const slotLectures = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]
    const seen = new Set<number>()
    bank.lqSlots!.forEach((slot, si) => {
      for (const id of slot) {
        const idx = bank.lq.findIndex((g) => g.id === id)
        const [name, gen] = gens[idx]
        for (const s of seeds(name, 20)) {
          for (const p of gen.generate(makeRng(s)).parts) {
            seen.add(p.lecture)
            expect(slotLectures[si], `${id} part tagged lecture ${p.lecture}`).toContain(p.lecture)
          }
        }
      }
    })
    expect([...seen].sort((a, b) => a - b)).toEqual(Array.from({ length: lectures }, (_, i) => i + 1))
  })
})

// ---------- A ----------
describe('generator A against independent computation', () => {
  it('count-table identities, weighted row entropies and divergence from the product (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const prm = A.sample(makeRng(s))
      const ans = answers(A.build(prm))
      const { n, c } = prm
      const total = c.flat().reduce((x, y) => x + y, 0)
      expect(total).toBe(n)
      const rowSums = c.map((r) => r.reduce((x, y) => x + y, 0))
      const colSums = [0, 1, 2].map((j) => c[0][j] + c[1][j])
      const entropyCounts = (m: number[]) => { const t = m.reduce((x, y) => x + y, 0); return lg(t) - m.reduce((x, y) => x + y * lg(y), 0) / t }
      close(ans[0], entropyCounts(rowSums))
      // H(Y|X) as a weighted average of the row entropies
      close(ans[1], c.reduce((sum, row, i) => sum + (rowSums[i] / n) * entropyCounts(row), 0))
      // I(X;Y) as the divergence of the joint from the product of marginals
      let mi = 0
      c.forEach((row, i) => row.forEach((m, j) => { mi += (m / n) * lg((m / n) / ((rowSums[i] / n) * (colSums[j] / n))) }))
      close(ans[2], mi)
      // D(P_Y || U) as a sum over the three columns
      close(ans[3], colSums.reduce((sum, m) => sum + (m / n) * lg((m / n) / (1 / 3)), 0))
      // H(X | Y=1) from the first column's counts
      close(ans[4], entropyCounts([c[0][0], c[1][0]]))
    }
  })
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  it('enumerated joint pmf of (X, Y, X xor Y) and inclusion-exclusion on marginal entropies (300 seeds)', () => {
    for (const s of seeds('B', 300)) {
      const { p, q } = B.sample(makeRng(s))
      const ans = answers(B.build({ p, q }))
      const joint = new Map<string, number>()
      for (const x of [0, 1]) for (const y of [0, 1]) joint.set(`${x}${y}${x ^ y}`, (x ? p : 1 - p) * (y ? q : 1 - q))
      const Hs = (idx: number[]) => {
        const m = new Map<string, number>()
        for (const [k, pr] of joint) { const key = idx.map((i) => k[i]).join(''); m.set(key, (m.get(key) ?? 0) + pr) }
        return -[...m.values()].reduce((sum, v) => sum + xlogx(v), 0)
      }
      const [HX, HY, HZ, HXY, HXZ, HYZ, HXYZ] = [[0], [1], [2], [0, 1], [0, 2], [1, 2], [0, 1, 2]].map(Hs)
      close(ans[0], HZ)
      close(ans[1], HX + HZ - HXZ)
      close(ans[2], HXZ + HYZ - HZ - HXYZ)
      close(ans[3], HX + HY + HZ - HXY - HXZ - HYZ + HXYZ)
      close(ans[4], HXY + HYZ - HY - HXYZ)
      expect(ans[3]).toBeLessThan(0)
    }
  })
})

// ---------- C ----------
describe('generator C against independent computation', () => {
  it('brute-force optimal prefix code lengths under Kraft, exact integer Kraft and Shannon lengths (300 seeds)', () => {
    for (const s of seeds('C', 300)) {
      const prm = C.sample(makeRng(s))
      const { n, w, lens } = prm
      const ans = answers(C.build(prm))
      expect(w.reduce((x, y) => x + y, 0)).toBe(n)
      const Hval = lg(n) - w.reduce((x, y) => x + y * lg(y), 0) / n
      close(ans[0], Hval)
      close(ans[1], lens.reduce((sum, l) => sum + 16 / 2 ** l, 0) / 16)
      // brute force: all length vectors in 1..5 with integer Kraft sum sum 2^(5-l) <= 32
      let best = Infinity
      const rec = (i: number, kraft: number, cost: number) => {
        if (kraft > 32) return
        if (i === 6) { best = Math.min(best, cost); return }
        for (let len = 1; len <= 5; len++) rec(i + 1, kraft + 2 ** (5 - len), cost + w[i] * len)
      }
      rec(0, 0, 0)
      close(ans[2], best / n)
      close(ans[3], best / n - Hval)
      // Shannon lengths: smallest integer l with 2^l * w >= n
      let sh = 0
      for (const x of w) { let len = 0; while (2 ** len * x < n) len++; sh += x * len }
      close(ans[4], sh / n)
      expect(ans[4]).toBeGreaterThanOrEqual(ans[2] - 1e-12)
    }
  })
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('enumeration of all 2^n sequences (300 seeds)', () => {
    for (const s of seeds('D', 300)) {
      const prm = D.sample(makeRng(s))
      const { p, n, k } = prm
      const ans = answers(D.build(prm))
      let nH = 0
      let cnt = 0
      let probK = 0
      let probOfFirstK = 0
      for (let mask = 0; mask < 2 ** n; mask++) {
        let ones = 0
        for (let i = 0; i < n; i++) if (mask >> i & 1) ones++
        const pr = p ** ones * (1 - p) ** (n - ones)
        nH += pr * -lg(pr) // E[-log P(X^n)] = nH for an i.i.d. source
        if (ones === k) { cnt++; probK += pr; probOfFirstK = pr }
      }
      close(ans[0], nH / n, 1e-9) // entropy per symbol
      close(ans[1], nH, 1e-9)
      close(ans[2], Math.abs(-lg(probOfFirstK) / n - nH / n), 1e-9)
      close(ans[3], cnt, 1e-9)
      close(ans[4], probK, 1e-12)
    }
  })
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  it('capacities by maximising the mutual information of the joint pmf (300 seeds)', () => {
    for (const s of seeds('E', 300)) {
      const prm = E.sample(makeRng(s))
      const { p, eps, q, a, n, R } = prm
      const ans = answers(E.build(prm))
      const bsc = (t: number) => mutualInfo([[(1 - t) * (1 - p), (1 - t) * p], [t * p, t * (1 - p)]])
      const bec = (t: number) => mutualInfo([[(1 - t) * (1 - eps), 0, (1 - t) * eps], [0, t * (1 - eps), t * eps]])
      const zch = (t: number) => mutualInfo([[1 - t, 0], [t * a, t * (1 - a)]])
      const cB = maxConcave(bsc)
      close(ans[0], cB, 1e-9)
      close(ans[1], maxConcave(bec), 1e-9)
      close(ans[2], bsc(q), 1e-12)
      close(ans[3], maxConcave(zch), 1e-9)
      close(ans[4], 2 ** (n * (R - cB)), 1e-7 * 2 ** (n * (R - cB)) + 1e-9)
    }
  })
})

// ---------- F ----------
describe('generator F against independent computation', () => {
  it('explicit optimal test channels, a grid search for the Bernoulli source, Gaussian via the correlation (300 seeds)', () => {
    for (const s of seeds('F', 300)) {
      const prm = Ff.sample(makeRng(s))
      const { p, D: dist, m, Dm, s2, Dg, R } = prm
      const ans = answers(Ff.build(prm))
      // Bernoulli: X-hat ~ Bernoulli(r), X = X-hat xor Noise(dist); r solves r(1-dist) + (1-r) dist = p
      const r = (p - dist) / (1 - 2 * dist)
      const joint = [[(1 - r) * (1 - dist), (1 - r) * dist], [r * dist, r * (1 - dist)]] // rows x-hat, columns x
      close(joint[0][1] + joint[1][1], p, 1e-12) // the source marginal is Bernoulli(p)
      const rBern = mutualInfo(joint)
      close(ans[0], rBern, 1e-9)
      // time-sharing: the straight line between (0, H(p)) and (p, 0)
      const Hp = -(xlogx(p) + xlogx(1 - p))
      close(ans[1], Hp + ((0 - Hp) * (dist - 0)) / (p - 0) - rBern, 1e-9)
      // uniform m-ary source: X-hat uniform, X = X-hat w.p. 1-Dm, else uniform over the other symbols
      const J = Array.from({ length: m }, (_, i) => Array.from({ length: m }, (_, j) => (1 / m) * (i === j ? 1 - Dm : Dm / (m - 1))))
      close(ans[2], mutualInfo(J), 1e-9)
      // Gaussian: X = X-hat + N(0, D) with Var X-hat = s2 - D gives correlation rho^2 = (s2-D)/s2, I = -1/2 log2(1-rho^2)
      close(ans[3], -0.5 * lg(1 - (s2 - Dg) / s2), 1e-9)
      const dRate = s2 * (1 - (1 - 2 ** (-2 * R))) // D = s2 (1 - rho^2) with rho^2 = 1 - 2^(-2R)
      close(ans[4], dRate, 1e-9)
    }
  })
  it('no test channel beats the Bernoulli rate-distortion function on a grid (20 seeds)', () => {
    for (const s of seeds('Fgrid', 20)) {
      const prm = Ff.sample(makeRng(s))
      const { p, D: dist } = prm
      const rBern = answers(Ff.build(prm))[0]
      let best = Infinity
      const N = 300
      for (let i = 0; i <= N; i++) {
        for (let j = 0; j <= N; j++) {
          const al = i / N // P(x-hat=1 | x=0)
          const be = j / N // P(x-hat=0 | x=1)
          if ((1 - p) * al + p * be > dist + 1e-12) continue
          const J = [[(1 - p) * (1 - al), (1 - p) * al], [p * be, p * (1 - be)]]
          best = Math.min(best, mutualInfo(J))
        }
      }
      expect(best).toBeGreaterThan(rBern - 1e-9)
      expect(best).toBeLessThan(rBern + 0.02)
    }
  })
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  it('posterior-form update, H(Y)-H(Y|X) bounds and the capacity inside the bracket (300 seeds)', () => {
    for (const s of seeds('G', 300)) {
      const prm = G.sample(makeRng(s))
      const { a, b } = prm
      const ans = answers(G.build(prm))
      const W = [[1 - a, a], [b, 1 - b]]
      const r = [0.5, 0.5]
      const qy = [0, 1].map((y) => r[0] * W[0][y] + r[1] * W[1][y])
      close(ans[0], qy[1], 1e-12)
      const Hy = -(xlogx(qy[0]) + xlogx(qy[1]))
      const HyGx = -r.reduce((sum, rx, x) => sum + rx * (xlogx(W[x][0]) + xlogx(W[x][1])), 0)
      // D_x = cross entropy minus entropy of the row
      const Dx = [0, 1].map((x) => -W[x].reduce((sum, w, y) => sum + w * lg(qy[y]), 0) + (xlogx(W[x][0]) + xlogx(W[x][1])))
      close(ans[1], Dx[0], 1e-9)
      close(ans[2], Dx[1], 1e-9)
      // the update through the posterior q(x|y) = r(x) W(y|x) / q(y): r'(x) ~ prod_y q(x|y)^W(y|x)
      const unnorm = [0, 1].map((x) => 2 ** W[x].reduce((sum, w, y) => sum + w * lg((r[x] * w) / qy[y]), 0))
      close(ans[3], unnorm[1] / (unnorm[0] + unnorm[1]), 1e-9)
      // bounds
      const lower = Hy - HyGx
      const upper = Math.max(...Dx)
      close(ans[4], upper - lower, 1e-9)
      const cap = maxConcave((t) => {
        const qq = [0, 1].map((y) => (1 - t) * W[0][y] + t * W[1][y])
        return -(xlogx(qq[0]) + xlogx(qq[1])) + ((1 - t) * (xlogx(W[0][0]) + xlogx(W[0][1])) + t * (xlogx(W[1][0]) + xlogx(W[1][1])))
      })
      expect(cap).toBeGreaterThanOrEqual(lower - 1e-9)
      expect(cap).toBeLessThanOrEqual(upper + 1e-9)
      // the new input does not reduce the mutual information
      const t = ans[3]
      const qn = [0, 1].map((y) => (1 - t) * W[0][y] + t * W[1][y])
      const Inew = -(xlogx(qn[0]) + xlogx(qn[1])) + ((1 - t) * (xlogx(W[0][0]) + xlogx(W[0][1])) + t * (xlogx(W[1][0]) + xlogx(W[1][1])))
      expect(Inew).toBeGreaterThanOrEqual(lower - 1e-12)
    }
  })
})

// ---------- H ----------
describe('generator H against independent computation', () => {
  it('Simpson integration of -f log f and water-filling by bisection with a grid search (150 seeds)', () => {
    for (const s of seeds('H', 150)) {
      const prm = Hh.sample(makeRng(s))
      const { s2, lam, c, N, P } = prm
      const ans = answers(Hh.build(prm))
      const sd = Math.sqrt(s2)
      const fN = (x: number) => Math.exp(-(x * x) / (2 * s2)) / Math.sqrt(2 * Math.PI * s2)
      close(ans[0], simpson((x) => -fN(x) * lg(fN(x)), -14 * sd, 14 * sd), 1e-6)
      // Y = cX + 7 with X ~ Exp(lam): density f_X((y-7)/c)/c on y > 7
      const fY = (y: number) => (lam / c) * Math.exp((-lam * (y - 7)) / c)
      close(ans[1], simpson((y) => -fY(y) * lg(fY(y)), 7, 7 + (c / lam) * 45, 60000), 1e-5)
      // water level by bisection on sum (nu - N_i)^+ = P
      let lo = 0
      let hi = P + N[2]
      for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2
        if (N.reduce((sum, x) => sum + Math.max(mid - x, 0), 0) < P) lo = mid
        else hi = mid
      }
      close(ans[2], lo, 1e-9)
      close(ans[3], Math.max(lo - N[0], 0), 1e-9)
      // capacity: grid search over all splits of P in steps of P/300
      const total = (p1: number, p2: number) => 0.5 * (lg(1 + p1 / N[0]) + lg(1 + p2 / N[1]) + lg(1 + (P - p1 - p2) / N[2]))
      let best = -Infinity
      const G = 300
      for (let i = 0; i <= G; i++) for (let j = 0; i + j <= G; j++) best = Math.max(best, total((P * i) / G, (P * j) / G))
      expect(ans[4]).toBeGreaterThanOrEqual(best - 1e-9)
      expect(ans[4]).toBeLessThan(best + 2e-3)
    }
  })
})
