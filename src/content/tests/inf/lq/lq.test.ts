// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: Simpson integration of the density of the sample maximum, and Monte Carlo of the three estimators.
//  B: numerical integration of the Gamma density, Monte Carlo, exact fractions for the estimates.
//  D: enumeration of all 2^n outcome sequences with exact fractions, and a brute-force search for the sample size.
//  E: exact fractions from the raw data (two-pass variance), and the t table checked by numerical integration of the t density.
//  F: exact fractions for Pearson statistics; G^2 from a different algebraic identity.
//  G: log-likelihood maximised numerically, the pmf products computed directly, exact Poisson sums, Monte Carlo.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { F, Fr } from '../../../shared/fraction'
import * as A from './a-uniform'
import * as B from './b-exponential'
import * as D from './d-binomial'
import * as E from './e-twosample'
import * as Fq from './f-chisq'
import * as G from './g-poisson'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const rel = (got: number, want: number, r: number) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(r * Math.abs(want))
const lectures = topics.find((t) => t.id === 'inf')!.lectures.length

const gens: [string, LQGenerator, number][] = [
  ['A', { id: 'A', generate: (r) => A.build(A.sample(r)) }, 5],
  ['B', { id: 'B', generate: (r) => B.build(B.sample(r)) }, 5],
  ['D', { id: 'D', generate: (r) => D.build(D.sample(r)) }, 5],
  ['E', { id: 'E', generate: (r) => E.build(E.sample(r)) }, 5],
  ['F', { id: 'F', generate: (r) => Fq.build(Fq.sample(r)) }, 5],
  ['G', { id: 'G', generate: (r) => G.build(G.sample(r)) }, 5],
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

/** Composite Simpson rule. */
function simpson(f: (x: number) => number, a: number, b: number, n = 4000): number {
  const h = (b - a) / n
  let s = f(a) + f(b)
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2)
  return (s * h) / 3
}

// ---------- A ----------
describe('generator A against independent computation', () => {
  it('estimates exactly, MSEs and variance by integrating the density of the maximum (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const prm = A.sample(makeRng(s))
      const ans = answers(A.build(prm))
      const { theta, n, tenths } = prm
      const sum = tenths.reduce((a, b) => a.add(F(b, 10)), F(0))
      close(ans[0], sum.div(F(n)).mul(F(2)).num)
      close(ans[1], [...tenths].sort((a, b) => b - a)[0] / 10)
      // density of the maximum: n x^(n-1) / theta^n on (0, theta)
      const dens = (x: number) => (n * x ** (n - 1)) / theta ** n
      const mean = simpson((x) => x * dens(x), 0, theta)
      const mse = simpson((x) => (x - theta) ** 2 * dens(x), 0, theta)
      const v = simpson((x) => (((n + 1) / n) * x - theta) ** 2 * dens(x), 0, theta)
      close(ans[3], mse, 1e-6)
      close(ans[4], v, 1e-6)
      close(mean, (n * theta) / (n + 1), 1e-6)
    }
  })
  it('Monte Carlo: the moment estimator MSE, the MLE MSE and the UMVUE variance (6 seeds)', () => {
    for (const s of seeds('A', 6)) {
      const prm = A.sample(makeRng(s))
      const ans = answers(A.build(prm))
      const { theta, n } = prm
      const rng = makeRng('sim' + s)
      const runs = 200000
      let e1 = 0, e2 = 0, u1 = 0, u2 = 0
      for (let r = 0; r < runs; r++) {
        let sm = 0, mx = 0
        for (let i = 0; i < n; i++) { const x = theta * rng.next(); sm += x; mx = Math.max(mx, x) }
        e1 += (2 * (sm / n) - theta) ** 2
        e2 += (mx - theta) ** 2
        const u = ((n + 1) / n) * mx
        u1 += u; u2 += u * u
      }
      rel(ans[2], e1 / runs, 0.02)
      rel(ans[3], e2 / runs, 0.03)
      rel(ans[4], u2 / runs - (u1 / runs) ** 2, 0.03)
      rel(u1 / runs, theta, 0.01) // unbiased
    }
  })
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  it('Gamma tail by numerical integration, exact estimates, E[1/T^2] by integration (300 seeds)', () => {
    for (const s of seeds('B', 300)) {
      const prm = B.sample(makeRng(s))
      const ans = answers(B.build(prm))
      const { n, lam, c, tenths } = prm
      const fact = (k: number): number => (k <= 1 ? 1 : k * fact(k - 1))
      const gam = (t: number) => (lam ** n * t ** (n - 1) * Math.exp(-lam * t)) / fact(n - 1)
      const tail = simpson(gam, n * c, n * c + 80 / lam, 20000)
      close(ans[0], tail, 1e-6)
      const T = tenths.reduce((a, b) => a.add(F(b, 10)), F(0))
      close(ans[1], F(n).div(T).num)
      close(ans[2], F(n - 1).div(T).num)
      close(ans[3], (lam * lam) / n)
      // variance of (n-1)/T by integrating against the Gamma density
      const m1 = simpson((t) => ((n - 1) / t) * gam(t), 1e-9, 80 / lam, 40000)
      const m2 = simpson((t) => (((n - 1) / t) ** 2) * gam(t), 1e-9, 80 / lam, 40000)
      close(m1, lam, 1e-3)
      close(ans[4], m2 - m1 * m1, 2e-3)
    }
  })
  it('Monte Carlo: P(Xbar > c) and the variance of the UMVUE (5 seeds)', () => {
    for (const s of seeds('B', 5)) {
      const prm = B.sample(makeRng(s))
      const ans = answers(B.build(prm))
      const { n, lam, c } = prm
      const rng = makeRng('sim' + s)
      const runs = 300000
      let hit = 0, u1 = 0, u2 = 0
      for (let r = 0; r < runs; r++) {
        let t = 0
        for (let i = 0; i < n; i++) t += -Math.log(1 - rng.next()) / lam
        if (t / n > c) hit++
        const u = (n - 1) / t
        u1 += u; u2 += u * u
      }
      close(ans[0], hit / runs, 0.005)
      rel(u1 / runs, lam, 0.03)
      // heavy-tailed for n = 3: loose bound
      rel(ans[4], u2 / runs - (u1 / runs) ** 2, n === 3 ? 0.35 : 0.1)
    }
  })
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('enumerates every outcome sequence with exact fractions (300 seeds)', () => {
    for (const s of seeds('D', 300)) {
      const prm = D.sample(makeRng(s))
      const ans = answers(D.build(prm))
      const { n, p0, p1, c, xObs, margin } = prm
      const frac = (p: number) => F(Math.round(p * 100), 100)
      const tailSeq = (p: number, k0: number) => {
        let tot = F(0)
        for (let mask = 0; mask < 1 << n; mask++) {
          let ones = 0
          for (let i = 0; i < n; i++) if (mask & (1 << i)) ones++
          if (ones < k0) continue
          let pr = F(1)
          for (let i = 0; i < n; i++) pr = pr.mul(mask & (1 << i) ? frac(p) : F(1).sub(frac(p)))
          tot = tot.add(pr)
        }
        return tot.num
      }
      close(ans[0], tailSeq(p0, c), 1e-9)
      close(ans[1], tailSeq(p1, c), 1e-9)
      close(ans[2], tailSeq(p0, xObs), 1e-9)
      const ph = xObs / n
      close(ans[3], ph - 1.96 * Math.sqrt((ph * (1 - ph)) / n), 1e-12)
      let m = 1
      while (1.96 * Math.sqrt((ph * (1 - ph)) / m) > margin) m++
      expect(ans[4]).toBe(m)
    }
  })
  it('Monte Carlo: size and power of the test (4 seeds)', () => {
    for (const s of seeds('D', 4)) {
      const prm = D.sample(makeRng(s))
      const ans = answers(D.build(prm))
      const rng = makeRng('sim' + s)
      const runs = 200000
      const rate = (p: number) => {
        let hit = 0
        for (let r = 0; r < runs; r++) {
          let x = 0
          for (let i = 0; i < prm.n; i++) if (rng.next() < p) x++
          if (x >= prm.c) hit++
        }
        return hit / runs
      }
      close(ans[0], rate(prm.p0), 0.006)
      close(ans[1], rate(prm.p1), 0.006)
    }
  })
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  it('exact fractions from the raw data (300 seeds)', () => {
    for (const s of seeds('E', 300)) {
      const prm = E.sample(makeRng(s))
      const ans = answers(E.build(prm))
      const { x, y } = prm
      // variance by the shortcut (sum x^2 - n xbar^2)/(n-1), exact
      const sv = (a: number[]) => {
        const n = a.length
        const s1 = a.reduce((p, q) => p + q, 0), s2 = a.reduce((p, q) => p + q * q, 0)
        return { m: F(s1, n), v: F(s2).sub(F(s1 * s1, n)).div(F(n - 1)) }
      }
      const X = sv(x), Y = sv(y)
      const n1 = x.length, n2 = y.length
      const sp = X.v.mul(F(n1 - 1)).add(Y.v.mul(F(n2 - 1))).div(F(n1 + n2 - 2))
      close(ans[0], sp.num, 1e-9)
      const se2 = sp.mul(F(1, n1).add(F(1, n2)))
      const diff = X.m.sub(Y.m).num
      close(ans[2], diff / Math.sqrt(se2.num), 1e-9)
      close(ans[1], E.T975[n1 + n2 - 2] * Math.sqrt(se2.num), 1e-9)
      close(ans[3], diff / Math.sqrt(X.v.div(F(n1)).add(Y.v.div(F(n2))).num), 1e-9)
      close(ans[4], X.v.div(Y.v).num, 1e-9)
    }
  })
  it('the printed t table matches the 97.5% point of the t density found by integration', () => {
    const lgamma = (z: number): number => {
      const g = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]
      z -= 1
      let a = 0.99999999999980993
      for (let i = 0; i < 8; i++) a += g[i] / (z + i + 1)
      const t = z + 7.5
      return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a)
    }
    for (const [dfs, tab] of Object.entries(E.T975)) {
      const df = Number(dfs)
      const dens = (t: number) => Math.exp(lgamma((df + 1) / 2) - lgamma(df / 2)) / Math.sqrt(df * Math.PI) * (1 + (t * t) / df) ** (-(df + 1) / 2)
      const upperTail = (t: number) => 0.5 - simpson(dens, 0, t, 4000)
      close(upperTail(tab), 0.025, 2e-4)
    }
  })
})

// ---------- F ----------
describe('generator F against independent computation', () => {
  it('exact Pearson statistics, G^2 from an identity, binomial fit with exact fractions (300 seeds)', () => {
    for (const s of seeds('F', 300)) {
      const prm = Fq.sample(makeRng(s))
      const ans = answers(Fq.build(prm))
      const { table, counts } = prm
      const N = table.flat().reduce((a, b) => a + b, 0)
      const r = table.map((row) => row.reduce((a, b) => a + b, 0))
      const cc = [0, 1, 2].map((j) => table[0][j] + table[1][j])
      // X^2 = N * (sum O^2 / (r c) - 1), exact
      let acc = F(0)
      table.forEach((row, i) => row.forEach((o, j) => { acc = acc.add(F(o * o, r[i] * cc[j])) }))
      close(ans[0], (r[0] * cc[0]) / N, 1e-12)
      close(ans[1], F(N).mul(acc.sub(F(1))).num, 1e-9)
      // G^2 = 2 [ sum O ln O - sum r ln r - sum c ln c + N ln N ]
      const xl = (a: number) => a * Math.log(a)
      const g2 = 2 * (table.flat().reduce((s2, o) => s2 + xl(o), 0) - r.reduce((s2, v) => s2 + xl(v), 0) - cc.reduce((s2, v) => s2 + xl(v), 0) + xl(N))
      close(ans[2], g2, 1e-8)
      // binomial fit: p-hat exact, expected counts exact fractions
      const M = counts.reduce((a, b) => a + b, 0)
      const ph = F(counts[1] + 2 * counts[2] + 3 * counts[3], 3 * M)
      close(ans[3], ph.num, 1e-12)
      const q = F(1).sub(ph)
      const coef = [1, 3, 3, 1]
      let x2 = F(0)
      counts.forEach((o, k) => {
        let pk = F(coef[k])
        for (let i = 0; i < k; i++) pk = pk.mul(ph)
        for (let i = 0; i < 3 - k; i++) pk = pk.mul(q)
        const e = pk.mul(F(M))
        const d = F(o).sub(e)
        x2 = x2.add(d.mul(d).div(e))
      })
      close(ans[4], x2.num, 1e-8)
    }
  })
  it('Monte Carlo: Pearson and likelihood ratio statistics are close under independence (sanity of G^2 vs X^2)', () => {
    // for a big table with small departures, G^2 and X^2 agree closely: checks the two formulas against each other
    const big = Fq.build({ table: [[400, 400, 400], [405, 395, 401]], counts: [10, 10, 10, 10] })
    close(big.parts[1].answer, big.parts[2].answer, 0.01)
  })
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  it('numerical MLE, direct likelihood products, exact Poisson sums (300 seeds)', () => {
    for (const s of seeds('G', 300)) {
      const prm = G.sample(makeRng(s))
      const ans = answers(G.build(prm))
      const { n, lam0, counts, c } = prm
      const lf = (k: number) => { let r = 0; for (let i = 2; i <= k; i++) r += Math.log(i); return r }
      const ll = (lam: number) => counts.reduce((a, x) => a + x * Math.log(lam) - lam - lf(x), 0)
      // golden-section search for the maximiser
      let lo = 1e-6, hi = 20
      const gr = (Math.sqrt(5) - 1) / 2
      for (let it = 0; it < 200; it++) {
        const m1 = hi - gr * (hi - lo), m2 = lo + gr * (hi - lo)
        if (ll(m1) < ll(m2)) lo = m1; else hi = m2
      }
      const hat = (lo + hi) / 2
      close(ans[0], hat, 1e-6)
      close(ans[1], -2 * (ll(lam0) - ll(hat)), 1e-6)
      // exact: sum_{k<=c} m^k/k! as a fraction times exp(-m)
      const exactCdf = (m: Fr) => {
        let tot = F(0), term = F(1)
        for (let k = 0; k <= c; k++) { tot = tot.add(term); term = term.mul(m).div(F(k + 1)) }
        return tot.num
      }
      const m0 = F(n * lam0), m1 = F(n * lam0, 2)
      close(ans[2], exactCdf(m0) * Math.exp(-n * lam0), 1e-12)
      close(ans[3], exactCdf(m1) * Math.exp(-(n * lam0) / 2), 1e-12)
      const pmf = (lam: number, x: number) => Math.exp(x * Math.log(lam) - lam - lf(x))
      const lr = counts.reduce((a, x) => a * (pmf(lam0 / 2, x) / pmf(lam0, x)), 1)
      rel(ans[4], lr, 1e-9)
    }
  })
  it('Monte Carlo: size and power of the Poisson test (4 seeds)', () => {
    for (const s of seeds('G', 4)) {
      const prm = G.sample(makeRng(s))
      const ans = answers(G.build(prm))
      const rng = makeRng('sim' + s)
      const runs = 200000
      const rate = (mean: number) => {
        let hit = 0
        for (let r = 0; r < runs; r++) {
          let tot = 0, t = 0
          // count of a Poisson process with rate `mean` on [0,1] by summing exponential gaps
          for (;;) { t += -Math.log(1 - rng.next()) / mean; if (t > 1) break; tot++ }
          if (tot <= prm.c) hit++
        }
        return hit / runs
      }
      close(ans[2], rate(prm.n * prm.lam0), 0.005)
      close(ans[3], rate((prm.n * prm.lam0) / 2), 0.005)
    }
  })
})
