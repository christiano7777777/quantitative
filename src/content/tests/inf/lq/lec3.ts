// inf lecture 3 (prior to posterior, Bayesian estimation and testing): one story. A success probability with a Beta prior and binomial
// data: the posterior mean and variance, P(H0 | x), posterior odds, the posterior mean of the odds, and the Bayes test threshold.
// Lecture 3.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { a: number; b: number; n: number; k: number; L0: number; L1: number }

export function sample(rng: Rng): Params {
  const n = rng.int(8, 12)
  return { a: rng.int(1, 3), b: rng.int(1, 3), n, k: rng.int(3, n - 2), L0: rng.pick([2, 3, 4, 5]), L1: rng.pick([1, 2, 3]) }
}

/** P(Bin(m, 1/2) >= j) */
function binomHalfTail(m: number, j: number): number {
  let s = 0
  for (let i = j; i <= m; i++) {
    let c = 1
    for (let t = 1; t <= i; t++) c = (c * (m - i + t)) / t
    s += c / 2 ** m
  }
  return s
}

export function build({ a, b, n, k, L0, L1 }: Params): LQInstance {
  const A = a + k, B = b + n - k
  const mean = A / (A + B)
  const variance = (A * B) / ((A + B) ** 2 * (A + B + 1))
  // for integer shapes: P(Beta(A,B) <= 1/2) = P(Bin(A+B-1, 1/2) >= A)
  const pH0 = binomHalfTail(A + B - 1, A)
  const odds = pH0 / (1 - pH0)
  const oddsMean = A / (B - 1)
  const cut = L1 / (L0 + L1)

  return {
    intro: 'A coin has unknown probability ' + tex('\\theta') + ' of heads, with prior ' + tex('\\theta\\sim\\mathrm{Beta}(' + a + ',' + b + ')') + '. It is tossed ' + tex(n) + ' times and gives ' + tex(k) + ' heads. We want to test ' + tex('H_0:\\theta\\le\\tfrac12') + ' against ' + tex('H_1:\\theta>\\tfrac12') + ', where wrongly rejecting ' + tex('H_0') + ' costs ' + tex(L0) + ' and wrongly accepting it costs ' + tex(L1) + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'The posterior is ' + tex('\\mathrm{Beta}(a+k,\\ b+n-k)') + '. Find the posterior mean (the Bayes estimate of ' + tex('\\theta') + ' under squared error loss).',
        answer: mean, tolerance: tol4, lecture: 3,
        explanation: 'The posterior is ' + tex('\\mathrm{Beta}(' + A + ',' + B + ')') + ' with mean ' + tex(A + '/(' + A + '+' + B + ')') + ' = ' + dec(mean) + '.',
      },
      {
        prompt: 'Find the posterior variance ' + tex('\\dfrac{AB}{(A+B)^2(A+B+1)}') + ' with ' + tex('A=' + A + ',B=' + B) + '.',
        answer: variance, tolerance: tol4, lecture: 3,
        explanation: tex('\\dfrac{' + A * B + '}{' + (A + B) ** 2 + '\\times' + (A + B + 1) + '}') + ' = ' + dec(variance) + '.',
      },
      {
        prompt: 'For a Beta distribution with integer shapes ' + tex('P(\\mathrm{Beta}(A,B)\\le\\tfrac12)=P(\\mathrm{Bin}(A+B-1,\\tfrac12)\\ge A)') + '. Use this to find the posterior probability ' + tex('P(H_0\\mid x)=P(\\theta\\le\\tfrac12\\mid x)') + '.',
        answer: pH0, tolerance: tol4, lecture: 3,
        explanation: tex('P(\\mathrm{Bin}(' + (A + B - 1) + ',\\tfrac12)\\ge' + A + ')') + ' = ' + dec(pH0) + '.',
      },
      {
        prompt: 'Find the posterior odds of ' + tex('H_0') + ' against ' + tex('H_1') + ', ' + tex('P(H_0\\mid x)/P(H_1\\mid x)') + '.',
        answer: odds, tolerance: tol4, lecture: 3,
        explanation: tex(dec(pH0) + '/' + dec(1 - pH0)) + ' = ' + dec(odds) + '.',
      },
      {
        prompt: 'The posterior mean of the odds ' + tex('\\theta/(1-\\theta)') + ' of heads is ' + tex('A/(B-1)') + ' for a ' + tex('\\mathrm{Beta}(A,B)') + ' posterior with ' + tex('B>1') + '. Find it, and note that it differs from the odds of the posterior mean.',
        answer: oddsMean, tolerance: tol4, lecture: 3,
        explanation: tex(A + '/' + (B - 1)) + ' = ' + dec(oddsMean) + ', while the odds of the posterior mean are ' + tex(dec(mean) + '/' + dec(1 - mean) + '=' + dec(mean / (1 - mean))) + '. The mean of a nonlinear function is not the function of the mean.',
      },
      {
        prompt: 'The Bayes test rejects ' + tex('H_0') + ' when the expected posterior loss of rejecting, ' + tex(L0 + '\\,P(H_0\\mid x)') + ', is smaller than that of accepting, ' + tex(L1 + '\\,P(H_1\\mid x)') + '. This is the same as rejecting when ' + tex('P(H_0\\mid x)<c') + '. Find the threshold ' + tex('c=L_1/(L_0+L_1)') + '.',
        answer: cut, tolerance: tol4, lecture: 3,
        explanation: tex(L1 + '/(' + L0 + '+' + L1 + ')') + ' = ' + dec(cut) + '. Here ' + tex('P(H_0\\mid x)=' + dec(pH0)) + ' is ' + (pH0 < cut ? 'below' : 'above') + ' it, so the Bayes test ' + (pH0 < cut ? 'rejects' : 'does not reject') + ' ' + tex('H_0') + '.',
      },
    ],
  }
}

export const genLec3: LQGenerator = { id: 'inf-lq-lec3', generate: (rng) => build(sample(rng)) }
