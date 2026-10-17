// LQ-D: temporal-difference updates by hand: TD(0), SARSA, Q-learning, a 2-step SARSA update, and batch TD(0) against batch Monte Carlo.
// Lectures 4 (Monte Carlo), 5 (temporal-difference learning) and 6 (n-step methods).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params {
  alpha100: number // step size in hundredths
  gam100: number // discount in hundredths
  v: number // V(s) in tenths
  v2: number // V(s') in tenths
  r: number // reward
  q: number // Q(s,a) in tenths
  qn: number[] // Q(s', .) for three actions, in tenths (distinct)
  ap: number // index of the action a' that was actually taken in s'
  r2: number // second reward for the 2-step SARSA update
  q2: number // Q(s'', a'') in tenths
  ra: number // batch data: reward A -> B
  rb: number // reward on leaving B in the A episode
  m: number // number of episodes that start in B
  k: number // how many of them gave reward 1
}

export function sample(rng: Rng): Params {
  const qn = rng.sample(Array.from({ length: 51 }, (_, i) => i), 3)
  const best = qn.indexOf(Math.max(...qn))
  const others = [0, 1, 2].filter((i) => i !== best)
  const m = rng.int(5, 9)
  return {
    alpha100: rng.pick([10, 20, 25, 50]), gam100: rng.pick([50, 80, 90]),
    v: rng.int(0, 40), v2: rng.int(0, 40), r: rng.int(-2, 6), q: rng.int(0, 40), qn,
    ap: rng.pick(others), r2: rng.int(-2, 6), q2: rng.int(0, 50),
    ra: rng.int(0, 2), rb: rng.int(0, 1), m, k: rng.int(2, m - 1),
  }
}

export function build(P: Params): LQInstance {
  const alpha = P.alpha100 / 100, gam = P.gam100 / 100
  const v = P.v / 10, v2 = P.v2 / 10, q = P.q / 10
  const qn = P.qn.map((x) => x / 10)
  const td = P.r + gam * v2 - v
  const vNew = v + alpha * td
  const sarsa = q + alpha * (P.r + gam * qn[P.ap] - q)
  const qmax = Math.max(...qn)
  const ql = q + alpha * (P.r + gam * qmax - q)
  const q2 = P.q2 / 10
  const G2 = P.r + gam * P.r2 + gam ** 2 * q2
  const nstep = q + alpha * (G2 - q)
  const vB = (P.rb + P.k) / (P.m + 1)
  const vA = P.ra + vB
  const diff = vA - (P.ra + P.rb) // batch TD minus batch Monte Carlo

  return {
    intro: 'Step size ' + tex('\\alpha=' + dec(alpha)) + ' and discount ' + tex('\\gamma=' + dec(gam)) + ' are used in parts 1 to 4. Give all answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Under a fixed policy the agent moves from state ' + tex('s') + ' with ' + tex('V(s)=' + dec(v)) + ' to state ' + tex('s\'') + ' with ' + tex('V(s\')=' + dec(v2)) + ' and receives reward ' + tex(P.r) + '. What is ' + tex('V(s)') + ' after the TD(0) update?',
        answer: vNew, tolerance: tol3, lecture: 5,
        explanation: 'TD error ' + tex('\\delta=' + P.r + '+' + dec(gam) + '\\times' + dec(v2) + '-' + dec(v) + '=' + dec(td)) + ', so ' + tex('V(s)\\leftarrow ' + dec(v) + '+' + dec(alpha) + '\\times' + dec(td) + '=' + dec(vNew)) + '.',
      },
      {
        prompt: 'In an action-value problem the agent was in ' + tex('s') + ' with ' + tex('Q(s,a)=' + dec(q)) + ', took ' + tex('a') + ', received reward ' + tex(P.r) + ' and arrived in ' + tex('s\'') + ', where ' + tex('Q(s\',\\cdot)=(' + qn.map(dec).join(',\\ ') + ')') + ' for the three actions. It then took action number ' + (P.ap + 1) + ' in ' + tex('s\'') + '. What is ' + tex('Q(s,a)') + ' after the SARSA update?',
        answer: sarsa, tolerance: tol3, lecture: 5,
        explanation: 'SARSA uses the action actually taken: target ' + tex(P.r + '+' + dec(gam) + '\\times' + dec(qn[P.ap]) + '=' + dec(P.r + gam * qn[P.ap])) + ', so ' + tex('Q\\leftarrow ' + dec(q) + '+' + dec(alpha) + '(' + dec(P.r + gam * qn[P.ap]) + '-' + dec(q) + ')=' + dec(sarsa)) + '.',
      },
      {
        prompt: 'With the same transition, what is ' + tex('Q(s,a)') + ' after the Q-learning update?',
        answer: ql, tolerance: tol3, lecture: 5,
        explanation: 'Q-learning uses the maximum over next actions, ' + tex(dec(qmax)) + ': target ' + tex(P.r + '+' + dec(gam) + '\\times' + dec(qmax) + '=' + dec(P.r + gam * qmax)) + ', so ' + tex('Q\\leftarrow ' + dec(q) + '+' + dec(alpha) + '(' + dec(P.r + gam * qmax) + '-' + dec(q) + ')=' + dec(ql)) + '.',
      },
      {
        prompt: 'A 2-step SARSA update starts from the same ' + tex('Q(s,a)=' + dec(q)) + ': the agent receives reward ' + tex(P.r) + ', then (after one more action) reward ' + tex(P.r2) + ', and then reaches a state-action pair with ' + tex('Q=' + dec(q2)) + '. What is ' + tex('Q(s,a)') + ' after the update with the 2-step return as target?',
        answer: nstep, tolerance: tol3, lecture: 6,
        explanation: 'The 2-step return is ' + tex('G=' + P.r + '+' + dec(gam) + '\\times' + P.r2 + '+' + dec(gam ** 2) + '\\times' + dec(q2) + '=' + dec(G2)) + ', so ' + tex('Q\\leftarrow ' + dec(q) + '+' + dec(alpha) + '(' + dec(G2) + '-' + dec(q) + ')=' + dec(nstep)) + '.',
      },
      {
        prompt: 'Undiscounted data (all values start at 0 and ' + tex('\\gamma=1') + '): one episode went ' + tex('A') + ' with reward ' + P.ra + ' to ' + tex('B') + ' and then ended with reward ' + P.rb + '. Another ' + tex(P.m) + ' episodes started in ' + tex('B') + ': ' + tex(P.k) + ' of them ended with reward 1 and ' + tex(P.m - P.k) + ' with reward 0. Batch TD(0), run repeatedly on these ' + tex(P.m + 1) + ' episodes until convergence, gives one estimate of ' + tex('V(A)') + ', and batch Monte Carlo gives another. What is the batch TD estimate minus the batch Monte Carlo estimate?',
        answer: diff, tolerance: tol3, lecture: 4,
        explanation: 'Batch TD(0) converges to the certainty-equivalence values. State ' + tex('B') + ' was left ' + tex(P.m + 1) + ' times with total reward ' + tex(P.rb + P.k) + ', so ' + tex('V(B)=' + dec(vB)) + ' and ' + tex('V_{TD}(A)=' + P.ra + '+V(B)=' + dec(vA)) + '. Batch Monte Carlo averages the only return seen from ' + tex('A') + ': ' + tex(P.ra + P.rb) + '. The difference is ' + tex(dec(diff)) + '.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'rl-lq-d-td', generate: (rng) => build(sample(rng)) }
