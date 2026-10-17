// LQ-B: a two-state, two-action MDP by hand: a discounted return, policy evaluation (2x2 Bellman system),
// an action value, two sweeps of value iteration and the contraction error bound.
// Lectures 2 (MDPs, Bellman equations) and 3 (dynamic programming).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params {
  g10: number // discount in tenths
  R: number[][] // R[s][a]: expected reward of action a in state s
  p: number[][] // p[s][a]: probability (in tenths) of moving to state 1; otherwise state 2
  pol: number[] // deterministic policy: action chosen in each state
  rs: number[] // reward sequence for the return
}

export function sample(rng: Rng): Params {
  return {
    g10: rng.pick([5, 6, 8, 9]),
    R: [[rng.int(-2, 6), rng.int(-2, 6)], [rng.int(-2, 6), rng.int(-2, 6)]],
    p: [[rng.int(0, 10), rng.int(0, 10)], [rng.int(0, 10), rng.int(0, 10)]],
    pol: [rng.int(0, 1), rng.int(0, 1)],
    rs: [rng.int(0, 8), rng.int(0, 8), rng.int(0, 8), rng.int(0, 8)],
  }
}

export function build(P: Params): LQInstance {
  const gam = P.g10 / 10
  const pr = (s: number, a: number) => P.p[s][a] / 10
  const G0 = P.rs[0] + gam * P.rs[1] + gam ** 2 * P.rs[2] + gam ** 3 * P.rs[3]

  // policy evaluation: (I - gamma P_pi) V = R_pi, solved by Cramer's rule
  const p1 = pr(0, P.pol[0]), p2 = pr(1, P.pol[1])
  const R1 = P.R[0][P.pol[0]], R2 = P.R[1][P.pol[1]]
  const a11 = 1 - gam * p1, a12 = -gam * (1 - p1), a21 = -gam * p2, a22 = 1 - gam * (1 - p2)
  const det = a11 * a22 - a12 * a21
  const V1 = (R1 * a22 - a12 * R2) / det
  const V2 = (a11 * R2 - a21 * R1) / det

  // action value of the action that pi does not take in state 1
  const alt = 1 - P.pol[0]
  const qAlt = P.R[0][alt] + gam * (pr(0, alt) * V1 + (1 - pr(0, alt)) * V2)

  // two sweeps of value iteration from zero
  const v1 = [Math.max(P.R[0][0], P.R[0][1]), Math.max(P.R[1][0], P.R[1][1])]
  const sweep = (a: number) => P.R[0][a] + gam * (pr(0, a) * v1[0] + (1 - pr(0, a)) * v1[1])
  const v2s1 = Math.max(sweep(0), sweep(1))

  const delta = Math.max(Math.abs(v1[0]), Math.abs(v1[1]))
  const bound = (gam ** 3 / (1 - gam)) * delta

  const table = [0, 1]
    .map((s) =>
      'in state ' + tex('s_' + (s + 1)) + ', action ' + tex('a_1') + ' gives reward ' + tex(P.R[s][0]) + ' and goes to ' + tex('s_1') + ' with probability ' + tex(dec(pr(s, 0))) + ', action ' + tex('a_2') + ' gives reward ' + tex(P.R[s][1]) + ' and goes to ' + tex('s_1') + ' with probability ' + tex(dec(pr(s, 1))) + ' (otherwise to ' + tex('s_2') + ')')
    .join('; ')
  const act = (a: number) => tex('a_' + (a + 1))

  return {
    intro: 'An MDP has two states ' + tex('s_1,s_2') + ' and two actions, with discount ' + tex('\\gamma=' + dec(gam)) + '; ' + table + '. Rewards are received on the transition. Give all answers to 3 decimal places.',
    parts: [
      {
        prompt: 'An episode produces the rewards ' + tex(P.rs.join(',\\ ')) + ' at times ' + tex('1,2,3,4') + '. Find the discounted return ' + tex('G_0') + '.',
        answer: G0, tolerance: tol3, lecture: 2,
        explanation: tex('G_0=' + P.rs[0] + '+' + dec(gam) + '\\times' + P.rs[1] + '+' + dec(gam ** 2) + '\\times' + P.rs[2] + '+' + dec(gam ** 3) + '\\times' + P.rs[3] + '=' + dec(G0)) + '.',
      },
      {
        prompt: 'The deterministic policy ' + tex('\\pi') + ' plays ' + act(P.pol[0]) + ' in ' + tex('s_1') + ' and ' + act(P.pol[1]) + ' in ' + tex('s_2') + '. Find ' + tex('v_\\pi(s_1)') + '.',
        answer: V1, tolerance: tol3, lecture: 2,
        explanation: 'Bellman equations: ' + tex('v_1=' + R1 + '+' + dec(gam) + '(' + dec(p1) + 'v_1+' + dec(1 - p1) + 'v_2)') + ' and ' + tex('v_2=' + R2 + '+' + dec(gam) + '(' + dec(p2) + 'v_1+' + dec(1 - p2) + 'v_2)') + '. Solving the two linear equations gives ' + tex('v_1=' + dec(V1) + ',\\ v_2=' + dec(V2)) + '.',
      },
      {
        prompt: 'Using the same policy values, find the action value ' + tex('q_\\pi(s_1,' + 'a_' + (alt + 1) + ')') + ' of the action that ' + tex('\\pi') + ' does not take in ' + tex('s_1') + '.',
        answer: qAlt, tolerance: tol3, lecture: 2,
        explanation: tex('q=r+\\gamma\\,[\\,p\\,v_1+(1-p)\\,v_2\\,]=' + P.R[0][alt] + '+' + dec(gam) + '(' + dec(pr(0, alt)) + '\\times' + dec(V1) + '+' + dec(1 - pr(0, alt)) + '\\times' + dec(V2) + ')=' + dec(qAlt)) + '.',
      },
      {
        prompt: 'Start value iteration from ' + tex('V_0=(0,0)') + ' and perform two sweeps of the Bellman optimality update. Find ' + tex('V_2(s_1)') + '.',
        answer: v2s1, tolerance: tol3, lecture: 3,
        explanation: 'Sweep 1 gives the best immediate reward: ' + tex('V_1=(' + v1[0] + ',' + v1[1] + ')') + '. Sweep 2 in ' + tex('s_1') + ' takes the larger of ' + tex(dec(sweep(0))) + ' (for ' + tex('a_1') + ') and ' + tex(dec(sweep(1))) + ' (for ' + tex('a_2') + '), so ' + tex('V_2(s_1)=' + dec(v2s1)) + '.',
      },
      {
        prompt: 'Use the contraction bound ' + tex('\\|V_k-v_*\\|_\\infty\\le\\frac{\\gamma^k}{1-\\gamma}\\|V_1-V_0\\|_\\infty') + ' with ' + tex('V_0=(0,0)') + ' to bound the error of ' + tex('V_3') + '. What is the right-hand side for ' + tex('k=3') + '?',
        answer: bound, tolerance: tol3, lecture: 3,
        explanation: tex('\\|V_1-V_0\\|_\\infty=' + dec(delta)) + ', so the bound is ' + tex('\\frac{' + dec(gam ** 3) + '}{' + dec(1 - gam) + '}\\times' + dec(delta) + '=' + dec(bound)) + '.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'rl-lq-b-mdp', generate: (rng) => build(sample(rng)) }
