// LQ-E: n-step returns, the lambda-return, and accumulating and replacing eligibility traces by hand.
// Lectures 6 (n-step methods and eligibility traces) and 5 (the TD error that the traces distribute).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params {
  gam100: number // discount in hundredths
  lam100: number // lambda in hundredths
  rs: number[] // three rewards for the n-step return
  v3: number // value of the state after three steps, in tenths
  qs: number[] // three rewards of the terminating episode for the lambda-return
  w1: number // V after one step, tenths
  w2: number // V after two steps, tenths
  seq: number[] // six visited states (0=A, 1=B, 2=C)
  X: number // state whose trace is asked
  Y: number // another state
  alpha100: number
  delta10: number // TD error in tenths
}

export function sample(rng: Rng): Params {
  for (;;) {
    const seq = Array.from({ length: 6 }, () => rng.int(0, 2))
    const X = rng.int(0, 2)
    const Y = rng.int(0, 2)
    const idx = (s: number) => seq.map((x, i) => (x === s ? i : -1)).filter((i) => i >= 0)
    if (X === Y || idx(X).length < 2 || idx(Y).length < 1 || idx(X)[idx(X).length - 1] === 5) continue
    let delta10 = rng.int(-30, 30)
    if (delta10 === 0) delta10 = 10
    return {
      gam100: rng.pick([50, 80, 90]), lam100: rng.pick([50, 60, 80]),
      rs: [rng.int(-1, 6), rng.int(-1, 6), rng.int(-1, 6)], v3: rng.int(0, 80),
      qs: [rng.int(0, 6), rng.int(0, 6), rng.int(0, 6)], w1: rng.int(0, 60), w2: rng.int(0, 60),
      seq, X, Y, alpha100: rng.pick([10, 20, 50]), delta10,
    }
  }
}

const name = (s: number) => 'ABC'[s]

export function build(P: Params): LQInstance {
  const gam = P.gam100 / 100, lam = P.lam100 / 100
  const [r1, r2, r3] = P.rs
  const v3 = P.v3 / 10
  const G3 = r1 + gam * r2 + gam ** 2 * r3 + gam ** 3 * v3

  const [q1, q2, q3] = P.qs
  const w1 = P.w1 / 10, w2 = P.w2 / 10
  const g1 = q1 + gam * w1
  const g2 = q1 + gam * q2 + gam ** 2 * w2
  const g3 = q1 + gam * q2 + gam ** 2 * q3
  const lret = (1 - lam) * g1 + (1 - lam) * lam * g2 + lam ** 2 * g3

  // traces after the six visits, by the step-by-step recursions
  const acc = [0, 0, 0], rep = [0, 0, 0]
  for (const s of P.seq) {
    for (let i = 0; i < 3; i++) { acc[i] *= gam * lam; rep[i] *= gam * lam }
    acc[s] += 1
    rep[s] = 1
  }
  const alpha = P.alpha100 / 100, delta = P.delta10 / 10
  const dV = alpha * delta * acc[P.Y]
  const gl = gam * lam

  return {
    intro: 'Discount ' + tex('\\gamma=' + dec(gam)) + ' and trace parameter ' + tex('\\lambda=' + dec(lam)) + '. Give all answers to 3 decimal places.',
    parts: [
      {
        prompt: 'From a state ' + tex('S_t') + ', an agent receives the rewards ' + tex(r1 + ',\\ ' + r2 + ',\\ ' + r3) + ' on the next three steps and reaches a state with current estimate ' + tex('V(S_{t+3})=' + dec(v3)) + '. What is the 3-step return ' + tex('G_{t:t+3}') + '?',
        answer: G3, tolerance: tol3, lecture: 6,
        explanation: tex('G_{t:t+3}=r_1+\\gamma r_2+\\gamma^2r_3+\\gamma^3V=' + r1 + '+' + dec(gam) + '\\times' + r2 + '+' + dec(gam ** 2) + '\\times' + r3 + '+' + dec(gam ** 3) + '\\times' + dec(v3) + '=' + dec(G3)) + '.',
      },
      {
        prompt: 'In a different episode the agent leaves a state, receives rewards ' + tex(q1 + ',\\ ' + q2 + ',\\ ' + q3) + ' on three steps, and then the episode ends. The current estimates of the first two states reached are ' + tex('V(S_1)=' + dec(w1)) + ' and ' + tex('V(S_2)=' + dec(w2)) + '. Compute the ' + tex('\\lambda') + '-return, which weights the 1-step, 2-step and 3-step (complete) returns by ' + tex('(1-\\lambda),\\ (1-\\lambda)\\lambda,\\ \\lambda^2') + '.',
        answer: lret, tolerance: tol3, lecture: 6,
        explanation: 'The returns are ' + tex('G^{(1)}=' + dec(g1) + ',\\ G^{(2)}=' + dec(g2) + ',\\ G^{(3)}=' + dec(g3)) + ' (the last is the full return). The weights are ' + tex(dec(1 - lam) + ',\\ ' + dec((1 - lam) * lam) + ',\\ ' + dec(lam ** 2)) + ', so the ' + tex('\\lambda') + '-return is ' + tex(dec(lret)) + '.',
      },
      {
        prompt: 'An agent visits the states ' + tex(P.seq.map(name).join(',\\ ')) + ' in this order (one visit per time step, all traces start at 0). After the last visit, what is the accumulating eligibility trace of state ' + tex(name(P.X)) + '? (Trace update: multiply all by ' + tex('\\gamma\\lambda') + ', then add 1 to the state just visited.)',
        answer: acc[P.X], tolerance: tol3, lecture: 6,
        explanation: 'With ' + tex('\\gamma\\lambda=' + dec(gl)) + ', each visit to ' + tex(name(P.X)) + ' contributes ' + tex('(\\gamma\\lambda)^{\\text{steps since the visit}}') + '. Summing over the visits gives ' + tex(dec(acc[P.X])) + '.',
      },
      {
        prompt: 'For the same visits, what is the replacing trace of state ' + tex(name(P.X)) + ' after the last visit? (A visit now sets the trace of that state to 1 instead of adding 1.)',
        answer: rep[P.X], tolerance: tol3, lecture: 6,
        explanation: 'Only the most recent visit to ' + tex(name(P.X)) + ' matters: it set the trace to 1, and since then it has decayed by ' + tex('\\gamma\\lambda=' + dec(gl)) + ' per step, leaving ' + tex(dec(rep[P.X])) + '.',
      },
      {
        prompt: 'At the last time step the TD error is ' + tex('\\delta=' + dec(delta)) + ' and the step size is ' + tex('\\alpha=' + dec(alpha)) + '. With accumulating traces, what is the change ' + tex('\\Delta V(' + name(P.Y) + ')=\\alpha\\,\\delta\\,e(' + name(P.Y) + ')') + ' made at that step? (Give this one to 4 decimal places.)',
        answer: dV, tolerance: tol4, lecture: 5,
        explanation: 'The accumulating trace of ' + tex(name(P.Y)) + ' after the last visit is ' + tex(dec(acc[P.Y])) + ', so ' + tex('\\Delta V=' + dec(alpha) + '\\times' + dec(delta) + '\\times' + dec(acc[P.Y]) + '=' + dec(dV)) + '.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'rl-lq-e-traces', generate: (rng) => build(sample(rng)) }
