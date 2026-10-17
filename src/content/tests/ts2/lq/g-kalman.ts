// LQ-G: one Kalman filter step for a local level model: prediction variance, gain, filtered mean and variance, next prediction variance.
// Lecture 8 (state-space models, Kalman filter).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { a: number; P: number; Q: number; R: number; y: number }

export function sample(rng: Rng): Params {
  return { a: rng.int(0, 50) / 10, P: rng.pick([1, 2, 4]), Q: rng.pick([0.5, 1]), R: rng.pick([1, 2, 4]), y: rng.int(0, 80) / 10 }
}

export function build({ a, P, Q, R, y }: Params): LQInstance {
  const F = P + R
  const K = P / F
  const filt = a + K * (y - a)
  const Pf = P * (1 - K)
  const Pn = Pf + Q

  return {
    intro:
      'A local level model has state ' + tex('\\alpha_{t+1}=\\alpha_t+\\eta_t') + ' with ' + tex('\\eta_t\\sim N(0,' + dec(Q) + ')') + ' and observation ' + tex('y_t=\\alpha_t+\\varepsilon_t') + ' with ' + tex('\\varepsilon_t\\sim N(0,' + dec(R) + ')') +
      '. Before seeing ' + tex('y_1') + ', the state ' + tex('\\alpha_1') + ' has prior mean ' + tex(dec(a)) + ' and variance ' + tex(dec(P)) + '. The first observation is ' + tex('y_1=' + dec(y)) + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the variance ' + tex('F_1=P+R') + ' of the prediction error ' + tex('v_1=y_1-a') + '.',
        answer: F, tolerance: tol4, lecture: 8,
        explanation: tex('F_1=' + dec(P) + '+' + dec(R)) + ' = ' + dec(F) + '.',
      },
      {
        prompt: 'Find the Kalman gain ' + tex('K_1=P/F_1') + '.',
        answer: K, tolerance: tol4, lecture: 8,
        explanation: tex(dec(P) + '/' + dec(F)) + ' = ' + dec(K) + '.',
      },
      {
        prompt: 'Find the filtered mean ' + tex('a_{1|1}=a+K_1v_1') + '.',
        answer: filt, tolerance: tol4, lecture: 8,
        explanation: tex('v_1=' + dec(y - a) + ',\\ a_{1|1}=' + dec(a) + '+' + dec(K) + '\\cdot' + dec(y - a)) + ' = ' + dec(filt) + '.',
      },
      {
        prompt: 'Find the filtered variance ' + tex('P_{1|1}=P(1-K_1)') + '.',
        answer: Pf, tolerance: tol4, lecture: 8,
        explanation: tex(dec(P) + '(1-' + dec(K) + ')') + ' = ' + dec(Pf) + ', smaller than the prior variance.',
      },
      {
        prompt: 'Find the prior variance of ' + tex('\\alpha_2') + ' for the next step, ' + tex('P_2=P_{1|1}+Q') + '.',
        answer: Pn, tolerance: tol4, lecture: 8,
        explanation: tex(dec(Pf) + '+' + dec(Q)) + ' = ' + dec(Pn) + ': the state noise adds uncertainty again.',
      },
    ],
  }
}

export const genG: LQGenerator = { id: 'ts2-lq-g-kalman', generate: (rng) => build(sample(rng)) }
