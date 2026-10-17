// LQ-D: a two-asset one-factor covariance matrix, a shrunk off-diagonal entry, and the global minimum variance weight.
// Lecture 5 (covariance estimation, shrinkage, factor covariance).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { b1: number; b2: number; sf: number; e1: number; e2: number; s12: number; delta: number }

export function sample(rng: Rng): Params {
  return {
    b1: rng.pick([0.8, 1, 1.2, 1.5]), b2: rng.pick([0.5, 0.7, 0.9]), sf: rng.pick([15, 20, 25]), e1: rng.pick([10, 15, 20]), e2: rng.pick([10, 20, 25]),
    s12: rng.int(100, 500), delta: rng.pick([0.2, 0.3, 0.5]),
  }
}

export function build({ b1, b2, sf, e1, e2, s12, delta }: Params): LQInstance {
  const v1 = b1 * b1 * sf * sf + e1 * e1
  const v2 = b2 * b2 * sf * sf + e2 * e2
  const c = b1 * b2 * sf * sf
  const corr = c / Math.sqrt(v1 * v2)
  const target = c // shrink the noisy sample covariance towards the factor-model covariance
  const shr = (1 - delta) * s12 + delta * target
  const w1 = (v2 - c) / (v1 + v2 - 2 * c)

  return {
    intro:
      'A one-factor model ' + tex('r_i=\\beta_if+\\varepsilon_i') + ' has factor volatility ' + tex('\\sigma_f=' + sf + '\\%') + ', loadings ' + tex('\\beta_1=' + dec(b1) + ',\\ \\beta_2=' + dec(b2)) + ' and residual volatilities ' + tex(e1 + '\\%') + ' and ' + tex(e2 + '\\%') +
      ' (residuals uncorrelated). Work in units of %' + tex('^2') + ' for variances. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the variance of asset 1, ' + tex('\\beta_1^2\\sigma_f^2+\\sigma_{\\varepsilon1}^2') + '.',
        answer: v1, tolerance: { abs: 0.0005 }, lecture: 5,
        explanation: tex(dec(b1 * b1) + '\\cdot' + sf * sf + '+' + e1 * e1) + ' = ' + dec(v1) + '.',
      },
      {
        prompt: 'Find the covariance of the two assets, ' + tex('\\beta_1\\beta_2\\sigma_f^2') + '.',
        answer: c, tolerance: { abs: 0.0005 }, lecture: 5,
        explanation: tex(dec(b1) + '\\cdot' + dec(b2) + '\\cdot' + sf * sf) + ' = ' + dec(c) + '.',
      },
      {
        prompt: 'Find their correlation.',
        answer: corr, tolerance: tol4, lecture: 5,
        explanation: tex(dec(c) + '/\\sqrt{' + dec(v1) + '\\cdot' + dec(v2) + '}') + ' = ' + dec(corr) + ' (the variance of asset 2 is ' + dec(v2) + ').',
      },
      {
        prompt: 'A noisy sample covariance of the two assets is ' + tex(s12) + '. Shrink it towards the factor-model covariance with intensity ' + tex('\\delta=' + dec(delta)) + ': ' + tex('(1-\\delta)s_{12}+\\delta\\cdot\\text{(factor covariance)}') + '.',
        answer: shr, tolerance: { abs: 0.0005 }, lecture: 5,
        explanation: tex(dec(1 - delta) + '\\cdot' + s12 + '+' + dec(delta) + '\\cdot' + dec(c)) + ' = ' + dec(shr) + '.',
      },
      {
        prompt: 'Using the factor-model covariance matrix, find the weight of asset 1 in the global minimum variance portfolio, ' + tex('w_1=\\dfrac{\\sigma_2^2-\\sigma_{12}}{\\sigma_1^2+\\sigma_2^2-2\\sigma_{12}}') + '.',
        answer: w1, tolerance: tol4, lecture: 5,
        explanation: tex('\\dfrac{' + dec(v2) + '-' + dec(c) + '}{' + dec(v1) + '+' + dec(v2) + '-' + dec(2 * c) + '}') + ' = ' + dec(w1) + '.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'pf2-lq-d-covariance', generate: (rng) => build(sample(rng)) }
