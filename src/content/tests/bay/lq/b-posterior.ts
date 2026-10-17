// LQ-B: normal-normal and gamma-Poisson updates, a credible interval, and the effect of the prior in a Beta-binomial model.
// Lectures 2 (conjugate models), 3 (posterior summaries) and 4 (choosing a prior).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { mu0: number; tau: number; sigma: number; n: number; ybar: number; ga: number; gb: number; S: number; m: number; nb: number; kb: number }

export function sample(rng: Rng): Params {
  return {
    mu0: rng.int(-10, 10) / 10, tau: rng.pick([0.5, 1, 2]), sigma: rng.pick([1, 2, 3]), n: rng.pick([4, 9, 16, 25]), ybar: rng.int(-20, 30) / 10,
    ga: rng.pick([2, 3, 5]), gb: rng.pick([1, 2]), S: rng.int(8, 40), m: rng.int(4, 12), nb: rng.int(6, 20), kb: rng.int(1, 5),
  }
}

export function build({ mu0, tau, sigma, n, ybar, ga, gb, S, m, nb, kb }: Params): LQInstance {
  const prec = 1 / (tau * tau) + n / (sigma * sigma)
  const pm = (mu0 / (tau * tau) + (n * ybar) / (sigma * sigma)) / prec
  const psd = Math.sqrt(1 / prec)
  const lo = pm - 1.96 * psd
  const gm = (ga + S) / (gb + m)
  const flat = (kb + 1) / (nb + 2), jeff = (kb + 0.5) / (nb + 1)

  return {
    intro: 'Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Normal data with known standard deviation ' + tex('\\sigma=' + dec(sigma)) + ' have sample mean ' + tex('\\bar y=' + dec(ybar)) + ' from ' + tex('n=' + n) + ' observations. The prior on the mean is ' + tex('N(' + dec(mu0) + ',' + dec(tau * tau) + ')') + '. Find the posterior mean.',
        answer: pm, tolerance: tol4, lecture: 2,
        explanation: 'Precision ' + tex('1/' + dec(tau * tau) + '+' + n + '/' + dec(sigma * sigma) + '=' + dec(prec)) + '; precision-weighted mean ' + dec(pm) + '.',
      },
      {
        prompt: 'Find the posterior standard deviation ' + tex('\\sqrt{(1/\\tau^2+n/\\sigma^2)^{-1}}') + '.',
        answer: psd, tolerance: tol4, lecture: 2,
        explanation: tex('1/\\sqrt{' + dec(prec) + '}') + ' = ' + dec(psd) + '.',
      },
      {
        prompt: 'Find the lower end of the equal-tailed 95% credible interval, ' + tex('\\text{mean}-1.96\\times\\text{sd}') + ' (the posterior is normal).',
        answer: lo, tolerance: tol4, lecture: 3,
        explanation: tex(dec(pm) + '-1.96\\cdot' + dec(psd)) + ' = ' + dec(lo) + '. It is a direct statement: the mean lies in the interval with probability 0.95 given the data and prior.',
      },
      {
        prompt: 'Event counts follow a Poisson distribution with rate ' + tex('\\lambda') + ' and a ' + tex('\\mathrm{Gamma}(' + ga + ',' + gb + ')') + ' prior (shape, rate). The total count over ' + tex(m) + ' periods is ' + tex(S) + '. Find the posterior mean of ' + tex('\\lambda') + '.',
        answer: gm, tolerance: tol4, lecture: 2,
        explanation: 'The posterior is ' + tex('\\mathrm{Gamma}(' + (ga + S) + ',' + (gb + m) + ')') + ', with mean ' + tex((ga + S) + '/' + (gb + m)) + ' = ' + dec(gm) + '.',
      },
      {
        prompt: tex(kb) + ' successes were observed in ' + tex(nb) + ' trials. Find the difference in posterior means, ' + tex('\\text{flat prior }\\mathrm{Beta}(1,1)') + ' minus ' + tex('\\text{Jeffreys prior }\\mathrm{Beta}(\\tfrac12,\\tfrac12)') + ' (a prior sensitivity check).',
        answer: flat - jeff, tolerance: { abs: 0.00005 }, lecture: 4,
        explanation: tex('\\frac{' + (kb + 1) + '}{' + (nb + 2) + '}-\\frac{' + (kb + 0.5) + '}{' + (nb + 1) + '}=' + dec(flat) + '-' + dec(jeff)) + ' = ' + dec(flat - jeff) + '.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'bay-lq-b-posterior', generate: (rng) => build(sample(rng)) }
