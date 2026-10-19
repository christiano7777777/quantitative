// LQ-S: the single question of STAT4610 lecture 1 (the Bayesian framework: likelihood, prior, posterior and prediction).
// One story: the mean of a normal measurement with known variance and a normal prior. Six parts follow the lecture: the posterior
// mean and variance, how much weight the prior carries, the prior's worth in observations, the variance of a new observation
// (posterior predictive), and the upper end of a 95% credible interval.
// Lecture 1.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

/** mu0, s0sq: prior N(mu0, s0sq) for the mean; sigsq: known variance of one observation; n observations with sample mean ybar. */
export interface Params { mu0: number; s0sq: number; sigsq: number; n: number; ybar: number }

export function sample(rng: Rng): Params {
  const mu0 = rng.int(20, 60)
  // a sample mean that differs from the prior mean by a clearly non-zero amount
  const ybar = mu0 + rng.pick([-1, 1]) * (rng.int(4, 20) / 2)
  return { mu0, s0sq: rng.pick([1, 2, 4, 5, 9]), sigsq: rng.pick([4, 8, 9, 16]), n: rng.pick([4, 5, 8, 10]), ybar }
}

export function build({ mu0, s0sq, sigsq, n, ybar }: Params): LQInstance {
  const sn2 = sigsq / n // variance of the sample mean
  const post = (s0sq * ybar + sn2 * mu0) / (s0sq + sn2)
  const postVar = (s0sq * sn2) / (s0sq + sn2)
  const wPrior = sn2 / (s0sq + sn2)
  const n0 = sigsq / s0sq
  const predVar = sigsq + postVar
  const up = post + 1.96 * Math.sqrt(postVar)

  return {
    intro: 'A laboratory measures a quantity ' + tex('\\mu') + ' with an instrument whose readings are independent ' + tex('N(\\mu,' + sigsq + ')') + ' (the variance ' + tex(sigsq) + ' is known). Before measuring, the prior belief is ' + tex('\\mu\\sim N(' + mu0 + ',' + s0sq + ')') + '. Then ' + tex(n) + ' readings are taken, with sample mean ' + tex('\\bar y=' + dec(ybar)) + '. Write ' + tex('\\sigma_n^2=' + sigsq + '/' + n) + ' for the variance of the sample mean. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the posterior mean of ' + tex('\\mu') + ', ' + tex('m_n=\\dfrac{\\sigma_0^2\\bar y+\\sigma_n^2\\mu_0}{\\sigma_0^2+\\sigma_n^2}') + ' with ' + tex('\\mu_0=' + mu0) + ' and ' + tex('\\sigma_0^2=' + s0sq) + '.',
        answer: post, tolerance: tol4, lecture: 1,
        explanation: tex('\\sigma_n^2=' + sigsq + '/' + n + '=' + dec(sn2)) + ', so ' + tex('m_n=\\dfrac{' + s0sq + '\\times' + dec(ybar) + '+' + dec(sn2) + '\\times' + mu0 + '}{' + s0sq + '+' + dec(sn2) + '}') + ' = ' + dec(post) + '.',
      },
      {
        prompt: 'Find the posterior variance of ' + tex('\\mu') + ', ' + tex('s_n^2=\\dfrac{\\sigma_0^2\\sigma_n^2}{\\sigma_0^2+\\sigma_n^2}') + '.',
        answer: postVar, tolerance: tol4, lecture: 1,
        explanation: tex('\\dfrac{' + s0sq + '\\times' + dec(sn2) + '}{' + s0sq + '+' + dec(sn2) + '}') + ' = ' + dec(postVar) + '. It is smaller than both ' + tex(s0sq) + ' and ' + tex(dec(sn2)) + ': the data and the prior together are more informative than either alone.',
      },
      {
        prompt: 'The posterior mean is a weighted average ' + tex('w\\mu_0+(1-w)\\bar y') + '. Find the weight ' + tex('w') + ' that the prior mean receives.',
        answer: wPrior, tolerance: tol4, lecture: 1,
        explanation: 'The weights are inversely proportional to the variances: ' + tex('w=\\dfrac{\\sigma_n^2}{\\sigma_0^2+\\sigma_n^2}=\\dfrac{' + dec(sn2) + '}{' + s0sq + '+' + dec(sn2) + '}') + ' = ' + dec(wPrior) + '. The data receive ' + tex(dec(1 - wPrior)) + '.',
      },
      {
        prompt: 'Compare precisions: the prior precision ' + tex('1/\\sigma_0^2') + ' equals the precision ' + tex('n_0/\\sigma^2') + ' of the mean of ' + tex('n_0') + ' observations. Find the prior\'s worth in observations, ' + tex('n_0=\\sigma^2/\\sigma_0^2') + '.',
        answer: n0, tolerance: tol4, lecture: 1,
        explanation: tex('n_0=' + sigsq + '/' + s0sq) + ' = ' + dec(n0) + ' observations. The posterior precision ' + tex('1/s_n^2=(n+n_0)/\\sigma^2') + ' adds the precisions: the prior acts like ' + tex(dec(n0)) + ' extra readings.',
      },
      {
        prompt: 'A new reading ' + tex('\\tilde y') + ' is taken from the same instrument. Find the variance of its posterior predictive distribution, ' + tex('\\sigma^2+s_n^2') + '.',
        answer: predVar, tolerance: tol4, lecture: 1,
        explanation: 'The new reading is ' + tex('\\mu') + ' plus noise, and both are uncertain: ' + tex(sigsq + '+' + dec(postVar)) + ' = ' + dec(predVar) + '. The predictive distribution is ' + tex('N(' + dec(post) + ',' + dec(predVar) + ')') + '.',
      },
      {
        prompt: 'Find the upper end of the 95% credible interval for ' + tex('\\mu') + ', ' + tex('m_n+1.96\\,s_n') + '.',
        answer: up, tolerance: tol4, lecture: 1,
        explanation: tex('s_n=\\sqrt{' + dec(postVar) + '}=' + dec(Math.sqrt(postVar))) + ', so ' + tex(dec(post) + '+1.96\\times' + dec(Math.sqrt(postVar))) + ' = ' + dec(up) + '. Given the data, ' + tex('\\mu') + ' lies in the credible interval with posterior probability 0.95.',
      },
    ],
  }
}

export const genS: LQGenerator = { id: 'bay-lq-s-normalpost', generate: (rng) => build(sample(rng)) }
