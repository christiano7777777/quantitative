// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: sigma-algebra size by closing the blocks under complement and union (bitmasks), exact fractions, direct sums.
//  B: partial sums with a tail correction, exact fractions, a search for the smallest n, characteristic functions as explicit sums.
//  C: sums over many terms, exact fractions, a brute-force search for the smallest N.
//  D: Simpson integration of the normal density, exact fractions for conditional means, an exact linear solve for the walk.
//  E: exact enumeration with fractions, and Monte Carlo simulation of the urn.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { F, Fr, fpow, solveFr } from '../../../shared/fraction'
import * as A from './a-finite'
import * as B from './b-limits'
import * as C from './c-modes'
import * as D from './d-clt'
import * as E from './e-urn'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const lectures = topics.find((t) => t.id === 'p3')!.lectures.length

const gens: [string, LQGenerator, number][] = [
  ['A', { id: 'A', generate: (r) => A.build(A.sample(r)) }, 5],
  ['B', { id: 'B', generate: (r) => B.build(B.sample(r)) }, 5],
  ['C', { id: 'C', generate: (r) => C.build(C.sample(r)) }, 5],
  ['D', { id: 'D', generate: (r) => D.build(D.sample(r)) }, 5],
  ['E', { id: 'E', generate: (r) => E.build(E.sample(r)) }, 5],
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
  it('sigma-algebra size by closure, exact masses, means and tails (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const prm = A.sample(makeRng(s))
      const ans = answers(A.build(prm))
      const { w, block, k, vals, pair, t, r } = prm
      const full = 63
      const mask = (j: number) => [0, 1, 2, 3, 4, 5].reduce((m, i) => (block[i] === j ? m | (1 << i) : m), 0)
      // (a) close {blocks} under complement and pairwise union until nothing new appears
      const sets = new Set<number>([0, full, ...Array.from({ length: k }, (_, j) => mask(j))])
      for (let changed = true; changed;) {
        changed = false
        for (const a of [...sets]) {
          if (!sets.has(full ^ a)) { sets.add(full ^ a); changed = true }
          for (const b of [...sets]) if (!sets.has(a | b)) { sets.add(a | b); changed = true }
        }
      }
      expect(ans[0]).toBe(sets.size)
      // (b)-(d) exact fractions over the outcomes
      const massOf = (m: number) => w.reduce((acc, wi, i) => ((m >> i) & 1 ? acc.add(F(wi, 20)) : acc), F(0))
      close(ans[1], massOf(mask(pair[0]) | mask(pair[1])).num)
      let mean = F(0)
      for (let i = 0; i < 6; i++) mean = mean.add(F(w[i], 20).mul(F(vals[block[i]])))
      close(ans[2], mean.num)
      let tail = F(0)
      for (let i = 0; i < 6; i++) if (vals[block[i]] > t) tail = tail.add(F(w[i], 20))
      close(ans[3], tail.num)
      // (e) E[min(Y,n)] as an explicit (truncated) sum over m; smallest n reaching 95% of E[Y]
      const rv = r[0] / r[1]
      const emin = (n: number) => { let sum = 0; for (let m = 1; m <= 4000; m++) sum += Math.min(m, n) * (1 - rv) * rv ** (m - 1); return sum }
      const EY = 1 / (1 - rv)
      expect(emin(ans[4]), 'n reaches 95%').toBeGreaterThanOrEqual(0.95 * EY - 1e-9)
      expect(emin(ans[4] - 1), 'n-1 does not').toBeLessThan(0.95 * EY)
    }
  })
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  it('series, exact products, search for n, characteristic functions as explicit sums (300 seeds)', () => {
    for (const s of seeds('B', 300)) {
      const prm = B.sample(makeRng(s))
      const ans = answers(B.build(prm))
      const { c, m, sig2, e, d, nb, pNum, lam } = prm
      // (a) partial sum to N plus the integral tail 1/(c N)
      let part = 0
      const N = 200000
      for (let n = 1; n <= N; n++) part += 1 / (c * n * n)
      close(ans[0], part + 1 / (c * N), 1e-6)
      // (b) exact product
      let prod = F(1)
      for (let n = 1; n <= m; n++) prod = prod.mul(F(1).sub(F(1, c * n * n)))
      close(ans[1], prod.num)
      // (c) smallest n with sigma^2 / (n eps^2) <= delta, exact comparison
      const eps2 = F(e * e, 4), delta = F(d, 100)
      const ok = (n: number) => F(sig2).div(eps2.mul(F(n))).cmp(delta) <= 0
      expect(ok(ans[2])).toBe(true)
      expect(ok(ans[2] - 1)).toBe(false)
      // (d) Re E[exp(i pi X)] as an explicit sum over the binomial pmf
      const p = pNum / 10
      let binom = 0
      let coef = 1
      for (let kk = 0; kk <= nb; kk++) {
        if (kk > 0) coef = (coef * (nb - kk + 1)) / kk
        binom += coef * p ** kk * (1 - p) ** (nb - kk) * Math.cos(Math.PI * kk)
      }
      close(ans[3], binom, 1e-12)
      // (e) Re E[exp(i pi X / 2)] as an explicit Poisson sum
      let pois = 0
      let pmf = Math.exp(-lam)
      for (let kk = 0; kk <= 120; kk++) {
        if (kk > 0) pmf = (pmf * lam) / kk
        pois += pmf * Math.cos((Math.PI * kk) / 2)
      }
      close(ans[4], pois, 1e-12)
    }
  })

  it('Monte Carlo: the Poisson characteristic function and the binomial one agree with simulation (5 seeds)', () => {
    for (const s of seeds('B', 5)) {
      const prm = B.sample(makeRng(s))
      const ans = answers(B.build(prm))
      const rng = makeRng('sim' + s)
      const runs = 200000
      let sumBin = 0, sumPois = 0
      for (let r = 0; r < runs; r++) {
        let x = 0
        for (let j = 0; j < prm.nb; j++) if (rng.next() < prm.pNum / 10) x++
        sumBin += Math.cos(Math.PI * x)
        // Poisson by multiplying uniforms (Knuth)
        const L = Math.exp(-prm.lam)
        let kk = 0, prodU = 1
        do { kk++; prodU *= rng.next() } while (prodU > L)
        sumPois += Math.cos((Math.PI * (kk - 1)) / 2)
      }
      expect(Math.abs(ans[3] - sumBin / runs), 'binomial').toBeLessThan(0.01)
      expect(Math.abs(ans[4] - sumPois / runs), 'poisson').toBeLessThan(0.01)
    }
  })
})

// ---------- C ----------
describe('generator C against independent computation', () => {
  // tails[ex][n] = sum_{j>=n} j^{-ex}: backward summation from 10^6 plus the integral remainder, once per exponent
  const N = 1_000_000
  const tails: Record<number, Float64Array> = {}
  for (const ex of [2, 3, 4]) {
    const t = new Float64Array(N + 1)
    t[N] = N ** (1 - ex) / (ex - 1) + N ** -ex / 2
    for (let n = N - 1; n >= 1; n--) t[n] = t[n + 1] + n ** -ex
    tails[ex] = t
  }

  it('zeta sums, exact moments and products, brute-force tail search (300 seeds)', () => {
    for (const s of seeds('C', 300)) {
      const prm = C.sample(makeRng(s))
      const ans = answers(C.build(prm))
      const { s: ex, q, nb, tau, m } = prm
      // (a) sum_{n>=1} n^{-s} is the tail from 1
      close(ans[0], tails[ex][1], 1e-7)
      // (b) E[X_n^q] = n^q * P(X_n = n), as an exact fraction
      close(ans[1], F(nb ** q, nb ** ex).num)
      // (c) smallest N with tail <= tau
      expect(tails[ex][ans[2]]).toBeLessThanOrEqual(tau)
      expect(tails[ex][ans[2] - 1]).toBeGreaterThan(tau)
      // (d) exact product of complements, (e) exact sum
      let allZero = F(1)
      for (let n = 2; n <= m + 1; n++) allZero = allZero.mul(F(1).sub(F(1, n ** ex)))
      close(ans[3], allZero.num)
      let expd = F(0)
      for (let n = 1; n <= m; n++) expd = expd.add(F(1, n ** ex))
      close(ans[4], expd.num)
    }
  })

  it('Monte Carlo: simulating the X_n reproduces the probability and the mean count (5 seeds)', () => {
    for (const s of seeds('C', 5)) {
      const prm = C.sample(makeRng(s))
      const ans = answers(C.build(prm))
      const rng = makeRng('sim' + s)
      const runs = 100000
      let allZero = 0, count = 0
      for (let r = 0; r < runs; r++) {
        let zeros = true
        for (let n = 2; n <= prm.m + 1; n++) if (rng.next() < n ** -prm.s) zeros = false
        if (zeros) allZero++
        for (let n = 1; n <= prm.m; n++) if (rng.next() < n ** -prm.s) count++
      }
      expect(Math.abs(ans[3] - allZero / runs), 'all zero').toBeLessThan(0.01)
      expect(Math.abs(ans[4] - count / runs), 'mean count').toBeLessThan(0.02)
    }
  })
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('Simpson integration of the normal density, exact conditional means, exact walk solve (300 seeds)', () => {
    for (const s of seeds('D', 300)) {
      const prm = D.sample(makeRng(s))
      const ans = answers(D.build(prm))
      const { n, pNum, dx, w, block, k, jBlock, N, i } = prm
      const p = pNum / 10
      const mu = n * p
      const x = Math.round(mu) + dx
      const z = (x - mu) / Math.sqrt(n * p * (1 - p))
      close(ans[0], z, 1e-9)
      // (b) Phi(z) = 1/2 + integral_0^z phi, by Simpson with 2000 intervals
      const phi = (u: number) => Math.exp(-u * u / 2) / Math.sqrt(2 * Math.PI)
      const steps = 2000, h = z / steps
      let simpson = phi(0) + phi(z)
      for (let j = 1; j < steps; j++) simpson += phi(j * h) * (j % 2 ? 4 : 2)
      close(ans[1], 0.5 + (simpson * h) / 3, 5e-7)
      // (c), (d) exact conditional mean on the block and exact residual variance
      const cond: Fr[] = []
      for (let j = 0; j < k; j++) {
        let num = F(0), den = F(0)
        for (let o = 0; o < 6; o++) if (block[o] === j) { num = num.add(F((o + 1) * w[o])); den = den.add(F(w[o])) }
        cond.push(num.div(den))
      }
      close(ans[2], cond[jBlock].num)
      let resid = F(0)
      for (let o = 0; o < 6; o++) { const dlt = F(o + 1).sub(cond[block[o]]); resid = resid.add(F(w[o], 20).mul(dlt).mul(dlt)) }
      close(ans[3], resid.num)
      // (e) hitting probability from an exact linear solve on the walk with states 1..N-1
      const m = N - 1
      const A0 = Array.from({ length: m }, (_, r) => Array.from({ length: m }, (_, c) => (c === r ? F(1) : c === r + 1 || c === r - 1 ? F(-1, 2) : F(0))))
      const rhs = Array.from({ length: m }, (_, r) => (r === m - 1 ? F(1, 2) : F(0)))
      close(ans[4], solveFr(A0, rhs)[i - 1].num)
    }
  })

  it('the conditional mean really minimises the mean-square error among block-constant predictors (30 seeds)', () => {
    for (const s of seeds('D', 30)) {
      const prm = D.sample(makeRng(s))
      const ans = answers(D.build(prm))
      const { w, block, k } = prm
      // the best constants per block, found by a fine grid search, give the same residual variance
      let best = 0
      for (let j = 0; j < k; j++) {
        let lo = Infinity
        for (let c = 1; c <= 6; c += 0.001) {
          let err = 0
          for (let o = 0; o < 6; o++) if (block[o] === j) err += (w[o] / 20) * (o + 1 - c) ** 2
          lo = Math.min(lo, err)
        }
        best += lo
      }
      close(ans[3], best, 1e-5)
    }
  })
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  it('exact enumeration of draw sequences (300 seeds)', () => {
    for (const s of seeds('E', 300)) {
      const prm = E.sample(makeRng(s))
      const ans = answers(E.build(prm))
      const { r, b, c, n } = prm
      // recursive exact probabilities of a colour string
      const prob = (seq: string, red0 = r, tot0 = r + b): Fr => {
        let red = red0, tot = tot0, p = F(1)
        for (const ch of seq) {
          p = p.mul(ch === 'R' ? F(red, tot) : F(tot - red, tot))
          if (ch === 'R') red += c
          tot += c
        }
        return p
      }
      const final = (seq: string) => ({ red: r + c * [...seq].filter((ch) => ch === 'R').length, tot: r + b + c * seq.length })
      const all3 = ['RRR', 'RRB', 'RBR', 'RBB', 'BRR', 'BRB', 'BBR', 'BBB']
      close(ans[0], prob('RR').num)
      // E[M_2 | R_1] = sum over second draw of P(draw | R_1) * red fraction after two draws
      const given = prob('RR').div(prob('R')).mul(F(final('RR').red, final('RR').tot)).add(prob('RB').div(prob('R')).mul(F(final('RB').red, final('RB').tot)))
      close(ans[1], given.num)
      let e2 = F(0)
      for (const q of all3) e2 = e2.add(prob(q).mul(fpow(F(final(q).red, final(q).tot), 2)))
      close(ans[2], e2.sub(fpow(F(r, r + b), 2)).num)
      let ph = F(0)
      for (const q of all3) if (2 * final(q).red >= final(q).tot) ph = ph.add(prob(q))
      close(ans[3], ph.num)
      // (e) shares of the variance with Var(Y_k) = k: largest term over the explicit sum
      let total = 0
      for (let k = 1; k <= n; k++) total += k
      close(ans[4], n / total)
    }
  })

  it('Monte Carlo: simulating the urn reproduces the variance and the P(M_3 >= 1/2) (6 seeds)', () => {
    for (const s of seeds('E', 6)) {
      const prm = E.sample(makeRng(s))
      const ans = answers(E.build(prm))
      const rng = makeRng('sim' + s)
      const runs = 200000
      let sum = 0, sum2 = 0, half = 0, rr = 0
      for (let run = 0; run < runs; run++) {
        let red = prm.r, tot = prm.r + prm.b
        let first = ''
        for (let step = 0; step < 3; step++) {
          const isRed = rng.next() < red / tot
          if (step < 2) first += isRed ? 'R' : 'B'
          if (isRed) red += prm.c
          tot += prm.c
        }
        const m3 = red / tot
        sum += m3; sum2 += m3 * m3
        if (2 * red >= tot) half++
        if (first === 'RR') rr++
      }
      const mean = sum / runs
      expect(Math.abs(ans[2] - (sum2 / runs - mean * mean)), 'Var(M3)').toBeLessThan(0.002)
      expect(Math.abs(ans[3] - half / runs), 'P(M3>=1/2)').toBeLessThan(0.01)
      expect(Math.abs(ans[0] - rr / runs), 'P(RR)').toBeLessThan(0.01)
    }
  })
})
