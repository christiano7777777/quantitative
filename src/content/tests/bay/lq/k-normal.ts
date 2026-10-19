// LQ-K: the normal-normal model in the notation of the lecture notes: posterior mean and variance, the posterior predictive
// variance and the prior pseudo-count.
// Lecture 2 (Bayes' theorem: likelihood, prior, posterior, predictive).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { mu0: number; s0: number; sigma2: number; n: number; ybar: number }

export function sample(rng: Rng): Params {
  return {
    mu0: rng.int(-6, 6) / 2, s0: rng.pick([0.5, 1, 2, 4]), sigma2: rng.pick([1, 2, 4, 9]),
    n: rng.pick([4, 5, 8, 10, 16]), ybar: rng.int(-8, 12) / 2,
  }
}

export function build({ mu0, s0, sigma2, n, ybar }: Params): LQInstance {
  const sn2 = sigma2 / n // sigma_n^2
  const m = (s0 * ybar + sn2 * mu0) / (s0 + sn2)
  const v = (s0 * sn2) / (s0 + sn2)
  const pred = sigma2 + v
  const pseudo = sigma2 / s0

  return {
    intro: 'Let ' + tex('y_1,\\dots,y_n') + ' be i.i.d. ' + tex('N(\\mu,\\sigma^2)') + ' with known ' + tex('\\sigma^2=' + dec(sigma2)) + ' and prior ' + tex('\\mu\\sim N(\\mu_0,\\sigma_0^2)') + ' with ' + tex('\\mu_0=' + dec(mu0) + ',\\ \\sigma_0^2=' + dec(s0)) + '. The sample of ' + tex('n=' + n) + ' observations has mean ' + tex('\\bar y_n=' + dec(ybar)) + '. Write ' + tex('\\sigma_n^2=\\sigma^2/n') + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the sampling variance of the sample mean, ' + tex('\\sigma_n^2=\\sigma^2/n') + '.',
        answer: sn2, tolerance: tol4, lecture: 2,
        explanation: tex(dec(sigma2) + '/' + n) + ' = ' + dec(sn2) + '.',
      },
      {
        prompt: 'The posterior is ' + tex('N(m_n,s_n^2)') + '. Find the posterior mean ' + tex('m_n=\\dfrac{\\sigma_0^2\\bar y_n+\\sigma_n^2\\mu_0}{\\sigma_0^2+\\sigma_n^2}') + '.',
        answer: m, tolerance: tol4, lecture: 2,
        explanation: tex('\\dfrac{' + dec(s0) + '\\times' + dec(ybar) + '+' + dec(sn2) + '\\times' + dec(mu0) + '}{' + dec(s0) + '+' + dec(sn2) + '}') + ' = ' + dec(m) + '. It is a weighted average of ' + tex('\\mu_0') + ' and ' + tex('\\bar y_n') + ' with weights inversely proportional to the variances ' + tex('\\sigma_0^2') + ' and ' + tex('\\sigma_n^2') + '.',
      },
      {
        prompt: 'Find the posterior variance ' + tex('s_n^2=\\dfrac{\\sigma_0^2\\sigma_n^2}{\\sigma_0^2+\\sigma_n^2}') + '.',
        answer: v, tolerance: tol4, lecture: 2,
        explanation: tex('\\dfrac{' + dec(s0) + '\\times' + dec(sn2) + '}{' + dec(s0) + '+' + dec(sn2) + '}') + ' = ' + dec(v) + ', smaller than both ' + dec(s0) + ' and ' + dec(sn2) + '.',
      },
      {
        prompt: 'A new observation ' + tex('\\tilde y') + ' has posterior predictive density ' + tex('N(m_n,\\sigma^2+s_n^2)') + '. Find its variance.',
        answer: pred, tolerance: tol4, lecture: 2,
        explanation: 'Sampling variance plus posterior uncertainty: ' + tex(dec(sigma2) + '+' + dec(v)) + ' = ' + dec(pred) + '.',
      },
      {
        prompt: 'The posterior variance can be written ' + tex('s_n^2=\\sigma^2/(n+\\sigma^2/\\sigma_0^2)') + ', so ' + tex('\\sigma^2/\\sigma_0^2') + ' acts as a prior pseudo-count of observations. Find it.',
        answer: pseudo, tolerance: tol4, lecture: 2,
        explanation: tex(dec(sigma2) + '/' + dec(s0)) + ' = ' + dec(pseudo) + ' prior observations (check: ' + tex(dec(sigma2) + '/(' + n + '+' + dec(pseudo) + ')=' + dec(v)) + ').',
      },
    ],
  }
}

export const genK: LQGenerator = { id: 'bay-lq-k-normal', generate: (rng) => build(sample(rng)) }
