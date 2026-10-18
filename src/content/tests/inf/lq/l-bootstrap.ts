// LQ-L (lecture quiz only): the bootstrap for a small data set: plug-in variance, exact bootstrap standard error of the
// mean, bootstrap bias of the plug-in variance, a bias correction, and the number of distinct resamples.
// Lecture 11 (bootstrap).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { x: number[] }

export function sample(rng: Rng): Params {
  const n = rng.pick([4, 5, 6])
  return { x: rng.shuffle(rng.sample([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], n)) }
}

export function build({ x }: Params): LQInstance {
  const n = x.length
  const xbar = x.reduce((s, v) => s + v, 0) / n
  const ss = x.reduce((s, v) => s + (v - xbar) ** 2, 0)
  const plug = ss / n
  const se = Math.sqrt(ss) / n
  const bias = -plug / n
  const corrected = plug - bias
  let distinct = 1 // C(2n-1, n)
  for (let i = 1; i <= n; i++) distinct = (distinct * (n - 1 + i)) / i

  return {
    intro: 'A sample of ' + tex(n) + ' distinct observations is ' + tex(x.join(',\\ ')) + '. Let ' + tex('\\hat\\sigma^2=\\frac1n\\sum(x_i-\\bar x)^2') + ' be the plug-in variance, and consider bootstrap resamples of size ' + tex(n) + ' drawn with replacement from these values. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the plug-in variance ' + tex('\\hat\\sigma^2') + ' (divisor ' + tex('n') + ').',
        answer: plug, tolerance: tol4, lecture: 11,
        explanation: tex('\\bar x=' + dec(xbar)) + ' and ' + tex('\\sum(x_i-\\bar x)^2=' + dec(ss)) + ', so ' + tex('\\hat\\sigma^2=' + dec(ss) + '/' + n) + ' = ' + dec(plug) + '.',
      },
      {
        prompt: 'Find the exact bootstrap standard error of the resample mean, ' + tex('\\hat\\sigma/\\sqrt n=\\sqrt{\\sum(x_i-\\bar x)^2}\\big/n') + '.',
        answer: se, tolerance: tol4, lecture: 11,
        explanation: 'A resample mean is the average of ' + tex(n) + ' independent draws from the data, each with variance ' + tex('\\hat\\sigma^2') + ', so its variance is ' + tex('\\hat\\sigma^2/n=' + dec(plug / n)) + ' and the standard error is ' + dec(se) + '.',
      },
      {
        prompt: 'The bootstrap expectation of the resample plug-in variance is ' + tex('(1-1/n)\\hat\\sigma^2') + '. Find the bootstrap bias estimate ' + tex('E^*[\\hat\\sigma^{*2}]-\\hat\\sigma^2') + '.',
        answer: bias, tolerance: tol4, lecture: 11,
        explanation: tex('(1-1/' + n + ')' + dec(plug) + '-' + dec(plug) + '=-' + dec(plug) + '/' + n) + ' = ' + dec(bias) + '. The plug-in variance is biased downwards.',
      },
      {
        prompt: 'Find the bias-corrected estimate ' + tex('\\hat\\sigma^2-\\widehat{\\text{bias}}') + '.',
        answer: corrected, tolerance: tol4, lecture: 11,
        explanation: tex(dec(plug) + '-(' + dec(bias) + ')') + ' = ' + dec(corrected) + '.',
      },
      {
        prompt: 'How many different resamples are there if only which values appear, and how often, is recorded (the order of drawing is ignored)? It is ' + tex('\\binom{2n-1}{n}') + '. Give a whole number.',
        answer: distinct, tolerance: tolInt, lecture: 11,
        explanation: tex('\\binom{' + (2 * n - 1) + '}{' + n + '}') + ' = ' + distinct + ', far fewer than the ' + tex(n + '^{' + n + '}=' + n ** n) + ' equally likely ordered draws, and not equally likely themselves.',
      },
    ],
  }
}

export const genL: LQGenerator = { id: 'inf-lq-l-bootstrap', generate: (rng) => build(sample(rng)) }
