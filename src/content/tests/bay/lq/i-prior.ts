// LQ-I (lecture quiz only): choosing a Beta prior for a proportion by elicitation, and checking sensitivity to the prior.
// Lecture 3 (choosing a prior).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { p0: number; s: number; n: number; k: number }

export function sample(rng: Rng): Params {
  const s = rng.pick([4, 5, 8, 10, 20])
  const p0 = rng.pick([0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75]) // s * p0 need not be an integer, a is just a Beta parameter
  const n = rng.int(8, 30)
  return { p0, s, n, k: rng.int(1, n - 1) }
}

export function build({ p0, s, n, k }: Params): LQInstance {
  const a = p0 * s, b = s - a
  const post = (a + k) / (s + n)
  const w = s / (s + n)
  const jeff = (k + 0.5) / (n + 1)

  return {
    intro: 'A clinic wants to estimate a success probability ' + tex('\\theta') + '. An expert believes ' + tex('\\theta') + ' is about ' + tex(dec(p0)) + ' and is as sure of it as if she had already seen ' + tex(s) + ' trials. The new data are ' + tex(k) + ' successes in ' + tex(n) + ' trials. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Encode the expert\'s belief as a ' + tex('\\mathrm{Beta}(a,b)') + ' prior whose mean is ' + tex(dec(p0)) + ' and whose ' + tex('a+b') + ' equals ' + tex(s) + '. Find ' + tex('a') + '.',
        answer: a, tolerance: tol4, lecture: 5,
        explanation: 'The mean is ' + tex('a/(a+b)') + ' and ' + tex('a+b=' + s) + ', so ' + tex('a=' + dec(p0) + '\\times' + s) + ' = ' + dec(a) + ' (and ' + tex('b=' + dec(b)) + ').',
      },
      {
        prompt: 'Find the posterior mean of ' + tex('\\theta') + ' under this prior after the data.',
        answer: post, tolerance: tol4, lecture: 5,
        explanation: 'The posterior is ' + tex('\\mathrm{Beta}(' + dec(a + k) + ',' + dec(b + n - k) + ')') + ', with mean ' + tex('\\dfrac{' + dec(a + k) + '}{' + (s + n) + '}') + ' = ' + dec(post) + '.',
      },
      {
        prompt: 'The posterior mean is a weighted average of the prior mean and the sample proportion ' + tex('k/n') + '. Find the weight on the prior mean, ' + tex('(a+b)/(a+b+n)') + '.',
        answer: w, tolerance: tol4, lecture: 5,
        explanation: tex('\\dfrac{' + s + '}{' + s + '+' + n + '}') + ' = ' + dec(w) + '. The prior counts as ' + tex(s) + ' observations against ' + tex(n) + ' real ones.',
      },
      {
        prompt: 'A weakly informative alternative is the Jeffreys prior ' + tex('\\mathrm{Beta}(\\tfrac12,\\tfrac12)') + '. Find the posterior mean of ' + tex('\\theta') + ' under it.',
        answer: jeff, tolerance: tol4, lecture: 5,
        explanation: 'The posterior is ' + tex('\\mathrm{Beta}(' + dec(k + 0.5) + ',' + dec(n - k + 0.5) + ')') + ', with mean ' + tex('\\dfrac{' + dec(k + 0.5) + '}{' + (n + 1) + '}') + ' = ' + dec(jeff) + '.',
      },
      {
        prompt: 'As a prior sensitivity check find the difference between the posterior means: the expert prior minus the Jeffreys prior.',
        answer: post - jeff, tolerance: tol4, lecture: 5,
        explanation: tex(dec(post) + '-' + dec(jeff)) + ' = ' + dec(post - jeff) + '. A difference this size, compared with the posterior spread, tells you whether the prior choice matters for your conclusion.',
      },
    ],
  }
}

export const genI: LQGenerator = { id: 'bay-lq-i-prior', generate: (rng) => build(sample(rng)) }
