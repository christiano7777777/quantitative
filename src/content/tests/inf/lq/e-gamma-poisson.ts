// LQ-E: conjugate Gamma-Poisson inference: posterior mean and variance, the shrinkage weight, the posterior predictive probability and an approximate credible bound.
// Lecture 7 (prior and posterior inference).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { n: number; total: number; a: number; b: number }

export function sample(rng: Rng): Params {
  const n = rng.int(5, 10)
  return { n, total: rng.int(n, 3 * n), a: rng.pick([1, 2, 3, 4]), b: rng.pick([1, 2, 4]) }
}

export function build({ n, total, a, b }: Params): LQInstance {
  const A = a + total, B = b + n
  const mean = A / B
  const variance = A / (B * B)
  const w = n / B
  const pred0 = (B / (B + 1)) ** A
  const lower = mean - 1.96 * Math.sqrt(variance)

  return {
    intro: 'Daily counts ' + tex('X_1,\\dots,X_{' + n + '}') + ' are i.i.d. Poisson(' + tex('\\lambda') + ') with total ' + tex('\\sum_iX_i=' + total) + '. The prior is ' + tex('\\lambda\\sim\\mathrm{Gamma}(' + a + ',' + b + ')') + ' (shape ' + tex(a) + ', rate ' + tex(b) + ', mean ' + tex(dec(a / b)) + '). Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the posterior mean of ' + tex('\\lambda') + '.',
        answer: mean, tolerance: tol4, lecture: 3,
        explanation: 'The posterior is ' + tex('\\mathrm{Gamma}(a+\\sum x_i,\\ b+n)=\\mathrm{Gamma}(' + A + ',' + B + ')') + ' with mean ' + tex(A + '/' + B + '=' + dec(mean)) + '.',
      },
      {
        prompt: 'Find the posterior variance of ' + tex('\\lambda') + '.',
        answer: variance, tolerance: tol4, lecture: 3,
        explanation: tex('A/B^2=' + A + '/' + B * B + '=' + dec(variance)) + '.',
      },
      {
        prompt: 'The posterior mean is a weighted average of the prior mean ' + tex('a/b') + ' and the sample mean ' + tex('\\bar x=' + dec(total / n)) + '. Find the weight on the sample mean.',
        answer: w, tolerance: tol4, lecture: 3,
        explanation: tex('n/(b+n)=' + n + '/' + B + '=' + dec(w)) + '; check: ' + tex(dec(w) + '\\cdot' + dec(total / n) + '+' + dec(1 - w) + '\\cdot' + dec(a / b) + '=' + dec(mean)) + '.',
      },
      {
        prompt: 'Find the posterior predictive probability that tomorrow\'s count is zero, ' + tex('\\left(\\dfrac{b+n}{b+n+1}\\right)^{a+\\sum x_i}') + '.',
        answer: pred0, tolerance: tol4, lecture: 3,
        explanation: tex('E[e^{-\\lambda}\\mid x]=(B/(B+1))^{A}=(' + B + '/' + (B + 1) + ')^{' + A + '}=' + dec(pred0)) + ': the mean of ' + tex('e^{-\\lambda}') + ' under a Gamma posterior.',
      },
      {
        prompt: 'Approximating the posterior by a normal distribution, find the lower end of the 95% credible interval, posterior mean minus ' + tex('1.96') + ' posterior standard deviations.',
        answer: lower, tolerance: tol4, lecture: 3,
        explanation: tex(dec(mean) + '-1.96\\sqrt{' + dec(variance) + '}=' + dec(mean) + '-1.96\\cdot' + dec(Math.sqrt(variance)) + '=' + dec(lower)) + '. For large ' + tex('n') + ' this agrees with the Wald interval around ' + tex('\\bar x') + '.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'inf-lq-e-gamma-poisson', generate: (rng) => build(sample(rng)) }
