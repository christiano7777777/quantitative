// LQ-F: jackknife bias and standard error of the squared sample mean, bias correction, and the bootstrap inclusion probability.
// Lecture 8 (bootstrap and jackknife).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { x: number[] }

export function sample(rng: Rng): Params {
  const n = rng.pick([5, 6, 8])
  return { x: Array.from({ length: n }, () => rng.int(1, 20)) }
}

export function build({ x }: Params): LQInstance {
  const n = x.length
  const S = x.reduce((a, v) => a + v, 0)
  const th = (S / n) ** 2
  const loo = x.map((v) => ((S - v) / (n - 1)) ** 2)
  const bar = loo.reduce((a, v) => a + v, 0) / n
  const bias = (n - 1) * (bar - th)
  const se = Math.sqrt(((n - 1) / n) * loo.reduce((a, v) => a + (v - bar) ** 2, 0))
  const corrected = th - bias
  const miss = (1 - 1 / n) ** n

  return {
    intro: 'A sample is ' + tex(x.join(',')) + '. The statistic of interest is the squared sample mean ' + tex('\\hat\\theta=\\bar x^2') + ' (a biased estimate of ' + tex('\\mu^2') + '). Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find ' + tex('\\hat\\theta=\\bar x^2') + ' for the full sample.',
        answer: th, tolerance: tol4, lecture: 8,
        explanation: tex('\\bar x=' + dec(S / n) + ',\\ \\bar x^2') + ' = ' + dec(th) + '.',
      },
      {
        prompt: 'Compute the ' + tex('n') + ' leave-one-out estimates ' + tex('\\hat\\theta_{(i)}=\\bar x_{(i)}^2') + ' and find the jackknife bias estimate ' + tex('(n-1)(\\bar\\theta_{(\\cdot)}-\\hat\\theta)') + '.',
        answer: bias, tolerance: tol4, lecture: 8,
        explanation: 'Leave-one-out values ' + tex(loo.map(dec).join(',')) + ' have mean ' + dec(bar) + ', so the bias estimate is ' + tex((n - 1) + '(' + dec(bar) + '-' + dec(th) + ')') + ' = ' + dec(bias) + '.',
      },
      {
        prompt: 'Find the jackknife standard error ' + tex('\\sqrt{\\frac{n-1}{n}\\sum_i(\\hat\\theta_{(i)}-\\bar\\theta_{(\\cdot)})^2}') + '.',
        answer: se, tolerance: tol4, lecture: 8,
        explanation: tex('\\sqrt{' + dec((n - 1) / n) + '\\cdot' + dec(loo.reduce((a, v) => a + (v - bar) ** 2, 0)) + '}') + ' = ' + dec(se) + '.',
      },
      {
        prompt: 'Find the bias-corrected estimate ' + tex('\\hat\\theta-\\widehat{\\text{bias}}') + '.',
        answer: corrected, tolerance: tol4, lecture: 8,
        explanation: tex(dec(th) + '-' + dec(bias)) + ' = ' + dec(corrected) + '.',
      },
      {
        prompt: 'In a bootstrap resample of size ' + tex(n) + ' drawn with replacement from these ' + tex(n) + ' observations, find the probability that a particular observation is not drawn at all, ' + tex('(1-1/n)^n') + '.',
        answer: miss, tolerance: tol4, lecture: 8,
        explanation: tex('(1-1/' + n + ')^{' + n + '}') + ' = ' + dec(miss) + ', approaching ' + tex('e^{-1}=0.3679') + ' as ' + tex('n') + ' grows.',
      },
    ],
  }
}

export const genF: LQGenerator = { id: 'np-lq-f-jackknife', generate: (rng) => build(sample(rng)) }
