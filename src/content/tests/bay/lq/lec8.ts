// bay lecture 8 (model evaluation and selection): one story. Two models fitted to the same data: AIC, BIC, a Bayes factor from marginal
// likelihoods and the posterior model probability.
// Lecture 8.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { n: number; lA: number; lB: number; kA: number; kB: number; mA: number; mB: number }

export function sample(rng: Rng): Params {
  const n = rng.pick([20, 30, 40, 50])
  const lA = -rng.int(40, 70)
  const mA = -rng.int(45, 75)
  // log evidences within a few units of each other, so the Bayes factor is a moderate number
  return { n, lA, lB: lA + rng.int(1, 4), kA: 2, kB: 3, mA, mB: mA + rng.pick([-4, -3, -2, -1, 1, 2, 3, 4]) }
}

export function build({ n, lA, lB, kA, kB, mA, mB }: Params): LQInstance {
  const aicA = 2 * kA - 2 * lA
  const aicB = 2 * kB - 2 * lB
  const bicA = kA * Math.log(n) - 2 * lA
  const bicB = kB * Math.log(n) - 2 * lB
  const bf = Math.exp((mA - mB) / 1)
  const post = bf / (1 + bf)
  const bicPref = bicA < bicB ? 1 : 0

  return {
    intro: 'Two models are fitted to the same ' + tex('n=' + n) + ' observations. Model A has ' + tex('k_A=' + kA) + ' parameters and maximised log-likelihood ' + tex('\\ell_A=' + lA) + '; model B has ' + tex('k_B=' + kB) + ' parameters and ' + tex('\\ell_B=' + lB) + '. Their log marginal likelihoods (log evidence) are ' + tex('\\ln p(y\\mid A)=' + mA) + ' and ' + tex('\\ln p(y\\mid B)=' + mB) + '. The two models have equal prior probability. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the Akaike information criterion of model A, ' + tex('\\mathrm{AIC}=2k-2\\ell') + ' (smaller is better).',
        answer: aicA, tolerance: tol4, lecture: 8,
        explanation: tex('2\\times' + kA + '-2\\times(' + lA + ')') + ' = ' + aicA + '.',
      },
      {
        prompt: 'Find the AIC of model B.',
        answer: aicB, tolerance: tol4, lecture: 8,
        explanation: tex('2\\times' + kB + '-2\\times(' + lB + ')') + ' = ' + aicB + '. AIC penalises each parameter by ' + tex(2) + '.',
      },
      {
        prompt: 'Find the Bayesian information criterion of model B, ' + tex('\\mathrm{BIC}=k\\ln n-2\\ell') + '.',
        answer: bicB, tolerance: tol4, lecture: 8,
        explanation: tex(kB + '\\ln' + n + '-2\\times(' + lB + ')') + ' = ' + dec(bicB) + '. BIC penalises each parameter by ' + tex('\\ln n') + ', which exceeds ' + tex(2) + ' once ' + tex('n>7') + '.',
      },
      {
        prompt: 'Which model does BIC prefer? Answer ' + tex(1) + ' for model A and ' + tex(0) + ' for model B (BIC of A is ' + tex(dec(bicA)) + ').',
        answer: bicPref, tolerance: tolInt, lecture: 8,
        explanation: 'BIC of A is ' + dec(bicA) + ' and of B is ' + dec(bicB) + '; the smaller one wins, so BIC prefers model ' + (bicPref ? 'A' : 'B') + '.',
      },
      {
        prompt: 'Find the Bayes factor ' + tex('B_{AB}=p(y\\mid A)/p(y\\mid B)=\\exp\\{\\ln p(y\\mid A)-\\ln p(y\\mid B)\\}') + '.',
        answer: bf, tolerance: { abs: 0.0005 }, lecture: 8,
        explanation: tex('\\exp\\{' + mA + '-(' + mB + ')\\}=e^{' + (mA - mB) + '}') + ' = ' + dec(bf) + '. A Bayes factor above ' + tex(1) + ' favours model A.',
      },
      {
        prompt: 'With equal prior probabilities, find the posterior probability of model A, ' + tex('P(A\\mid y)=B_{AB}/(1+B_{AB})') + '.',
        answer: post, tolerance: tol4, lecture: 8,
        explanation: tex(dec(bf) + '/(1+' + dec(bf) + ')') + ' = ' + dec(post) + '. Posterior odds equal the Bayes factor times the prior odds, here ' + tex(1) + '.',
      },
    ],
  }
}

export const genLec8: LQGenerator = { id: 'bay-lq-lec8', generate: (rng) => build(sample(rng)) }
