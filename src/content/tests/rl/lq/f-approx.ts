// LQ-F: linear function approximation and DQN targets by hand: the TD error and a semi-gradient weight update,
// the DQN target, the Double DQN target and a soft (Polyak) target-network update.
// Lectures 7 (function approximation) and 8 (deep Q-networks).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params {
  w: number[] // weights in tenths (3)
  x: number[] // features of s (first is the constant 1)
  x2: number[] // features of s'
  r: number
  gam100: number
  alpha100: number
  j: number // index of the weight asked (0-based, x[j] != 0)
  r2: number // DQN reward
  g2100: number // DQN discount
  qt: number[] // target-network Q(s', .) in tenths (3 distinct values)
  qo: number[] // online-network Q(s', .) in tenths (3 distinct values, argmax differs from qt)
  th: number // online parameter (tenths)
  th0: number // target parameter at the start (tenths)
  tau100: number
  steps: number
}

export function sample(rng: Rng): Params {
  const feat = () => [1, rng.int(0, 3), rng.int(0, 3)]
  const x = feat()
  const cand = [0, 1, 2].filter((i) => x[i] !== 0)
  for (;;) {
    const qt = rng.sample(Array.from({ length: 61 }, (_, i) => i), 3)
    const qo = rng.sample(Array.from({ length: 61 }, (_, i) => i), 3)
    if (qt.indexOf(Math.max(...qt)) === qo.indexOf(Math.max(...qo))) continue
    return {
      w: [rng.int(-10, 10), rng.int(-10, 10), rng.int(-10, 10)], x, x2: feat(), r: rng.int(-2, 5),
      gam100: rng.pick([50, 90]), alpha100: rng.pick([5, 10, 20]), j: rng.pick(cand),
      r2: rng.int(-2, 5), g2100: rng.pick([90, 99]), qt, qo,
      th: rng.int(-20, 20), th0: rng.int(-20, 20), tau100: rng.pick([10, 20, 25, 50]), steps: rng.int(2, 4),
    }
  }
}

const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0)

export function build(P: Params): LQInstance {
  const w = P.w.map((v) => v / 10)
  const gam = P.gam100 / 100, alpha = P.alpha100 / 100
  const vs = dot(w, P.x), vs2 = dot(w, P.x2)
  const delta = P.r + gam * vs2 - vs
  const wNew = w[P.j] + alpha * delta * P.x[P.j]

  const g2 = P.g2100 / 100
  const qt = P.qt.map((v) => v / 10), qo = P.qo.map((v) => v / 10)
  const yDqn = P.r2 + g2 * Math.max(...qt)
  const aStar = qo.indexOf(Math.max(...qo))
  const yDouble = P.r2 + g2 * qt[aStar]
  const tau = P.tau100 / 100
  const th = P.th / 10, th0 = P.th0 / 10
  let tgt = th0
  for (let i = 0; i < P.steps; i++) tgt = tau * th + (1 - tau) * tgt

  const vec = (v: number[]) => '(' + v.map(dec).join(',\\ ') + ')'

  return {
    intro: 'Give all answers to 3 decimal places.',
    parts: [
      {
        prompt: 'A linear value function ' + tex('\\hat v(s,w)=w^\\top x(s)') + ' has weights ' + tex('w=' + vec(w)) + '. The agent moves from a state with features ' + tex('x(s)=' + vec(P.x)) + ' to one with features ' + tex('x(s\')=' + vec(P.x2)) + ' and receives reward ' + tex(P.r) + ', with discount ' + tex('\\gamma=' + dec(gam)) + '. What is the TD error ' + tex('\\delta=r+\\gamma\\hat v(s\')-\\hat v(s)') + '?',
        answer: delta, tolerance: tol3, lecture: 7,
        explanation: tex('\\hat v(s)=' + dec(vs) + ',\\ \\hat v(s\')=' + dec(vs2)) + ', so ' + tex('\\delta=' + P.r + '+' + dec(gam) + '\\times' + dec(vs2) + '-' + dec(vs) + '=' + dec(delta)) + '.',
      },
      {
        prompt: 'Apply one semi-gradient TD(0) update with step size ' + tex('\\alpha=' + dec(alpha)) + ', ' + tex('w\\leftarrow w+\\alpha\\,\\delta\\,x(s)') + ', to the weights above. What is the new value of ' + tex('w_' + (P.j + 1)) + ' (the ' + ['first', 'second', 'third'][P.j] + ' component)?',
        answer: wNew, tolerance: tol3, lecture: 7,
        explanation: 'The gradient of ' + tex('\\hat v(s,w)') + ' is ' + tex('x(s)') + ' (the target is treated as a constant). So ' + tex('w_' + (P.j + 1) + '\\leftarrow ' + dec(w[P.j]) + '+' + dec(alpha) + '\\times' + dec(delta) + '\\times' + P.x[P.j] + '=' + dec(wNew)) + '.',
      },
      {
        prompt: 'In a DQN update a transition has reward ' + tex(P.r2) + ' and is not terminal. The target network gives ' + tex('Q_{\\text{target}}(s\',\\cdot)=' + vec(qt)) + ' for the three actions and the discount is ' + tex('\\gamma=' + dec(g2)) + '. What is the DQN target ' + tex('y') + '?',
        answer: yDqn, tolerance: tol3, lecture: 8,
        explanation: tex('y=r+\\gamma\\max_{a\'}Q_{\\text{target}}(s\',a\')=' + P.r2 + '+' + dec(g2) + '\\times' + dec(Math.max(...qt)) + '=' + dec(yDqn)) + '.',
      },
      {
        prompt: 'For the same transition the online network gives ' + tex('Q_{\\text{online}}(s\',\\cdot)=' + vec(qo)) + '. What is the Double DQN target?',
        answer: yDouble, tolerance: tol3, lecture: 8,
        explanation: 'The online network picks action number ' + (aStar + 1) + ' (value ' + tex(dec(qo[aStar])) + '), and the target network evaluates it: ' + tex('y=' + P.r2 + '+' + dec(g2) + '\\times' + dec(qt[aStar]) + '=' + dec(yDouble)) + '.',
      },
      {
        prompt: 'A target parameter is updated softly after every gradient step by ' + tex('\\theta^-\\leftarrow\\tau\\theta+(1-\\tau)\\theta^-') + ' with ' + tex('\\tau=' + dec(tau)) + '. The online parameter is held at ' + tex('\\theta=' + dec(th)) + ' and the target starts at ' + tex('\\theta^-=' + dec(th0)) + '. What is ' + tex('\\theta^-') + ' after ' + P.steps + ' steps?',
        answer: tgt, tolerance: tol3, lecture: 8,
        explanation: 'The gap shrinks by ' + tex('(1-\\tau)') + ' per step: ' + tex('\\theta^-_k=\\theta+(1-\\tau)^k(\\theta^-_0-\\theta)=' + dec(th) + '+' + dec((1 - tau) ** P.steps) + '\\times' + dec(th0 - th) + '=' + dec(tgt)) + '.',
      },
    ],
  }
}

export const genF: LQGenerator = { id: 'rl-lq-f-approx', generate: (rng) => build(sample(rng)) }
