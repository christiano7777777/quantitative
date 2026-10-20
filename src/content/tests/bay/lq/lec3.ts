// bay lecture 3 (posterior summaries, intervals, choosing priors): one story. A proportion with the Jeffreys prior Beta(1/2,1/2): posterior
// mean, mode, standard deviation, an approximate 95% interval limit, the uniform-prior posterior mean, and the weight of the prior.
// Lecture 3.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { n: number; k: number }

export function sample(rng: Rng): Params {
  const n = rng.int(12, 24)
  let k = rng.int(3, n - 3)
  // k = n/2 gives a symmetric posterior (mode = mean); redraw so that the skewness remark in part b holds
  while (2 * k === n) k = rng.int(3, n - 3)
  return { n, k }
}

export function build({ n, k }: Params): LQInstance {
  const A = k + 0.5, B = n - k + 0.5
  const mean = A / (A + B)
  const mode = (A - 1) / (A + B - 2)
  const sd = Math.sqrt((A * B) / ((A + B) ** 2 * (A + B + 1)))
  const upper = mean + 1.96 * sd
  const unif = (k + 1) / (n + 2)
  const weight = 1 / (1 + n)

  return {
    intro: 'In a trial, ' + tex(k) + ' of ' + tex(n) + ' patients respond to a treatment, ' + tex('k\\sim\\mathrm{Bin}(n,\\theta)') + '. With no real prior knowledge, use the Jeffreys prior ' + tex('\\theta\\sim\\mathrm{Beta}(\\tfrac12,\\tfrac12)') + ' (invariant under reparametrisation). The posterior is ' + tex('\\mathrm{Beta}(k+\\tfrac12,\\ n-k+\\tfrac12)') + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the posterior mean (the Bayes estimate under squared error loss).',
        answer: mean, tolerance: tol4, lecture: 3,
        explanation: tex('A=' + dec(A) + ',\\ B=' + dec(B)) + ', so ' + tex('A/(A+B)=' + dec(A) + '/' + dec(A + B)) + ' = ' + dec(mean) + '.',
      },
      {
        prompt: 'Find the posterior mode (the MAP estimate), ' + tex('\\dfrac{A-1}{A+B-2}') + '.',
        answer: mode, tolerance: tol4, lecture: 3,
        explanation: tex('(' + dec(A) + '-1)/(' + dec(A + B) + '-2)') + ' = ' + dec(mode) + '. The mode is the value of highest posterior density; it differs from the mean because the posterior is skewed (' + tex('k\\ne n/2') + ').',
      },
      {
        prompt: 'Find the posterior standard deviation ' + tex('\\sqrt{\\dfrac{AB}{(A+B)^2(A+B+1)}}') + '.',
        answer: sd, tolerance: tol4, lecture: 3,
        explanation: tex('\\sqrt{' + dec(A * B) + '/(' + dec((A + B) ** 2) + '\\times' + dec(A + B + 1) + ')}') + ' = ' + dec(sd) + '.',
      },
      {
        prompt: 'A normal approximation to the posterior gives a 95% credible interval ' + tex('\\text{mean}\\pm1.96\\times\\text{sd}') + '. Find its upper limit.',
        answer: upper, tolerance: tol4, lecture: 3,
        explanation: tex(dec(mean) + '+1.96\\times' + dec(sd)) + ' = ' + dec(upper) + '. For a skewed posterior the exact equal-tailed or highest-density interval differs somewhat.',
      },
      {
        prompt: 'With the uniform prior ' + tex('\\mathrm{Beta}(1,1)') + ' instead, the posterior mean is ' + tex('(k+1)/(n+2)') + '. Find it, to see how much the choice of prior matters here.',
        answer: unif, tolerance: tol4, lecture: 3,
        explanation: tex('(' + k + '+1)/(' + n + '+2)') + ' = ' + dec(unif) + ', against ' + dec(mean) + ' under Jeffreys: the data dominate and the two priors give nearly the same answer.',
      },
      {
        prompt: 'The posterior mean is a weighted average of the prior mean ' + tex('\\tfrac12') + ' and the sample proportion ' + tex('k/n') + ', with weight ' + tex('(a+b)/(a+b+n)') + ' on the prior. Find the weight on the prior mean for the Jeffreys prior (' + tex('a+b=1') + ').',
        answer: weight, tolerance: tol4, lecture: 3,
        explanation: tex('1/(1+' + n + ')') + ' = ' + dec(weight) + '. The prior is worth one observation.',
      },
    ],
  }
}

export const genLec3: LQGenerator = { id: 'bay-lq-lec3', generate: (rng) => build(sample(rng)) }
