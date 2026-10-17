// LQ-B: GARCH(1,1) next-period variance, long-run variance, multi-step forecast, and GJR variances after a negative and a positive shock.
// Lectures 3 (GARCH) and 4 (GARCH extensions, asymmetry).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params { omega: number; alpha: number; beta: number; sig2: number; r: number; gamma: number; h: number }

export function sample(rng: Rng): Params {
  let alpha: number, beta: number
  do { alpha = rng.pick([0.05, 0.08, 0.1, 0.15]); beta = rng.pick([0.8, 0.85, 0.88, 0.9]) } while (alpha + beta > 0.98)
  return {
    omega: rng.pick([0.02, 0.05, 0.1]), alpha, beta, sig2: rng.pick([0.5, 1, 1.5, 2]), r: rng.pick([1, 1.5, 2, 2.5, 3]),
    gamma: rng.pick([0.05, 0.1, 0.15]), h: rng.pick([5, 10, 20]),
  }
}

export function build({ omega, alpha, beta, sig2, r, gamma, h }: Params): LQInstance {
  const next = omega + alpha * r * r + beta * sig2
  const pers = alpha + beta
  const lr = omega / (1 - pers)
  const fc = lr + pers ** (h - 1) * (next - lr)
  const gjrNeg = omega + (alpha + gamma) * r * r + beta * sig2
  const gjrPos = omega + alpha * r * r + beta * sig2

  return {
    intro:
      'A GARCH(1,1) model for returns is ' + tex('\\sigma_t^2=' + dec(omega) + '+' + dec(alpha) + '\\varepsilon_{t-1}^2+' + dec(beta) + '\\sigma_{t-1}^2') + '. At time ' + tex('T') + ' the conditional variance is ' + tex('\\sigma_T^2=' + dec(sig2)) +
      ' and the observed shock is ' + tex('\\varepsilon_T=' + dec(r)) + '. Give decimal answers to 3 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find ' + tex('\\sigma_{T+1}^2') + '.',
        answer: next, tolerance: tol3, lecture: 3,
        explanation: tex(dec(omega) + '+' + dec(alpha) + '\\cdot' + dec(r * r) + '+' + dec(beta) + '\\cdot' + dec(sig2)) + ' = ' + dec(next) + '.',
      },
      {
        prompt: 'Find the long-run variance ' + tex('\\omega/(1-\\alpha-\\beta)') + '.',
        answer: lr, tolerance: tol3, lecture: 3,
        explanation: 'Persistence ' + tex('\\alpha+\\beta=' + dec(pers)) + ', so ' + tex(dec(omega) + '/' + dec(1 - pers)) + ' = ' + dec(lr) + '.',
      },
      {
        prompt: 'Forecast the variance ' + tex(h) + ' steps ahead, ' + tex('E_T[\\sigma_{T+' + h + '}^2]=\\bar\\sigma^2+(\\alpha+\\beta)^{' + (h - 1) + '}(\\sigma_{T+1}^2-\\bar\\sigma^2)') + ', where ' + tex('\\bar\\sigma^2') + ' is the long-run variance (4 decimal places).',
        answer: fc, tolerance: tol4, lecture: 3,
        explanation: tex(dec(lr) + '+' + dec(pers) + '^{' + (h - 1) + '}(' + dec(next) + '-' + dec(lr) + ')') + ' = ' + dec(fc) + ', closer to the long-run variance than ' + dec(next) + '.',
      },
      {
        prompt: 'Add a leverage term to get the GJR model ' + tex('\\sigma_t^2=\\omega+\\alpha\\varepsilon_{t-1}^2+\\gamma\\varepsilon_{t-1}^2\\mathbf 1\\{\\varepsilon_{t-1}<0\\}+\\beta\\sigma_{t-1}^2') + ' with ' + tex('\\gamma=' + dec(gamma)) + ' and the same other parameters. If the shock at ' + tex('T') + ' had been negative, ' + tex('\\varepsilon_T=-' + dec(r)) + ', what would ' + tex('\\sigma_{T+1}^2') + ' be?',
        answer: gjrNeg, tolerance: tol3, lecture: 4,
        explanation: 'The indicator is on: ' + tex(dec(omega) + '+(' + dec(alpha) + '+' + dec(gamma) + ')\\cdot' + dec(r * r) + '+' + dec(beta) + '\\cdot' + dec(sig2)) + ' = ' + dec(gjrNeg) + '.',
      },
      {
        prompt: 'In the same GJR model, what is ' + tex('\\sigma_{T+1}^2') + ' after the positive shock ' + tex('\\varepsilon_T=+' + dec(r)) + '?',
        answer: gjrPos, tolerance: tol3, lecture: 4,
        explanation: 'The indicator is off, so the result equals the symmetric GARCH value ' + dec(gjrPos) + ', below the ' + dec(gjrNeg) + ' after the negative shock of the same size.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'ts2-lq-b-garch', generate: (rng) => build(sample(rng)) }
