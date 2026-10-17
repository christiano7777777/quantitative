// LQ-B: ACF of an MA(2) (lecture 3) and the invertible representation of a non-invertible MA(1).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'
import { term } from './util'

export interface Params { t1: number; t2: number; sigma2: number; theta: number; sigma2b: number }

export function sample(rng: Rng): Params {
  let t1 = 0, t2 = 0
  while (t1 === 0) t1 = rng.int(-9, 9) / 10
  while (t2 === 0) t2 = rng.int(-6, 6) / 10
  return { t1, t2, sigma2: rng.pick([1, 2, 4]), theta: rng.pick([-4, -2.5, -2, -1.5, 1.5, 2, 2.5, 4]), sigma2b: rng.pick([1, 2, 4]) }
}

export function build({ t1, t2, sigma2, theta, sigma2b }: Params): LQInstance {
  const s = 1 + t1 * t1 + t2 * t2
  const g0 = sigma2 * s
  const r1 = (t1 * (1 + t2)) / s
  const r2 = t2 / s
  const inv = 1 / theta
  const sInv = sigma2b * theta * theta
  return {
    intro: 'Let ' + tex('Z_t') + ' be white noise with variance ' + tex('\\sigma^2=' + dec(sigma2)) + ' and ' + tex('X_t=Z_t' + term(t1, 'Z_{t-1}') + term(t2, 'Z_{t-2}')) + '. Give answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the variance ' + tex('\\gamma(0)') + '.',
        answer: g0, tolerance: tol3, lecture: 3,
        explanation: tex('\\gamma(0)=\\sigma^2(1+\\theta_1^2+\\theta_2^2)=' + dec(sigma2) + '\\cdot' + dec(s)) + ' = ' + dec(g0) + '.',
      },
      {
        prompt: 'Find the autocorrelation ' + tex('\\rho(1)') + '.',
        answer: r1, tolerance: tol3, lecture: 3,
        explanation: tex('\\rho(1)=\\theta_1(1+\\theta_2)/(1+\\theta_1^2+\\theta_2^2)=' + dec(t1 * (1 + t2)) + '/' + dec(s)) + ' = ' + dec(r1) + '.',
      },
      {
        prompt: 'Find the autocorrelation ' + tex('\\rho(2)') + '.',
        answer: r2, tolerance: tol3, lecture: 3,
        explanation: tex('\\rho(2)=\\theta_2/(1+\\theta_1^2+\\theta_2^2)=' + dec(t2) + '/' + dec(s)) + ' = ' + dec(r2) + '. The autocorrelations vanish beyond lag 2.',
      },
      {
        prompt: 'A different process ' + tex('Y_t=W_t+' + dec(theta) + 'W_{t-1}') + ' has white noise ' + tex('W_t') + ' of variance ' + tex('\\sigma_W^2=' + dec(sigma2b)) + '. Since ' + tex('|\\theta|>1') + ', it is not invertible. Another MA(1) with the same autocovariances is invertible: ' + tex('Y_t=\\tilde W_t+\\theta^*\\tilde W_{t-1}') + '. Find ' + tex('\\theta^*') + '.',
        answer: inv, tolerance: tol3, lecture: 3,
        explanation: 'Replace the root ' + tex('-1/\\theta') + ' of ' + tex('1+\\theta z') + ' by its reciprocal: ' + tex('\\theta^*=1/\\theta=' + dec(inv)) + ', which has ' + tex('|\\theta^*|<1') + ' and the same ' + tex('\\rho(1)') + '.',
      },
      {
        prompt: 'Find the variance ' + tex('\\sigma_*^2') + ' of the white noise ' + tex('\\tilde W_t') + ' in that invertible representation.',
        answer: sInv, tolerance: tol3, lecture: 3,
        explanation: 'Matching ' + tex('\\gamma(0)=\\sigma_W^2(1+\\theta^2)=\\sigma_*^2(1+\\theta^{*2})') + ' gives ' + tex('\\sigma_*^2=\\sigma_W^2\\theta^2=' + dec(sigma2b) + '\\cdot' + dec(theta * theta)) + ' = ' + dec(sInv) + '.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'ts1-lq-b-ma', generate: (rng) => build(sample(rng)) }
