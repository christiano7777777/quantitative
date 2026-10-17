// LQ-F: comparing models with information criteria, a likelihood ratio test statistic, adjusted R squared and a cross-validated error.
// Lecture 8 (model comparison).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params { n: number; k1: number; k0: number; ll1: number; ll0: number; r2: number }

export function sample(rng: Rng): Params {
  const k0 = rng.pick([2, 3, 4]), k1 = k0 + rng.pick([1, 2, 3])
  const ll0 = -rng.int(1500, 2500) / 10
  return { n: rng.pick([100, 250, 500]), k1, k0, ll1: ll0 + rng.int(10, 120) / 10, ll0, r2: rng.int(10, 40) / 100 }
}

export function build({ n, k1, k0, ll1, ll0, r2 }: Params): LQInstance {
  const aic = (ll: number, k: number) => -2 * ll + 2 * k
  const bic = (ll: number, k: number) => -2 * ll + k * Math.log(n)
  const dAic = aic(ll0, k0) - aic(ll1, k1)
  const lr = 2 * (ll1 - ll0)
  const adj = 1 - (1 - r2) * (n - 1) / (n - k1 - 1)

  return {
    intro:
      'Two nested models are fitted to ' + tex(n) + ' observations. The small model has ' + tex(k0) + ' parameters and maximised log-likelihood ' + tex(dec(ll0)) + '; the large model has ' + tex(k1) + ' parameters and log-likelihood ' + tex(dec(ll1)) + '. Give answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the AIC ' + tex('-2\\ell+2k') + ' of the large model.',
        answer: aic(ll1, k1), tolerance: tol3, lecture: 8,
        explanation: tex('-2(' + dec(ll1) + ')+2\\cdot' + k1) + ' = ' + dec(aic(ll1, k1)) + '.',
      },
      {
        prompt: 'Find the BIC ' + tex('-2\\ell+k\\ln n') + ' of the large model.',
        answer: bic(ll1, k1), tolerance: tol3, lecture: 8,
        explanation: tex('-2(' + dec(ll1) + ')+' + k1 + '\\ln' + n) + ' = ' + dec(bic(ll1, k1)) + '.',
      },
      {
        prompt: 'Find ' + tex('\\mathrm{AIC}_{\\text{small}}-\\mathrm{AIC}_{\\text{large}}') + '. A positive value favours the large model.',
        answer: dAic, tolerance: tol3, lecture: 8,
        explanation: 'AIC of the small model is ' + dec(aic(ll0, k0)) + ', so the difference is ' + dec(dAic) + '.',
      },
      {
        prompt: 'Find the likelihood ratio statistic ' + tex('2(\\ell_1-\\ell_0)') + ', to be compared with a chi-square distribution with ' + tex(k1 - k0) + ' degrees of freedom.',
        answer: lr, tolerance: tol3, lecture: 8,
        explanation: tex('2(' + dec(ll1) + '-(' + dec(ll0) + '))') + ' = ' + dec(lr) + '.',
      },
      {
        prompt: 'The large model has ' + tex('R^2=' + dec(r2)) + ' (with ' + tex(k1) + ' parameters including the intercept, so ' + tex(k1 - 1) + ' regressors). Find the adjusted ' + tex('R^2=1-(1-R^2)\\frac{n-1}{n-p-1}') + ' with ' + tex('p=' + (k1 - 1)) + ' regressors.',
        answer: 1 - (1 - r2) * (n - 1) / (n - (k1 - 1) - 1), tolerance: tol3, lecture: 8,
        explanation: tex('1-' + dec(1 - r2) + '\\cdot' + (n - 1) + '/' + (n - k1)) + ' = ' + dec(1 - (1 - r2) * (n - 1) / (n - k1)) + '.',
      },
    ],
  }
}

export const genF: LQGenerator = { id: 'rm-lq-f-comparison', generate: (rng) => build(sample(rng)) }
