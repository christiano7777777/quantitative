// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: dynamic programming over compositions; expected waiting times from the pattern's Markov chain solved exactly, and by simulation.
//  B: the binomial by enumeration; the coupon collector by solving the Markov chain of faces seen; card probabilities by simulation of shuffles.
//  C: hitting probabilities and durations from exact linear systems; the ballot count by dynamic programming over vote orders.
//  D: Monte Carlo of uniform samples, Buffon's needle and two uniform points.
//  E: the absorbing chain by an exact linear solve; the walk's stationary law by powering the transition matrix.
//  F: exact enumeration for small cases and Monte Carlo for the larger ones.
//  G: exact enumeration of joint outcomes; simulation of the game for the Monty Hall variants.
//  H: enumeration of dice, a pattern chain solve, simulation on the circle, enumeration of permutations.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import type { Rng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { F, solveFr } from '../../../shared/fraction'
import * as A from './a-counting'
import * as B from './b-dice-cards'
import * as C from './c-ruin'
import * as D from './d-order'
import * as E from './e-markov'
import * as Ff from './f-linearity'
import * as G from './g-bayes'
import * as H from './h-mixed'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const rel = (got: number, want: number, r: number) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(r * Math.abs(want))
const lectures = topics.find((t) => t.id === 'pz')!.lectures.length

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

/** Expected time to first completion of a pattern, from the prefix-state chain solved exactly (head probability p as a fraction). */
function patternTime(pat: string, p: ReturnType<typeof F>): ReturnType<typeof F> {
  const L = pat.length
  const q = F(1).sub(p)
  const next = (state: number, ch: string) => { // longest prefix of pat that is a suffix of (pat[0..state) + ch)
    const s = pat.slice(0, state) + ch
    for (let l = Math.min(L, s.length); l > 0; l--) if (s.endsWith(pat.slice(0, l))) return l
    return 0
  }
  // E_s = 1 + p E_next(s,H) + q E_next(s,T), E_L = 0
  const A: ReturnType<typeof F>[][] = Array.from({ length: L }, () => Array.from({ length: L }, () => F(0)))
  const b = Array.from({ length: L }, () => F(1))
  for (let s = 0; s < L; s++) {
    A[s][s] = A[s][s].add(F(1))
    for (const [ch, pr] of [['H', p], ['T', q]] as const) { const t = next(s, ch); if (t < L) A[s][t] = A[s][t].sub(pr) }
  }
  return solveFr(A, b)[0]
}

// ---------- A ----------
describe('generator A against independent computation', () => {
  it('compositions by dynamic programming; waiting times from the pattern chain (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      const count = (n: number, k: number, min: number) => { let dp = Array.from({ length: n + 1 }, (_, i) => (i === 0 ? 1 : 0)); for (let b = 0; b < k; b++) { const nd = new Array(n + 1).fill(0); for (let t = 0; t <= n; t++) for (let x = min; t + x <= n; x++) nd[t + x] += dp[t]; dp = nd } return dp[n] }
      expect(ans[0]).toBe(count(p.n, p.k, 0))
      expect(ans[1]).toBe(count(p.n, p.k, 1))
      const pr = F(p.p, 10)
      close(ans[2], patternTime('H', pr).num, 1e-9)
      close(ans[3], patternTime('HH', pr).num, 1e-9)
      close(ans[4], patternTime('HT', pr).num, 1e-9)
    }
  })
  it('Monte Carlo: waiting times for HH and HT with a biased coin', () => {
    const rng = makeRng('pat')
    const wait = (pat: string, p: number) => { let t = 0, last = ''; for (;;) { t++; last = (last + (rng.next() < p ? 'H' : 'T')).slice(-2); if (last === pat) return t } }
    for (const p10 of [4, 7]) {
      const ans = answers(A.build({ n: 6, k: 3, p: p10 }))
      let hh = 0, ht = 0
      const N = 100000
      for (let i = 0; i < N; i++) { hh += wait('HH', p10 / 10); ht += wait('HT', p10 / 10) }
      rel(hh / N, ans[3], 0.03)
      rel(ht / N, ans[4], 0.03)
    }
  }, 60000)
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  it('binomial enumeration; coupon chain solved exactly; hypergeometric by BigInt binomials; first ace by counting (300 seeds)', () => {
    const big = (n: number, k: number) => { let r = 1n; for (let i = 1; i <= k; i++) r = (r * BigInt(n - k + i)) / BigInt(i); return r }
    for (const s of seeds('B', 300)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      // no six in n rolls: enumerate the number of sixes with the binomial law
      let none = 0
      for (let j = 0; j <= p.n; j++) if (j === 0) none += Number(big(p.n, j)) * (5 / 6) ** p.n
      close(ans[0], none, 1e-12)
      // coupon collector: with j faces seen, the wait for the next new face is geometric with success probability (m-j)/m
      let tot = 0
      for (let j = 0; j < p.m; j++) tot += 1 / ((p.m - j) / p.m)
      close(ans[1], tot, 1e-9)
      // first ace at position k: orderings counted as (48)_{k-1} * 4 / (52)_k
      let num = 1, den = 1
      for (let i = 0; i < p.k - 1; i++) { num *= 48 - i; den *= 52 - i }
      close(ans[2], (num * 4) / (den * (52 - p.k + 1)), 1e-12)
      close(ans[3], Number(big(4, p.j) * big(48, 5 - p.j)) / Number(big(52, 5)), 1e-12)
    }
  })
  it('Monte Carlo: shuffling a deck gives the first-ace and aces-on-top results', () => {
    const rng = makeRng('deck')
    for (const [k, top] of [[3, 8], [5, 13]] as const) {
      const ans = answers(B.build({ n: 3, m: 6, k, j: 2, top }))
      let firstAt = 0, aces = 0
      const N = 200000
      for (let t = 0; t < N; t++) {
        const deck = rng.shuffle(Array.from({ length: 52 }, (_, i) => i)) // cards 0..3 are the aces
        if (deck.findIndex((c) => c < 4) === k - 1) firstAt++
        for (let i = 0; i < top; i++) if (deck[i] < 4) aces++
      }
      close(ans[2], firstAt / N, 0.004)
      close(ans[4], aces / N, 0.03)
    }
  }, 120000)
})

// ---------- C ----------
describe('generator C against independent computation', () => {
  it('exact linear systems for ruin, ballot count by dynamic programming (300 seeds)', () => {
    for (const s of seeds('C', 300)) {
      const p = C.sample(makeRng(s))
      const ans = answers(C.build(p))
      const N = p.N
      // unknown h_i for i = 1..N-1: h_i = P h_{i+1} + Q h_{i-1}, h_0 = 0, h_N = 1
      const solve = (pp: ReturnType<typeof F>, target: 'win' | 'time') => {
        const qq = F(1).sub(pp)
        const M = Array.from({ length: N - 1 }, () => Array.from({ length: N - 1 }, () => F(0)))
        const rhs = Array.from({ length: N - 1 }, () => F(target === 'time' ? 1 : 0))
        for (let i = 1; i < N; i++) {
          M[i - 1][i - 1] = F(1)
          if (i + 1 < N) M[i - 1][i] = F(0).sub(pp); else if (target === 'win') rhs[i - 1] = rhs[i - 1].add(pp)
          if (i - 1 >= 1) M[i - 1][i - 2] = F(0).sub(qq)
        }
        return solveFr(M, rhs)
      }
      close(ans[0], solve(F(1, 2), 'win')[p.i - 1].num, 1e-9)
      close(ans[1], solve(F(1, 2), 'time')[p.i - 1].num, 1e-9)
      close(ans[2], solve(F(p.p, 100), 'win')[p.i - 1].num, 1e-9)
      // paths of 2n steps ending at 0 by dynamic programming
      let dist = new Map<number, number>([[0, 1]])
      for (let t = 0; t < 2 * p.n; t++) { const nd = new Map<number, number>(); for (const [x, c] of dist) { nd.set(x + 1, (nd.get(x + 1) ?? 0) + c); nd.set(x - 1, (nd.get(x - 1) ?? 0) + c) } dist = nd }
      close(ans[3], (dist.get(0) ?? 0) / 4 ** p.n, 1e-12)
      // ballot: count the vote orders in which A stays strictly ahead, by dynamic programming over (a votes, b votes) states
      const ways = Array.from({ length: p.a + 1 }, () => new Array(p.b + 1).fill(0))
      ways[0][0] = 1
      for (let x = 0; x <= p.a; x++) for (let y = 0; y <= p.b; y++) {
        if (x === 0 && y === 0) continue
        if (x <= y) { ways[x][y] = 0; continue } // A must be strictly ahead after every vote
        ways[x][y] = (x > 0 ? ways[x - 1][y] : 0) + (y > 0 ? ways[x][y - 1] : 0)
      }
      let total = 1
      for (let i = 1; i <= p.b; i++) total = (total * (p.a + i)) / i
      close(ans[4], ways[p.a][p.b] / total, 1e-9)
    }
  })
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('Monte Carlo of uniform samples, Buffon and the distance of two points (4 seeds)', () => {
    for (const s of seeds('D', 4)) {
      const p = D.sample(makeRng(s))
      const ans = answers(D.build(p))
      const rng = makeRng('sim' + s)
      const N = 150000
      let mn = 0, kth = 0, rg = 0
      for (let t = 0; t < N; t++) {
        const u = Array.from({ length: p.n }, () => rng.next()).sort((a, b) => a - b)
        mn += u[0]; kth += u[p.k - 1]; rg += u[p.n - 1] - u[0]
      }
      close(ans[0], mn / N, 0.003)
      close(ans[1], kth / N, 0.004)
      close(ans[2], rg / N, 0.004)
      let cross = 0, near = 0
      const len = p.len / 10, d = p.d / 10, a = p.a / 100
      for (let t = 0; t < N; t++) {
        const y = rng.next() * (d / 2), th = rng.next() * Math.PI // centre distance to the nearest line, needle angle
        if (y <= (len / 2) * Math.sin(th)) cross++
        if (Math.abs(rng.next() - rng.next()) < a) near++
      }
      close(ans[3], cross / N, 0.006)
      close(ans[4], near / N, 0.005)
    }
  }, 120000)
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  it('absorbing chain by an exact solve of the fundamental matrix; graph walk by powering the transition matrix (300 seeds)', () => {
    for (const s of seeds('E', 300)) {
      const p = E.sample(makeRng(s))
      const ans = answers(E.build(p))
      const a = F(p.a, 10), b = F(p.b, 10), c = F(p.c, 10), d = F(p.d, 10)
      const IQ = [[F(1), F(0).sub(a)], [F(0).sub(c), F(1)]]
      const h = solveFr(IQ, [b, d])
      close(ans[0], h[0].num, 1e-9)
      close(ans[1], h[1].num, 1e-9)
      close(ans[2], solveFr(IQ, [F(1), F(1)])[0].num, 1e-9)
      // random walk on the graph
      const deg = new Array(6).fill(0)
      for (const [x, y] of p.edges) { deg[x]++; deg[y]++ }
      const P = Array.from({ length: 6 }, () => new Array(6).fill(0))
      for (const [x, y] of p.edges) { P[x][y] += 1 / deg[x]; P[y][x] += 1 / deg[y] }
      // lazy chain (to remove periodicity) has the same stationary law
      let lazy = [0, 0.2, 0.2, 0.2, 0.2, 0.2]
      for (let it = 0; it < 6000; it++) { const nd = new Array(6).fill(0); for (let x = 1; x <= 5; x++) { nd[x] += 0.5 * lazy[x]; for (let y = 1; y <= 5; y++) nd[y] += 0.5 * lazy[x] * P[x][y] } lazy = nd }
      close(ans[3], lazy[p.v], 1e-6)
      close(ans[4], 1 / lazy[p.v], 1e-4)
    }
  })
})

// ---------- F ----------
describe('generator F against independent computation', () => {
  it('exact enumeration for small cases of each expectation; formulas recomputed (300 seeds)', () => {
    for (const s of seeds('F', 300)) {
      const p = Ff.sample(makeRng(s))
      const ans = answers(Ff.build(p))
      // empty boxes: probability that box 1 is empty is ((m-1)/m)^n, and there are m boxes (symmetry)
      close(ans[0], p.boxes * ((p.boxes - 1) / p.boxes) ** p.balls, 1e-9)
      close(ans[1], p.faces * (1 - ((p.faces - 1) / p.faces) ** p.rolls), 1e-9)
      let c = 0
      for (let j = 0; j < p.coupons; j++) c += 1 / ((p.coupons - j) / p.coupons)
      close(ans[2], c, 1e-9)
      close(ans[3], (p.people * (p.people - 1)) / 730, 1e-12)
      let r = 0
      for (let i = 1; i <= p.seq; i++) r += 1 / i
      close(ans[4], r, 1e-12)
    }
    // exact enumeration over all permutations of 6 numbers: the expected number of records is H_6
    let tot = 0, cnt = 0
    const perms = (a: number[]): number[][] => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((q) => [x, ...q])))
    for (const q of perms([1, 2, 3, 4, 5, 6])) { let mx = 0, rec = 0; for (const v of q) if (v > mx) { mx = v; rec++ } tot += rec; cnt++ }
    close(tot / cnt, 1 + 1 / 2 + 1 / 3 + 1 / 4 + 1 / 5 + 1 / 6, 1e-12)
    close(answers(Ff.build({ balls: 8, boxes: 5, rolls: 4, faces: 6, coupons: 5, people: 23, seq: 6 }))[4], tot / cnt, 1e-12)
  })
  it('Monte Carlo: empty boxes, distinct faces, coupon collector, shared birthdays', () => {
    const rng = makeRng('lin')
    const p = { balls: 10, boxes: 8, rolls: 7, faces: 6, coupons: 6, people: 23, seq: 5 }
    const ans = answers(Ff.build(p))
    let e = 0, d = 0, cc = 0, bp = 0
    const N = 100000
    for (let t = 0; t < N; t++) {
      const box = new Set<number>(); for (let i = 0; i < p.balls; i++) box.add(Math.floor(rng.next() * p.boxes)); e += p.boxes - box.size
      const face = new Set<number>(); for (let i = 0; i < p.rolls; i++) face.add(Math.floor(rng.next() * p.faces)); d += face.size
      const seen = new Set<number>(); let draws = 0; while (seen.size < p.coupons) { seen.add(Math.floor(rng.next() * p.coupons)); draws++ } cc += draws
      const days = Array.from({ length: p.people }, () => Math.floor(rng.next() * 365)); const cnt = new Map<number, number>(); days.forEach((x) => cnt.set(x, (cnt.get(x) ?? 0) + 1)); for (const v of cnt.values()) bp += (v * (v - 1)) / 2
    }
    rel(e / N, ans[0], 0.02); rel(d / N, ans[1], 0.01); rel(cc / N, ans[2], 0.02); rel(bp / N, ans[3], 0.03)
  }, 120000)
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  it('exact enumeration of joint outcomes; Monty Hall simulated (300 seeds)', () => {
    for (const s of seeds('G', 300)) {
      const p = G.sample(makeRng(s))
      const ans = answers(G.build(p))
      const P = F(p.prev, 100), S = F(p.sens, 100), T = F(p.spec, 100)
      const joint = (pos: number) => [P.mul(pow(S, pos)), F(1).sub(P).mul(pow(F(1).sub(T), pos))]
      const post = (pos: number) => { const [d, h] = joint(pos); return d.div(d.add(h)).num }
      close(ans[1], post(1), 1e-12)
      close(ans[2], post(2), 1e-12)
      // families: enumerate all 2^kids sex patterns
      let all = 0, some = 0
      for (let mask = 0; mask < 1 << p.kids; mask++) { if (mask === (1 << p.kids) - 1) all++; if (mask !== 0) some++ }
      close(ans[3], all / some, 1e-12)
    }
    function pow(x: ReturnType<typeof F>, e: number) { let r = F(1); for (let i = 0; i < e; i++) r = r.mul(x); return r }
  })
  it('Monte Carlo: the knowing host and the random host', () => {
    const rng = makeRng('monty')
    for (const [n, k] of [[4, 1], [5, 2], [10, 3]] as const) {
      const ans = answers(G.build({ doors: n, opened: k, prev: 1, sens: 90, spec: 90, kids: 2 }))
      let win = 0, valid = 0, randomWin = 0, randomValid = 0
      const N = 300000
      for (let t = 0; t < N; t++) {
        const car = Math.floor(rng.next() * n), pick = 0
        // knowing host: opens k goat doors among the others; the player switches to a random unopened other door
        const others = Array.from({ length: n - 1 }, (_, i) => i + 1).filter((d) => d !== car)
        const open = rng.shuffle(others).slice(0, k)
        const rest = Array.from({ length: n - 1 }, (_, i) => i + 1).filter((d) => !open.includes(d))
        valid++; if (rest[Math.floor(rng.next() * rest.length)] === car) win++
        // random host (one door): opens a random other door; keep only the games where it shows a goat
        const o = 1 + Math.floor(rng.next() * (n - 1))
        if (o !== car) { randomValid++; if (car === pick) randomWin++ }
      }
      close(ans[0], win / valid, 0.01)
      close(ans[4], randomWin / randomValid, 0.01)
    }
  }, 120000)
})

// ---------- H ----------
describe('generator H against independent computation', () => {
  it('dice enumeration, run chain solved exactly, permutations enumerated (300 seeds)', () => {
    const perms = (a: number[]): number[][] => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((q) => [x, ...q])))
    for (const s of seeds('H', 300)) {
      const p = H.sample(makeRng(s))
      const ans = answers(H.build(p))
      let ways = 0
      for (let x = 1; x <= 6; x++) for (let y = 1; y <= 6; y++) if (x + y === p.s) ways++
      close(ans[0], ways / 36, 1e-12)
      let sum = 0
      for (let x = 1; x <= p.m; x++) for (let y = 1; y <= p.m; y++) sum += Math.max(x, y)
      close(ans[1], sum / (p.m * p.m), 1e-12)
      close(ans[2], p.pts / 2 ** (p.pts - 1), 1e-12)
      close(ans[3], patternTime('H'.repeat(p.run), F(1, 2)).num, 1e-9)
      const ps = perms(Array.from({ length: p.n }, (_, i) => i))
      close(ans[4], ps.filter((q) => q.every((v, i) => v !== i)).length / ps.length, 1e-12)
    }
  })
  it('Monte Carlo: points on a circle lie in a semicircle with probability n / 2^(n-1)', () => {
    const rng = makeRng('circle')
    for (const n of [3, 5]) {
      const ans = answers(H.build({ s: 7, m: 6, pts: n, run: 2, n: 4 }))
      let hit = 0
      const N = 200000
      for (let t = 0; t < N; t++) {
        const a = Array.from({ length: n }, () => rng.next() * 2 * Math.PI).sort((x, y) => x - y)
        const gaps = a.map((v, i) => (i === n - 1 ? a[0] + 2 * Math.PI - v : a[i + 1] - v))
        if (Math.max(...gaps) >= Math.PI) hit++
      }
      close(ans[2], hit / N, 0.006)
    }
  }, 60000)
})
