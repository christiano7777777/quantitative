// Lecture 3: one MA(2) queue story; autocovariances, cutoff and invertibility.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { mu: number; th1: number; th2: number; sigma2: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const th1 = rng.pick([-0.4, -0.3, -0.2, 0.2, 0.3, 0.4])
    const th2 = rng.pick([-0.25, -0.15, 0.15, 0.25])
    const invertible = Math.abs(th2) < 1 && th1 + th2 > -1 && th1 + th2 < 1 && th2 - th1 < 1
    if (invertible && th1 + th1 * th2 !== 0) return { mu: rng.pick([10, 12, 15]), th1, th2, sigma2: rng.pick([1, 2, 4]) }
  }
}

export function build({ mu, th1, th2, sigma2 }: Params): LQInstance {
  const g0 = sigma2 * (1 + th1 * th1 + th2 * th2)
  const g1 = sigma2 * (th1 + th1 * th2)
  const g2 = sigma2 * th2
  return {
    intro: 'A food stall models its daily queue-length index by ' + tex('X_t=' + dec(mu) + '+Z_t+' + dec(th1) + 'Z_{t-1}+' + dec(th2) + 'Z_{t-2}') + ', where ' + tex('\\{Z_t\\}') + ' is white noise with variance ' + tex(dec(sigma2)) + '. For the invertibility code, enter 1 if all roots of ' + tex('\\Theta(z)=1+' + dec(th1) + 'z+' + dec(th2) + 'z^2') + ' lie outside the unit circle and 0 otherwise. Give decimal answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the mean ' + tex('E(X_t)') + '.',
        answer: mu, tolerance: tol4, lecture: 3,
        explanation: 'Every white-noise term has mean zero, so ' + tex('E(X_t)=' + dec(mu)) + '.',
      },
      {
        prompt: 'Find ' + tex('\\gamma(0)') + '.',
        answer: g0, tolerance: tol4, lecture: 3,
        explanation: tex('\\gamma(0)=\\sigma^2(1+\\theta_1^2+\\theta_2^2)=' + dec(sigma2) + '(1+' + dec(th1 * th1) + '+' + dec(th2 * th2) + ')=' + dec(g0)) + '.',
      },
      {
        prompt: 'Find ' + tex('\\gamma(1)') + '.',
        answer: g1, tolerance: tol4, lecture: 3,
        explanation: tex('\\gamma(1)=\\sigma^2(\\theta_1+\\theta_1\\theta_2)=' + dec(sigma2) + '(' + dec(th1) + '+' + dec(th1) + '\\times' + dec(th2) + ')=' + dec(g1)) + '.',
      },
      {
        prompt: 'Find ' + tex('\\gamma(2)') + '.',
        answer: g2, tolerance: tol4, lecture: 3,
        explanation: tex('\\gamma(2)=\\sigma^2\\theta_2=' + dec(sigma2) + '\\times' + dec(th2) + '=' + dec(g2)) + '.',
      },
      {
        prompt: 'Find ' + tex('\\gamma(3)') + '.',
        answer: 0, tolerance: tol4, lecture: 3,
        explanation: 'Observations three days apart share no shock in an MA(2), so ' + tex('\\gamma(3)=0') + '.',
      },
      {
        prompt: 'Give the invertibility code for this MA(2).',
        answer: 1, tolerance: tolInt, lecture: 3,
        explanation: 'The chosen coefficients satisfy ' + tex('|\\theta_2|<1') + ', ' + tex('\\theta_1+\\theta_2<1') + ', ' + tex('\\theta_1+\\theta_2>-1') + ' and ' + tex('\\theta_2-\\theta_1<1') + ', so both roots of ' + tex('\\Theta(z)=0') + ' lie outside the unit circle. The code is 1.',
      },
    ],
  }
}

export const genLec3: LQGenerator = { id: 'ts1-lq-lec3', generate: (rng) => build(sample(rng)) }
