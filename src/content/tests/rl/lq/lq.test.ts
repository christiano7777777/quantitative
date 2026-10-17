// Every LQ answer is recomputed by a DIFFERENT method from the generator's own:
//  A: regret as total pulls times the best mean minus the earned reward (integers); the running-mean form of the incremental update;
//     UCB through exp/log; the Beta mean by Simpson integration of the density; the epsilon-greedy value by iterating the Bellman
//     equation over the explicit action probabilities, and by simulating Bernoulli bandit rewards.
//  B: the return by Horner's rule; policy evaluation by exact Gauss-Jordan (and by simulating the MDP); the action value from exact values;
//     V_2 by a depth-2 expectimax recursion; the contraction bound against exact fractions and the true error of V_3 (value iteration to convergence).
//  C: returns by the backward recursion in exact fractions; first-/every-visit by generic scans over episode lists; importance sampling in exact fractions.
//  D: TD(0), SARSA, Q-learning and 2-step SARSA in exact fractions (expected SARSA via (1-eps) max + eps mean); batch TD(0) by running the batch updates until convergence.
//  E: the n-step return by a loop; the lambda-return by its backward recursion; traces by explicit sums; the forward and backward views by the offline equivalence theorem.
//  F: the TD error and weight update with the semi-gradient obtained by differentiating a loss with a frozen target; DQN and Double DQN
//     targets by sorting; the soft target update by the closed form.
//  G: softmax by log-sum-exp; the policy gradient and the score function by finite differences (and the REINFORCE estimator by simulation); the ratio via logs.
//  H: the clipped objective by case analysis; the SAC target through log base 2; shaping through the telescoping identity; the execution reward by stepping the inventory in exact fractions.
import { describe, expect, it } from 'vitest'
import { makeRng } from '../../../../lib/rng'
import type { Rng } from '../../../../lib/rng'
import { topics } from '../../../../data'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { F, Fr, fpow, solveFr } from '../../../shared/fraction'
import * as A from './a-bandit'
import * as B from './b-mdp'
import * as C from './c-montecarlo'
import * as D from './d-td'
import * as E from './e-traces'
import * as Ff from './f-approx'
import * as G from './g-policygradient'
import * as H from './h-ppo-finance'
import bank from '../index'

const seeds = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const answers = (inst: LQInstance) => inst.parts.map((p) => p.answer)
const close = (got: number, want: number, tol = 1e-9) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThan(tol)
const lectures = topics.find((t) => t.id === 'rl')!.lectures.length
const simpson = (f: (x: number) => number, a: number, b: number, n = 4000) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3 }
const sum = (xs: number[]) => xs.reduce((s, v) => s + v, 0)

const gens: [string, LQGenerator, number, number[]][] = [
  ['A', { id: 'A', generate: (r) => A.build(A.sample(r)) }, 5, [1, 2, 3]],
  ['B', { id: 'B', generate: (r) => B.build(B.sample(r)) }, 5, [1, 2, 3]],
  ['C', { id: 'C', generate: (r) => C.build(C.sample(r)) }, 5, [4, 5, 6]],
  ['D', { id: 'D', generate: (r) => D.build(D.sample(r)) }, 5, [4, 5, 6]],
  ['E', { id: 'E', generate: (r) => E.build(E.sample(r)) }, 5, [4, 5, 6]],
  ['F', { id: 'F', generate: (r) => Ff.build(Ff.sample(r)) }, 5, [7, 8, 9, 10, 11]],
  ['G', { id: 'G', generate: (r) => G.build(G.sample(r)) }, 5, [7, 8, 9, 10, 11]],
  ['H', { id: 'H', generate: (r) => H.build(H.sample(r)) }, 5, [7, 8, 9, 10, 11]],
]

describe.each(gens)('generator %s: generic rules', (name, gen, nParts, slotLectures) => {
  it('has the expected number of parts and well-formed text and answers (300 seeds)', () => {
    for (const s of seeds(name, 300)) {
      const inst = gen.generate(makeRng(s))
      expect(inst.parts, s).toHaveLength(nParts)
      for (const text of [inst.intro, ...inst.parts.flatMap((p) => [p.prompt, p.explanation])]) {
        expect(text, s).not.toMatch(/NaN|undefined|Infinity|\[object/)
        expect(/[\u0000-\u001f\u007f]/.test(text), `${s}: control character in ${JSON.stringify(text)}`).toBe(false)
        expect((text.match(/\$/g) ?? []).length % 2, `${s}: ${text}`).toBe(0)
        expect(text, `${s}: adjacent dollar signs would open display math`).not.toContain('$$')
      }
      for (const p of inst.parts) {
        expect(Number.isFinite(p.answer), s).toBe(true)
        expect(p.lecture).toBeGreaterThanOrEqual(1)
        expect(p.lecture).toBeLessThanOrEqual(lectures)
        expect(slotLectures, `${s}: lecture ${p.lecture} outside the generator's slot`).toContain(p.lecture)
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

it('the LQ bank touches all lectures, and every generator touches at least two lectures of its slot', () => {
  const seen = new Set<number>()
  for (const [name, gen] of gens) {
    const own = new Set<number>()
    for (const s of seeds(name, 20)) gen.generate(makeRng(s)).parts.forEach((p) => { seen.add(p.lecture); own.add(p.lecture) })
    expect(own.size, name).toBeGreaterThanOrEqual(2)
  }
  expect([...seen].sort((a, b) => a - b)).toEqual(Array.from({ length: lectures }, (_, i) => i + 1))
})

it('the blueprint has three slots that each cover their lectures', () => {
  expect(bank.lqSlots).toHaveLength(3)
  const lecturesOf = (ids: string[]) => {
    const out = new Set<number>()
    for (const g of bank.lq.filter((x) => ids.includes(x.id))) for (const s of seeds('slot', 20)) g.generate(makeRng(s)).parts.forEach((p) => out.add(p.lecture))
    return [...out].sort((a, b) => a - b)
  }
  expect(lecturesOf(bank.lqSlots![0])).toEqual([1, 2, 3])
  expect(lecturesOf(bank.lqSlots![1])).toEqual([4, 5, 6])
  expect(lecturesOf(bank.lqSlots![2])).toEqual([7, 8, 9, 10, 11])
})

// ---------- A ----------
describe('generator A against independent computation', () => {
  it('regret, running mean, UCB, Beta mean, epsilon-greedy value (300 seeds)', () => {
    for (const s of seeds('A', 300)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      // regret = (pulls x best mean) - reward earned, all in hundredths
      const total = sum(p.cnt)
      close(ans[0], (total * Math.max(...p.muH) - p.cnt.reduce((acc, c, i) => acc + c * p.muH[i], 0)) / 100, 1e-9)
      // the sample average of n rewards is Q = (sum of rewards)/n, so the new average is (n Q + r)/(n+1)
      close(ans[1], F(p.qT * p.n, 10).add(F(p.r)).div(F(p.n + 1)).num, 1e-12)
      close(ans[2], p.qaH / 100 + p.c * Math.exp(0.5 * (Math.log(Math.log(p.t)) - Math.log(p.na))), 1e-10)
      const a = p.a0 + p.s, b = p.b0 + p.f
      const dens = (x: number) => Math.pow(x, a - 1) * Math.pow(1 - x, b - 1)
      close(ans[3], simpson((x) => x * dens(x), 0, 1) / simpson(dens, 0, 1), 1e-7)
      // epsilon-greedy: explicit action probabilities and Bellman iteration of the single state
      const eps = p.epsH / 100, gam = p.gamT / 10
      const top = p.muH.indexOf(Math.max(...p.muH))
      const pr = p.muH.map((_, i) => eps / 3 + (i === top ? 1 - eps : 0))
      let v = 0
      for (let k = 0; k < 4000; k++) v = sum(pr.map((q, i) => q * (p.muH[i] / 100 + gam * v)))
      close(ans[4], v, 1e-7)
    }
  })
  it('the epsilon-greedy value matches a simulation with Bernoulli rewards', () => {
    for (const s of seeds('Asim', 6)) {
      const p = A.sample(makeRng(s))
      const ans = answers(A.build(p))
      const rng = makeRng('sim' + s)
      const eps = p.epsH / 100, gam = p.gamT / 10
      const top = p.muH.indexOf(Math.max(...p.muH))
      const horizon = Math.ceil(Math.log(1e-4) / Math.log(gam))
      const n = 5000
      let tot = 0
      for (let e = 0; e < n; e++) {
        let g = 0, disc = 1
        for (let t = 0; t < horizon; t++) {
          const arm = rng.next() < eps ? rng.int(0, 2) : top
          g += disc * (rng.next() < p.muH[arm] / 100 ? 1 : 0)
          disc *= gam
        }
        tot += g
      }
      close(ans[4], tot / n, 0.12)
    }
  })
})

// ---------- B ----------
describe('generator B against independent computation', () => {
  const mdp = (p: B.Params) => ({ gam: F(p.g10, 10), pr: (s: number, a: number) => F(p.p[s][a], 10) })
  it('Horner return, exact policy evaluation, action value, expectimax, contraction bound (300 seeds)', () => {
    for (const s of seeds('B', 300)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      const { gam, pr } = mdp(p)
      // Horner: ((r4 g + r3) g + r2) g + r1
      let G = F(0)
      for (let i = 3; i >= 0; i--) G = G.mul(gam).add(F(p.rs[i]))
      close(ans[0], G.num, 1e-12)
      // exact (I - gamma P) v = r
      const rowOf = (st: number) => { const a = p.pol[st]; const pe = pr(st, a); return [pe, F(1).sub(pe)] }
      const M = [0, 1].map((st) => [0, 1].map((c) => (st === c ? F(1) : F(0)).sub(gam.mul(rowOf(st)[c]))))
      const v = solveFr(M, [F(p.R[0][p.pol[0]]), F(p.R[1][p.pol[1]])])
      close(ans[1], v[0].num, 1e-12)
      const alt = 1 - p.pol[0]
      const q = F(p.R[0][alt]).add(gam.mul(pr(0, alt).mul(v[0]).add(F(1).sub(pr(0, alt)).mul(v[1]))))
      close(ans[2], q.num, 1e-12)
      // depth-2 expectimax tree
      const g = p.g10 / 10
      const val = (st: number, d: number): number => d === 0 ? 0 : Math.max(...[0, 1].map((a) => { const pe = p.p[st][a] / 10; return p.R[st][a] + g * (pe * val(0, d - 1) + (1 - pe) * val(1, d - 1)) }))
      close(ans[3], val(0, 2), 1e-9)
      // contraction bound: closed form in fractions, and it must really dominate the true error of V_3
      const delta = Math.max(...[0, 1].map((st) => Math.abs(Math.max(...p.R[st]))))
      close(ans[4], fpow(gam, 3).div(F(1).sub(gam)).mul(F(delta)).num, 1e-12)
      const iter = (V: number[]) => [0, 1].map((st) => Math.max(...[0, 1].map((a) => { const pe = p.p[st][a] / 10; return p.R[st][a] + g * (pe * V[0] + (1 - pe) * V[1]) })))
      let V = [0, 0]
      const Vs = [V]
      for (let k = 0; k < 600; k++) { V = iter(V); Vs.push(V) }
      const err = Math.max(Math.abs(Vs[3][0] - V[0]), Math.abs(Vs[3][1] - V[1]))
      expect(err, `${s}: bound ${ans[4]} must dominate the true error ${err}`).toBeLessThanOrEqual(ans[4] + 1e-9)
    }
  })
  it('policy evaluation matches a simulation of the MDP', () => {
    for (const s of seeds('Bsim', 6)) {
      const p = B.sample(makeRng(s))
      const ans = answers(B.build(p))
      const rng = makeRng('simB' + s)
      const gam = p.g10 / 10
      const horizon = Math.ceil(Math.log(1e-4) / Math.log(gam))
      const n = 8000
      let tot = 0
      for (let e = 0; e < n; e++) {
        let st = 0, g = 0, disc = 1
        for (let t = 0; t < horizon; t++) {
          const a = p.pol[st]
          g += disc * p.R[st][a]
          disc *= gam
          st = rng.next() < p.p[st][a] / 10 ? 0 : 1
        }
        tot += g
      }
      close(ans[1], tot / n, 0.45)
    }
  })
})

// ---------- C ----------
describe('generator C against independent computation', () => {
  it('returns by the backward recursion, first/every visit by scanning, importance sampling in fractions (300 seeds)', () => {
    for (const s of seeds('C', 300)) {
      const p = C.sample(makeRng(s))
      const ans = answers(C.build(p))
      const gam = F(p.g10, 10)
      const episodes = [
        { states: ['A', 'B', 'A'], rewards: p.e1 },
        { states: ['B', 'A'], rewards: p.e2 },
        { states: ['A', 'A', 'B'], rewards: p.e3 },
      ]
      const returns = episodes.map((ep) => {
        const out: Fr[] = Array(ep.rewards.length)
        let nxt = F(0)
        for (let t = ep.rewards.length - 1; t >= 0; t--) { nxt = F(ep.rewards[t]).add(gam.mul(nxt)); out[t] = nxt }
        return out
      })
      const first: Fr[] = [], every: Fr[] = []
      episodes.forEach((ep, i) => {
        const seen = new Set<string>()
        ep.states.forEach((st, t) => {
          if (st !== 'A') return
          every.push(returns[i][t])
          if (!seen.has(st)) first.push(returns[i][t])
          seen.add(st)
        })
      })
      const mean = (xs: Fr[]) => xs.reduce((a, b) => a.add(b), F(0)).div(F(xs.length))
      close(ans[0], mean(first).num, 1e-12)
      close(ans[1], mean(every).num, 1e-12)
      expect(first).toHaveLength(3)
      expect(every).toHaveLength(5)
      const rho = [0, 1, 2].map((i) => F(p.pi[i][0], p.b[i][0]).mul(F(p.pi[i][1], p.b[i][1])))
      const rg = rho.map((r, i) => r.mul(F(p.g[i])))
      const tot = rg.reduce((a, b) => a.add(b), F(0))
      close(ans[2], tot.div(F(3)).num, 1e-12)
      close(ans[3], tot.div(rho.reduce((a, b) => a.add(b), F(0))).num, 1e-12)
      // TD(0), alpha = 1/2, through episode 1 with a generic value table; the episode ends after its last reward
      const Vt: Record<string, Fr> = { A: F(0), B: F(0) }
      const half = F(1, 2)
      episodes[0].states.forEach((st, t) => {
        const nextSt = episodes[0].states[t + 1]
        const nextV = nextSt ? Vt[nextSt] : F(0)
        Vt[st] = Vt[st].add(half.mul(F(episodes[0].rewards[t]).add(gam.mul(nextV)).sub(Vt[st])))
      })
      close(ans[4], Vt.A.num, 1e-12)
    }
  })
  it('ordinary importance sampling is unbiased for the target policy (simulation of a two-step toy problem)', () => {
    // a start state with two actions at each of two steps; the return is the number of times action 1 was taken
    const rng = makeRng('IS')
    const target = [0.8, 0.5], behave = [0.4, 0.25] // probability of action 1 at step 1 and step 2
    const n = 400000
    let tot = 0
    for (let i = 0; i < n; i++) {
      let rho = 1, ret = 0
      for (let t = 0; t < 2; t++) {
        const a1 = rng.next() < behave[t]
        rho *= (a1 ? target[t] : 1 - target[t]) / (a1 ? behave[t] : 1 - behave[t])
        ret += a1 ? 1 : 0
      }
      tot += rho * ret
    }
    close(tot / n, target[0] + target[1], 0.03)
  })
})

// ---------- D ----------
describe('generator D against independent computation', () => {
  it('TD(0), SARSA, Q-learning and 2-step SARSA in exact fractions (300 seeds)', () => {
    for (const s of seeds('D', 300)) {
      const p = D.sample(makeRng(s))
      const ans = answers(D.build(p))
      const alpha = F(p.alpha100, 100), gam = F(p.gam100, 100)
      const upd = (x: Fr, target: Fr) => x.add(alpha.mul(target.sub(x)))
      const r = F(p.r)
      close(ans[0], upd(F(p.v, 10), r.add(gam.mul(F(p.v2, 10)))).num, 1e-12)
      close(ans[1], upd(F(p.q, 10), r.add(gam.mul(F(p.qn[p.ap], 10)))).num, 1e-12)
      const sorted = [...p.qn].sort((a, b) => b - a)
      expect(sorted[0], 'the taken action differs from the greedy one').not.toBe(p.qn[p.ap])
      close(ans[2], upd(F(p.q, 10), r.add(gam.mul(F(sorted[0], 10)))).num, 1e-12)
      // 2-step SARSA: the target is the 2-step return, accumulated by the backward recursion
      const G2 = F(p.r).add(gam.mul(F(p.r2).add(gam.mul(F(p.q2, 10)))))
      close(ans[3], upd(F(p.q, 10), G2).num, 1e-12)
    }
  })
  it('batch TD(0) by running the batch updates until convergence (100 seeds)', () => {
    for (const s of seeds('Dbatch', 100)) {
      const p = D.sample(makeRng(s))
      const ans = answers(D.build(p))
      const tr: { s: 'A' | 'B'; r: number; next: 'B' | null }[] = [{ s: 'A', r: p.ra, next: 'B' }, { s: 'B', r: p.rb, next: null }]
      for (let i = 0; i < p.m; i++) tr.push({ s: 'B', r: i < p.k ? 1 : 0, next: null })
      const V = { A: 0, B: 0 }
      const alpha = 0.02
      for (let sweep = 0; sweep < 8000; sweep++) {
        const inc = { A: 0, B: 0 }
        for (const t of tr) inc[t.s] += alpha * (t.r + (t.next ? V[t.next] : 0) - V[t.s])
        V.A += inc.A; V.B += inc.B
      }
      close(ans[4], V.A - (p.ra + p.rb), 1e-5) // batch TD minus batch Monte Carlo (the only return seen from A is ra + rb)
    }
  })
})

// ---------- E ----------
describe('generator E against independent computation', () => {
  it('n-step return, lambda-return recursion, explicit-sum traces (300 seeds)', () => {
    for (const s of seeds('E', 300)) {
      const p = E.sample(makeRng(s))
      const ans = answers(E.build(p))
      const gam = F(p.gam100, 100), lam = F(p.lam100, 100)
      let g = F(0)
      for (let i = 0; i < 3; i++) g = g.add(fpow(gam, i).mul(F(p.rs[i])))
      g = g.add(fpow(gam, 3).mul(F(p.v3, 10)))
      close(ans[0], g.num, 1e-12)
      // lambda-return by G_t = R + gamma [ (1 - lambda) V(S') + lambda G_{t+1} ] with the episode ending after the third reward
      const Vn = [F(0), F(p.w1, 10), F(p.w2, 10), F(0)] // V(S_0) unused; V(S_3) = terminal = 0
      let Gl = F(0)
      for (let t = 2; t >= 0; t--) Gl = F(p.qs[t]).add(gam.mul(F(1).sub(lam).mul(Vn[t + 1]).add(lam.mul(Gl))))
      close(ans[1], Gl.num, 1e-12)
      // traces by explicit sums over the visits
      const gl = gam.mul(lam)
      const visits = (st: number) => p.seq.map((x, i) => (x === st ? i : -1)).filter((i) => i >= 0)
      const acc = (st: number) => visits(st).reduce((a, i) => a.add(fpow(gl, 5 - i)), F(0))
      close(ans[2], acc(p.X).num, 1e-12)
      const last = visits(p.X)[visits(p.X).length - 1]
      close(ans[3], fpow(gl, 5 - last).num, 1e-12)
      close(ans[4], F(p.alpha100, 100).mul(F(p.delta10, 10)).mul(acc(p.Y)).num, 1e-12)
    }
  })
  it('forward and backward views agree for offline updates (this validates the lambda-return and the trace recursion)', () => {
    for (const s of seeds('Efb', 100)) {
      const rng = makeRng(s)
      const T = rng.int(3, 7)
      const states = Array.from({ length: T }, () => rng.int(0, 2))
      const rewards = Array.from({ length: T }, () => rng.int(-2, 5))
      const V = [rng.int(0, 40) / 10, rng.int(0, 40) / 10, rng.int(0, 40) / 10]
      const gam = rng.pick([0.5, 0.8, 0.9]), lam = rng.pick([0.3, 0.6, 0.9]), alpha = 0.1
      // forward view: sum over visits of alpha (G^lambda_t - V(S_t)), G^lambda from the n-step returns directly
      const nstep = (t: number, n: number) => {
        let g = 0
        for (let k = 0; k < n; k++) g += gam ** k * rewards[t + k]
        return t + n >= T ? g : g + gam ** n * V[states[t + n]]
      }
      const forward = [0, 0, 0]
      for (let t = 0; t < T; t++) {
        let gl = 0
        for (let n = 1; n < T - t; n++) gl += (1 - lam) * lam ** (n - 1) * nstep(t, n)
        gl += lam ** (T - t - 1) * nstep(t, T - t)
        forward[states[t]] += alpha * (gl - V[states[t]])
      }
      // backward view with accumulating traces, values frozen during the episode
      const backward = [0, 0, 0]
      const e = [0, 0, 0]
      for (let t = 0; t < T; t++) {
        for (let i = 0; i < 3; i++) e[i] *= gam * lam
        e[states[t]] += 1
        const next = t + 1 < T ? V[states[t + 1]] : 0
        const delta = rewards[t] + gam * next - V[states[t]]
        for (let i = 0; i < 3; i++) backward[i] += alpha * delta * e[i]
      }
      for (let i = 0; i < 3; i++) close(forward[i], backward[i], 1e-9)
    }
  })
})

// ---------- F ----------
describe('generator F against independent computation', () => {
  it('TD error, semi-gradient update (derivative of a frozen-target loss), DQN targets, soft update (300 seeds)', () => {
    for (const s of seeds('F', 300)) {
      const p = Ff.sample(makeRng(s))
      const ans = answers(Ff.build(p))
      const w = p.w.map((v) => F(v, 10))
      const dot = (x: number[]) => x.reduce((a, xi, i) => a.add(F(xi).mul(w[i])), F(0))
      const gam = F(p.gam100, 100), alpha = F(p.alpha100, 100)
      const delta = F(p.r).add(gam.mul(dot(p.x2))).sub(dot(p.x))
      close(ans[0], delta.num, 1e-12)
      // loss L(w) = 1/2 (T - w.x)^2 with T frozen at r + gamma v(s'); the update is w - alpha dL/dw
      const T = F(p.r).add(gam.mul(dot(p.x2))).num
      const loss = (wv: number[]) => 0.5 * (T - wv.reduce((a, wi, i) => a + wi * p.x[i], 0)) ** 2
      const w0 = w.map((x) => x.num)
      const h = 1e-6
      const up = [...w0], dn = [...w0]
      up[p.j] += h; dn[p.j] -= h
      const grad = (loss(up) - loss(dn)) / (2 * h)
      close(ans[1], w0[p.j] - alpha.num * grad, 1e-6)
      // DQN targets via sorting
      const g2 = F(p.g2100, 100)
      const byT = [...p.qt].sort((a, b) => b - a)
      close(ans[2], F(p.r2).add(g2.mul(F(byT[0], 10))).num, 1e-12)
      const order = [0, 1, 2].sort((i, j) => p.qo[j] - p.qo[i])
      expect(p.qt[order[0]], 'Double DQN differs from DQN in the construction').not.toBe(byT[0])
      close(ans[3], F(p.r2).add(g2.mul(F(p.qt[order[0]], 10))).num, 1e-12)
      // soft update: closed form theta + (1-tau)^k (theta0 - theta)
      const tau = F(p.tau100, 100)
      close(ans[4], F(p.th, 10).add(fpow(F(1).sub(tau), p.steps).mul(F(p.th0, 10).sub(F(p.th, 10)))).num, 1e-12)
    }
  })
})

// ---------- G ----------
describe('generator G against independent computation', () => {
  const lse = (h: number[]) => { const m = Math.max(...h); return m + Math.log(sum(h.map((x) => Math.exp(x - m)))) }
  const logpi = (h: number[], a: number) => h[a] - lse(h)
  it('softmax, finite-difference gradients, ratio through logs (300 seeds)', () => {
    for (const s of seeds('G', 300)) {
      const p = G.sample(makeRng(s))
      const ans = answers(G.build(p))
      const h = p.h.map((v) => v / 2), q = p.q.map((v) => v / 10)
      close(ans[0], Math.exp(logpi(h, p.ia)), 1e-12)
      const J = (hv: number[]) => sum(hv.map((_, i) => Math.exp(logpi(hv, i)) * q[i]))
      const eps = 1e-5
      const shift = (hv: number[], i: number, d: number) => hv.map((x, k) => (k === i ? x + d : x))
      close(ans[1], (J(shift(h, p.ie, eps)) - J(shift(h, p.ie, -eps))) / (2 * eps), 1e-7)
      // REINFORCE with baseline: change of h(d) = alpha (G - b) d ln pi(c) / d h(d)
      const score = (c: number, d: number) => (logpi(shift(h, d, eps), c) - logpi(shift(h, d, -eps), c)) / (2 * eps)
      close(ans[2], (p.alpha100 / 100) * (p.G / 10 - p.b / 10) * score(p.c, p.d), 1e-7)
      const delta = p.r + (p.gam100 / 100) * (p.v2 / 10) - p.v / 10
      close(ans[3], (p.alpha2100 / 100) * delta * score(p.c, p.c), 1e-7)
      const hn = h.map((x, i) => x + p.dh[i] / 10)
      close(ans[4], Math.exp(logpi(hn, p.ia) - logpi(h, p.ia)), 1e-10)
    }
  })
  it('the exact policy gradient is the mean of the REINFORCE estimator (simulation)', () => {
    for (const s of seeds('Gsim', 4)) {
      const p = G.sample(makeRng(s))
      const ans = answers(G.build(p))
      const h = p.h.map((v) => v / 2), q = p.q.map((v) => v / 10)
      const pi = [0, 1, 2].map((a) => Math.exp(logpi(h, a)))
      const rng: Rng = makeRng('simG' + s)
      const n = 600000
      let tot = 0
      for (let i = 0; i < n; i++) {
        const u = rng.next()
        const a = u < pi[0] ? 0 : u < pi[0] + pi[1] ? 1 : 2
        tot += q[a] * ((a === p.ie ? 1 : 0) - pi[p.ie]) // return = q(a), score = 1[a=e] - pi(e)
      }
      close(ans[1], tot / n, 0.02)
    }
  })
})

// ---------- H ----------
describe('generator H against independent computation', () => {
  it('clipped objective by cases, SAC target, shaping telescoping, execution reward by stepping the inventory (300 seeds)', () => {
    for (const s of seeds('H', 300)) {
      const p = H.sample(makeRng(s))
      const ans = answers(H.build(p))
      const eps = p.eps100 / 100
      // PPO: for A > 0 the objective is A min(r, 1+eps); for A < 0 it is A max(r, 1-eps)
      const obj = (r: number, a: number) => (a > 0 ? a * Math.min(r, 1 + eps) : a * Math.max(r, 1 - eps))
      close(ans[0], obj(1 + eps + p.k1 / 10, p.A1 / 10), 1e-10)
      const rr = [1 - eps - (p.ks[0] / 10) * 0.5, 1 + eps + p.ks[1] / 10, 1 - eps - (p.ks[2] / 10) * 0.5]
      const AA = [p.As[0] / 10, -p.As[1] / 10, -p.As[2] / 10]
      close(ans[1], sum(rr.map((r, i) => obj(r, AA[i]))) / 3, 1e-10)
      // SAC target: -alpha ln pi = alpha ln 2 log2(1/pi)
      const gam = p.gam100 / 100
      const y = p.rs + gam * (Math.min(p.Q1, p.Q2) / 10 + (p.temp100 / 100) * Math.LN2 * Math.log2(100 / p.pa))
      close(ans[2], y, 1e-10)
      // shaping: sum gamma^t F_t = gamma^3 Phi(s3) - Phi(s0) = -Phi(s0); the shaped return is the original one minus Phi(s0)
      const g = F(p.gs, 10)
      let orig = F(0)
      for (let t = 0; t < 3; t++) orig = orig.add(fpow(g, t).mul(F(p.rw[t])))
      close(ans[3], orig.sub(F(p.phi[0])).num, 1e-12)
      // execution: step the inventory
      const eta = F(p.eta100, 100), lam = F(p.lam100, 100)
      let inv = p.v[0] + p.v[1] + p.v[2]
      let total = F(0)
      for (const v of p.v) {
        inv -= v
        total = total.sub(eta.mul(F(v * v))).sub(lam.mul(F(inv * inv)))
      }
      expect(inv).toBe(0)
      close(ans[4], total.num, 1e-12)
    }
  })
  it('the PPO clipped objective is a pessimistic bound: never above the unclipped one (property over a grid)', () => {
    for (const eps of [0.1, 0.2, 0.3]) for (let r = 0.2; r <= 2; r += 0.05) for (const a of [-2, -0.5, 0.5, 2]) {
      const clipped = Math.min(r * a, Math.min(Math.max(r, 1 - eps), 1 + eps) * a)
      expect(clipped).toBeLessThanOrEqual(r * a + 1e-12)
    }
  })
})
