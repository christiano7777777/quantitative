// Every LQ answer is recomputed here by a DIFFERENT method from the generator's own:
//  - exact rational arithmetic (BigInt fractions) instead of floating point,
//  - reachability by DFS instead of Floyd-Warshall, polynomial composition instead of closed forms,
//  - truncated birth-death chains instead of the geometric formulas,
//  - and Monte Carlo simulation of the modelled system, which catches modelling mistakes
//    (e.g. a transposed matrix) that two algebraically-equal computations would share.
import { describe, expect, it } from 'vitest'
import { makeRng, type Rng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { renderPaper, selectPaper } from '../../../../lib/test-builder'
import bank from '../index'
import * as A from './a-dtmc'
import * as B from './b-ruin'
import * as C from './c-poisson'
import * as D from './d-ctmc-queue'
import * as E from './e-branching'

// ---------- exact fractions ----------
const gcd = (a: bigint, b: bigint): bigint => {
  a = a < 0n ? -a : a; b = b < 0n ? -b : b
  while (b) [a, b] = [b, a % b]
  return a
}
class Fr {
  n: bigint; d: bigint
  constructor(n: bigint, d: bigint = 1n) {
    if (d < 0n) { n = -n; d = -d }
    const g = gcd(n, d) || 1n
    this.n = n / g; this.d = d / g
  }
  add(o: Fr) { return new Fr(this.n * o.d + o.n * this.d, this.d * o.d) }
  sub(o: Fr) { return new Fr(this.n * o.d - o.n * this.d, this.d * o.d) }
  mul(o: Fr) { return new Fr(this.n * o.n, this.d * o.d) }
  div(o: Fr) { return new Fr(this.n * o.d, this.d * o.n) }
  get num() { return Number(this.n) / Number(this.d) }
  get zero() { return this.n === 0n }
}
const F = (n: number, d = 1) => new Fr(BigInt(n), BigInt(d))
const pow = (x: Fr, e: number) => { let r = F(1); for (let i = 0; i < e; i++) r = r.mul(x); return r }

function solveFr(A0: Fr[][], b0: Fr[]): Fr[] {
  const n = b0.length
  const M = A0.map((row, i) => [...row, b0[i]])
  for (let c = 0; c < n; c++) {
    const p = M.findIndex((row, r) => r >= c && !row[c].zero)
    if (p < 0) throw new Error('singular')
    ;[M[c], M[p]] = [M[p], M[c]]
    const piv = M[c][c]
    M[c] = M[c].map((x) => x.div(piv))
    for (let r = 0; r < n; r++) {
      if (r === c || M[r][c].zero) continue
      const f = M[r][c]
      M[r] = M[r].map((x, k) => x.sub(f.mul(M[c][k])))
    }
  }
  return M.map((row) => row[n])
}

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)

// ---------- generic rules for every generator ----------
const gens: [string, LQGenerator, number][] = [
  ['A', { id: 'A', generate: (r) => A.build(A.sample(r)) }, 6],
  ['B', { id: 'B', generate: (r) => B.build(B.sample(r)) }, 5],
  ['C', { id: 'C', generate: (r) => C.build(C.sample(r)) }, 5],
  ['D', { id: 'D', generate: (r) => D.build(D.sample(r)) }, 5],
  ['E', { id: 'E', generate: (r) => E.build(E.sample(r)) }, 5],
]
const spLectures = topics.find((t) => t.id === 'sp')!.lectures.length

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
        expect(p.lecture).toBeLessThanOrEqual(spLectures)
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

it('the LQ bank touches all 11 lectures', () => {
  const seen = new Set<number>()
  for (const [name, gen] of gens) for (const s of seeds(name, 20)) gen.generate(makeRng(s)).parts.forEach((p) => seen.add(p.lecture))
  expect([...seen].sort((a, b) => a - b)).toEqual(Array.from({ length: spLectures }, (_, i) => i + 1))
})

// ---------- A: discrete-time chain ----------
describe('generator A against independent computation', () => {
  it('exact rational answers (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const prm = A.sample(makeRng(s))
      const ans = answers(A.build(prm))
      const { W, role } = prm
      const n = 5
      const Pf = W.map((r) => r.map((w) => F(w, 10)))
      const idx = (l: number) => l - 1

      // (a) two-step probability by exact matrix product
      let two = F(0)
      for (let k = 0; k < n; k++) two = two.add(Pf[idx(role.T1)][k].mul(Pf[k][idx(prm.target)]))
      close(ans[0], two.num)

      // (b) communicating classes by depth-first search from every state
      const reach = (from: number) => {
        const seen = new Set<number>([from]); const stack = [from]
        while (stack.length) { const u = stack.pop()!; for (let v = 0; v < n; v++) if (W[u][v] > 0 && !seen.has(v)) { seen.add(v); stack.push(v) } }
        return seen
      }
      const R = Array.from({ length: n }, (_, i) => reach(i))
      const classOf = new Set(Array.from({ length: n }, (_, i) => [...R[i]].filter((j) => R[j].has(i)).sort().join(',')))
      expect(ans[1]).toBe(classOf.size)

      // (c) expected visits to T1 from T1: the series I + Q + Q^2 + ... summed term by term (not by inverting I - Q)
      const a = idx(role.T1), b = idx(role.T2), ab = idx(role.AB)
      const Qs = [[Pf[a][a].num, Pf[a][b].num], [Pf[b][a].num, Pf[b][b].num]]
      let power = [[1, 0], [0, 1]]
      let visits = 0
      for (let t = 0; t < 3000; t++) {
        visits += power[0][0]
        power = power.map((row) => [row[0] * Qs[0][0] + row[1] * Qs[1][0], row[0] * Qs[0][1] + row[1] * Qs[1][1]])
      }
      close(ans[2], visits, 1e-6)

      // (d), (e) exact 2x2 solves
      const IQ = [[F(1).sub(Pf[a][a]), F(0).sub(Pf[a][b])], [F(0).sub(Pf[b][a]), F(1).sub(Pf[b][b])]]
      close(ans[3], solveFr(IQ, [Pf[a][ab], Pf[b][ab]])[0].num)
      close(ans[4], solveFr(IQ, [F(1), F(1)])[0].num)

      // (f) P(end in the closed class) from T1 times the stationary probability of R1 inside the class.
      // P(end in class) is solved directly (not as 1 - h); pi solves pi P = pi on {R1,R2} with sum 1.
      const r1 = idx(role.R1), r2 = idx(role.R2)
      const toClass = solveFr(IQ, [Pf[a][r1].add(Pf[a][r2]), Pf[b][r1].add(Pf[b][r2])])[0]
      const sys = [[Pf[r1][r1].sub(F(1)), Pf[r2][r1]], [F(1), F(1)]]
      const pi = solveFr(sys, [F(0), F(1)])
      close(ans[5], toClass.mul(pi[0]).num)
    }
  })

  it('Monte Carlo simulation of the chain agrees (10 seeds)', () => {
    for (const s of seeds('A', 10)) {
      const prm = A.sample(makeRng(s))
      const ans = answers(A.build(prm))
      const { W, role } = prm
      const rng = makeRng('sim' + s)
      const step = (i: number) => { let u = rng.int(1, 10); for (let j = 0; j < 5; j++) { u -= W[i][j]; if (u <= 0) return j } return 4 }
      const outside = new Set([role.R1, role.R2, role.AB].map((x) => x - 1))
      const runs = 30000
      let hits = 0, steps = 0, twoHits = 0, visitsT1 = 0
      for (let r = 0; r < runs; r++) {
        let x = role.T1 - 1, t = 0, left = false, reachedAB = false
        const x2 = step(step(x)); if (x2 === prm.target - 1) twoHits++
        for (;;) {
          if (!left && x === role.T1 - 1) visitsT1++
          if (!left && outside.has(x)) { left = true; steps += t }
          if (x === role.AB - 1) { reachedAB = true; break }
          if (left && (x === role.R1 - 1 || x === role.R2 - 1)) break
          x = step(x); t++
        }
        if (reachedAB) hits++
      }
      expect(Math.abs(ans[0] - twoHits / runs), 'two-step').toBeLessThan(0.015)
      expect(Math.abs(ans[3] - hits / runs), 'absorption').toBeLessThan(0.015)
      expect(Math.abs(ans[4] / (steps / runs) - 1), 'expected exit time').toBeLessThan(0.05)
      expect(Math.abs(ans[2] / (visitsT1 / runs) - 1), 'expected visits to T1').toBeLessThan(0.05)
      // long-run time in R1 from T1: many independent runs of 500 steps (absorbed runs contribute 0)
      let inR1 = 0, total = 0
      for (let r = 0; r < 4000; r++) {
        let x = role.T1 - 1
        for (let t = 0; t < 500; t++) { if (x === role.R1 - 1) inR1++; total++; x = step(x) }
      }
      expect(Math.abs(ans[5] - inR1 / total), 'time fraction in R1 from T1').toBeLessThan(0.02)
    }
  })
})

// ---------- B: gambler's ruin ----------
describe('generator B against independent computation', () => {
  const walk = (N: number, p: Fr, rhs: Fr) => {
    // unknowns u_1..u_{N-1}; u_i - p u_{i+1} - q u_{i-1} = rhs, with u_0 = u_N = 0
    const q = F(1).sub(p), m = N - 1
    const A0 = Array.from({ length: m }, (_, r) => Array.from({ length: m }, (_, c) => (c === r ? F(1) : c === r + 1 ? F(0).sub(p) : c === r - 1 ? F(0).sub(q) : F(0))))
    return { A0, m }
  }
  it('exact tridiagonal solves (100 seeds)', () => {
    for (const s of seeds('B', 100)) {
      const prm = B.sample(makeRng(s))
      const ans = answers(B.build(prm))
      const { N1, i1, N2, i2, pNum } = prm
      const half = F(1, 2), p = F(pNum, 20)

      // reaching probability: rhs only at the boundary N (u_N = 1 contributes p to equation N-1)
      const reach = (N: number, i: number, pp: Fr) => {
        const { A0, m } = walk(N, pp, F(0))
        const b = Array.from({ length: m }, (_, r) => (r === m - 1 ? pp : F(0)))
        return solveFr(A0, b)[i - 1]
      }
      const duration = (N: number, i: number, pp: Fr) => {
        const { A0, m } = walk(N, pp, F(1))
        return solveFr(A0, Array.from({ length: m }, () => F(1)))[i - 1]
      }
      close(ans[0], reach(N1, i1, half).num)
      close(ans[1], duration(N1, i1, half).num)
      close(ans[2], reach(N2, i2, p).num)
      const r = F(20 - pNum, pNum)
      close(ans[3], pow(r, i2).num)
      close(ans[4], duration(N2, i2, p).num, 1e-8)
    }
  })

  it('optional-stopping identity: E[r^{S_T}] computed from the reach probability equals r^i (all parameter choices)', () => {
    for (const N of [6, 8, 10, 12]) for (const pNum of [8, 9, 11, 12, 13]) for (let i = 2; i <= N - 2; i++) {
      const p = F(pNum, 20), r = F(20 - pNum, pNum)
      const { A0, m } = walk(N, p, F(0))
      const h = solveFr(A0, Array.from({ length: m }, (_, k) => (k === m - 1 ? p : F(0))))[i - 1]
      const value = F(1).sub(h).add(h.mul(pow(r, N))) // P(ruin)*r^0 + P(reach)*r^N
      expect(value.sub(pow(r, i)).zero).toBe(true)
    }
  })

  it('Monte Carlo simulation agrees (6 seeds)', () => {
    for (const s of seeds('B', 6)) {
      const prm = B.sample(makeRng(s))
      const ans = answers(B.build(prm))
      const rng = makeRng('sim' + s)
      const play = (N: number, i: number, p: number) => { let x = i, t = 0; while (x > 0 && x < N) { x += rng.next() < p ? 1 : -1; t++ } return [x === N ? 1 : 0, t] }
      const runs = 40000
      const stats = (N: number, i: number, p: number) => { let w = 0, tt = 0; for (let k = 0; k < runs; k++) { const [a, b] = play(N, i, p); w += a; tt += b } return [w / runs, tt / runs] }
      const [w1, t1] = stats(prm.N1, prm.i1, 0.5)
      const [w2, t2] = stats(prm.N2, prm.i2, prm.pNum / 20)
      expect(Math.abs(ans[0] - w1)).toBeLessThan(0.015)
      expect(Math.abs(ans[1] / t1 - 1)).toBeLessThan(0.03)
      expect(Math.abs(ans[2] - w2)).toBeLessThan(0.015)
      expect(Math.abs(ans[4] / t2 - 1)).toBeLessThan(0.03)
    }
  })
})

// ---------- C: Poisson and renewal ----------
describe('generator C against independent computation', () => {
  it('recurrence-based pmf, series-based thinning, closed-form renewal values (300 seeds)', () => {
    for (const s of seeds('C', 300)) {
      const prm = C.sample(makeRng(s))
      const ans = answers(C.build(prm))
      const mu = prm.lambda * prm.t
      let pk = Math.exp(-mu)
      for (let j = 1; j <= prm.k; j++) pk *= mu / j // p_j = p_{j-1} mu / j, no factorial or power
      close(ans[0], pk)

      close(ans[1], prm.l1 / (prm.l1 + prm.l2))

      // thinning: P(no buyer) = sum_n P(N=n) (1-p)^n over the Poisson count n
      const m2 = prm.lambda * prm.t2, keep = prm.pBuy / 10
      let term = Math.exp(-m2), total = 0
      for (let n = 0; n < 200; n++) { total += term * (1 - keep) ** n; term *= m2 / (n + 1) }
      close(ans[2], total, 1e-9)

      const mean = (prm.a + prm.b) / 2
      close(ans[3], 1 / mean)
      close(ans[4], prm.c / mean + prm.d)
    }
  })

  it('Monte Carlo simulation agrees (8 seeds)', () => {
    for (const s of seeds('C', 8)) {
      const prm = C.sample(makeRng(s))
      const ans = answers(C.build(prm))
      const rng = makeRng('sim' + s)
      const exp = (rate: number) => -Math.log(1 - rng.next()) / rate
      const runs = 100000

      let exactly = 0, first1 = 0
      for (let r = 0; r < runs; r++) {
        let t = 0, n = 0
        for (;;) { t += exp(prm.lambda); if (t > prm.t) break; n++ }
        if (n === prm.k) exactly++
        if (exp(prm.l1) < exp(prm.l2)) first1++
      }
      expect(Math.abs(ans[0] - exactly / runs)).toBeLessThan(0.01)
      expect(Math.abs(ans[1] - first1 / runs)).toBeLessThan(0.01)

      let none = 0
      for (let r = 0; r < runs; r++) {
        let t = 0, bought = false
        for (;;) { t += exp(prm.lambda); if (t > prm.t2) break; if (rng.next() < prm.pBuy / 10) { bought = true; break } }
        if (!bought) none++
      }
      expect(Math.abs(ans[2] - none / runs)).toBeLessThan(0.01)

      let life = 0; const bulbs = 200000
      for (let r = 0; r < bulbs; r++) life += prm.a + (prm.b - prm.a) * rng.next()
      expect(Math.abs(ans[3] / (bulbs / life) - 1)).toBeLessThan(0.015)
      expect(Math.abs(ans[4] / ((bulbs * prm.c + prm.d * life) / life) - 1)).toBeLessThan(0.015)
    }
  })
})

// ---------- D: continuous-time chain and M/M/1 queue ----------
describe('generator D against independent computation', () => {
  it('exact stationary law (pi Q = 0 holds with zero residual) and truncated-queue values (300 seeds)', () => {
    for (const s of seeds('D', 300)) {
      const prm = D.sample(makeRng(s))
      const ans = answers(D.build(prm))
      const { q, from, to, asked } = prm
      const exit = (i: number) => q[i].reduce((a, x) => a + x, 0)
      close(ans[0], q[from][to] / exit(from))

      // exact pi from the balance equations written out directly (different arrangement from the generator)
      const Q = q.map((row, i) => row.map((x, j) => F(i === j ? -exit(i) : x)))
      const A0 = [[Q[0][0], Q[1][0], Q[2][0]], [Q[0][1], Q[1][1], Q[2][1]], [F(1), F(1), F(1)]]
      const pi = solveFr(A0, [F(0), F(0), F(1)])
      for (let j = 0; j < 3; j++) expect(pi.reduce((acc, p, i) => acc.add(p.mul(Q[i][j])), F(0)).zero).toBe(true) // pi Q = 0
      expect(pi.reduce((a, p) => a.add(p), F(0)).sub(F(1)).zero).toBe(true)
      pi.forEach((p) => expect(p.num).toBeGreaterThan(0))
      close(ans[1], pi[asked].num)

      // M/M/1 by balance equations on a truncated state space {0..800}: pi_n = pi_{n-1} lambda / mu
      const M = 800, w = [1]
      for (let n = 1; n <= M; n++) w.push(w[n - 1] * prm.lambda / prm.mu)
      const Z = w.reduce((a, x) => a + x, 0)
      const dist = w.map((x) => x / Z)
      const L = dist.reduce((a, x, n) => a + n * x, 0)
      close(ans[2], L, 1e-8)
      close(ans[3], L / prm.lambda, 1e-8) // Little's law
      close(ans[4], dist.slice(prm.k).reduce((a, x) => a + x, 0), 1e-8)
    }
  })

  it('Monte Carlo simulation of the 3-state chain agrees (6 seeds)', () => {
    for (const s of seeds('D', 6)) {
      const prm = D.sample(makeRng(s))
      const ans = answers(D.build(prm))
      const rng = makeRng('sim' + s)
      const { q } = prm
      let x = 0, T = 0, inAsked = 0
      let leaves = 0, jumps = 0
      for (let n = 0; n < 300000; n++) {
        const rate = q[x].reduce((a, v) => a + v, 0)
        const hold = -Math.log(1 - rng.next()) / rate
        T += hold; if (x === prm.asked) inAsked += hold
        let u = rng.next() * rate, nxt = x
        for (let j = 0; j < 3; j++) { if (j === x) continue; u -= q[x][j]; if (u <= 0) { nxt = j; break } }
        if (x === prm.from) { leaves++; if (nxt === prm.to) jumps++ }
        x = nxt
      }
      expect(Math.abs(ans[0] - jumps / leaves)).toBeLessThan(0.02)
      expect(Math.abs(ans[1] - inAsked / T)).toBeLessThan(0.01)
    }
  })
})

// ---------- E: branching ----------
describe('generator E against independent computation', () => {
  // polynomials as coefficient arrays of Fractions
  const mul = (a: Fr[], b: Fr[]) => { const out = Array.from({ length: a.length + b.length - 1 }, () => F(0)); a.forEach((x, i) => b.forEach((y, j) => { out[i + j] = out[i + j].add(x.mul(y)) })); return out }
  const compose = (f: Fr[], g: Fr[]) => { let acc: Fr[] = [F(0)]; let gp: Fr[] = [F(1)]; f.forEach((c) => { const term = gp.map((x) => x.mul(c)); acc = Array.from({ length: Math.max(acc.length, term.length) }, (_, i) => (acc[i] ?? F(0)).add(term[i] ?? F(0))); gp = mul(gp, g) }); return acc }
  const meanOf = (poly: Fr[]) => poly.reduce((a, c, i) => a.add(c.mul(F(i))), F(0))

  it('generation-size distributions by exact polynomial composition (300 seeds)', () => {
    for (const s of seeds('E', 300)) {
      const prm = E.sample(makeRng(s))
      const ans = answers(E.build(prm))
      const G = prm.p.map((t) => F(t, 10))
      const G2 = compose(G, G)       // pgf of Z_2
      const G3 = compose(G, G2)      // pgf of Z_3
      const m = meanOf(G)
      close(ans[0], m.num)
      close(ans[1], meanOf(G3).num)
      close(ans[2], G2[0].num)

      // extinction: iterate s <- G(s) from 0 (the extinction probability is the limit)
      const [p0, p1, p2] = prm.p.map((t) => t / 10)
      let x = 0
      for (let i = 0; i < 400000; i++) { const nx = p0 + p1 * x + p2 * x * x; if (Math.abs(nx - x) < 1e-15) { x = nx; break } x = nx }
      expect(Math.abs(ans[3] - x), `${s}: p=${prm.p}`).toBeLessThan(2e-3)

      // martingale: E[Z_3 | Z_1 = k] = k E[Z_2]  (k independent copies), divided by m^3
      const cond = F(prm.k).mul(meanOf(G2)).div(m.mul(m).mul(m))
      close(ans[4], cond.num)
    }
  })

  it('Monte Carlo simulation of the population agrees (8 seeds)', () => {
    for (const s of seeds('E', 8)) {
      const prm = E.sample(makeRng(s))
      const ans = answers(E.build(prm))
      const rng = makeRng('sim' + s)
      const [p0, p1] = prm.p.map((t) => t / 10)
      const child = () => { const u = rng.next(); return u < p0 ? 0 : u < p0 + p1 ? 1 : 2 }
      const gen = (z: number) => { let n = 0; for (let i = 0; i < z; i++) n += child(); return n }
      const runs = 60000
      let z3 = 0, dead2 = 0, extinct = 0
      for (let r = 0; r < runs; r++) {
        let z = 1; const path = [1]
        for (let g = 1; g <= 3; g++) { z = gen(z); path.push(z) }
        z3 += path[3]; if (path[2] === 0) dead2++
        let w = 1, g = 0
        while (w > 0 && w < 60 && g < 200) { w = gen(w); g++ }
        if (w === 0) extinct++
      }
      expect(Math.abs(ans[1] / (z3 / runs) - 1)).toBeLessThan(0.04)
      expect(Math.abs(ans[2] - dead2 / runs)).toBeLessThan(0.01)
      expect(Math.abs(ans[3] - extinct / runs)).toBeLessThan(0.03) // size >= 60 is treated as survival
    }
  })
})

// ---------- the SP blueprint: every real attempt spans the syllabus ----------
describe('SP attempt blueprint', () => {
  it('every attempt has long questions on lectures 1-4, one of {5,10,11}, one of {6,7,8,9}, and >= 8 distinct lectures (300 seeds)', () => {
    for (const s of seeds('blueprint', 300)) {
      const paper = renderPaper(bank, selectPaper(bank, s))
      expect(paper.lq).toHaveLength(3)
      const lecs = new Set(paper.lq.flatMap((q) => q.parts.map((p) => p.lecture)))
      for (const l of [1, 2, 3, 4]) expect(lecs.has(l), `${s}: lecture ${l}`).toBe(true)
      expect([5, 10, 11].some((l) => lecs.has(l)), s).toBe(true)
      expect([6, 7, 8, 9].some((l) => lecs.has(l)), s).toBe(true)
      expect(lecs.size, s).toBeGreaterThanOrEqual(8)
    }
  })
})
