// LQ-B: exponential sample with mean theta: Cramer-Rao bound, efficiency of a UMVUE, and large-sample theory of the MLE (Wald and score statistics).
// Lectures 2 (UMVU estimation), 3 (information inequality) and 4 (large-sample theory of the MLE).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol2, tol4 } from '../../../shared/format'

export interface Params { n: number; xbar: number; th0: number; th1: number }

export function sample(rng: Rng): Params {
  const n = rng.int(8, 20)
  const th0 = rng.pick([1.5, 2, 2.5, 3])
  const th1 = rng.pick([1, 1.5, 2, 2.5, 3, 3.5, 4])
  return { n, th0, th1, xbar: rng.pick([1.2, 1.6, 2.1, 2.4, 2.8, 3.3, 3.7]) }
}

export function build({ n, xbar, th0, th1 }: Params): LQInstance {
  const crlb = (4 * th1 ** 4) / n
  const eff = (4 * (n + 1)) / (4 * n + 6)
  const se = xbar / Math.sqrt(n)
  const half = 1.96 * se
  const wald = (n * (xbar - th0) ** 2) / xbar ** 2
  const score = (n * (xbar - th0) ** 2) / th0 ** 2

  return {
    intro: 'Let ' + tex('X_1,\\dots,X_{' + n + '}') + ' be i.i.d. exponential with mean ' + tex('\\theta') + ', density ' + tex('\\theta^{-1}e^{-x/\\theta}') + '. The Fisher information in the sample is ' + tex('I_n(\\theta)=n/\\theta^2') + ', and the observed sample mean is ' + tex('\\bar x=' + xbar) + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the Cramer-Rao lower bound for the variance of an unbiased estimator of ' + tex('\\theta^2') + ' at ' + tex('\\theta=' + th1) + ' (2 decimal places).',
        answer: crlb, tolerance: tol2, lecture: 6,
        explanation: tex('g(\\theta)=\\theta^2') + ' has ' + tex('g\'(\\theta)=2\\theta') + ', so the bound is ' + tex('(2\\theta)^2\\theta^2/n=4\\theta^4/n=4(' + th1 + ')^4/' + n + '=' + dec(crlb)) + '.',
      },
      {
        prompt: 'With ' + tex('T=\\sum X_i\\sim\\mathrm{Gamma}(n,\\theta)') + ', the UMVUE of ' + tex('\\theta^2') + ' is ' + tex('T^2/\\{n(n+1)\\}') + ' with variance ' + tex('\\theta^4(4n+6)/\\{n(n+1)\\}') + '. Find its efficiency, the ratio of the Cramer-Rao bound ' + tex('4\\theta^4/n') + ' to this variance.',
        answer: eff, tolerance: tol4, lecture: 5,
        explanation: tex('\\dfrac{4/n}{(4n+6)/(n(n+1))}=\\dfrac{4(n+1)}{4n+6}=\\dfrac{' + 4 * (n + 1) + '}{' + (4 * n + 6) + '}=' + dec(eff)) + ', so the UMVUE is below the bound but close to it.',
      },
      {
        prompt: 'The MLE of ' + tex('\\theta') + ' is ' + tex('\\bar X') + '. Using the information at the MLE, find the standard error ' + tex('1/\\sqrt{I_n(\\hat\\theta)}') + ' for the observed ' + tex('\\bar x=' + xbar) + '.',
        answer: se, tolerance: tol4, lecture: 7,
        explanation: tex('I_n(\\hat\\theta)=n/\\bar x^2') + ', so the standard error is ' + tex('\\bar x/\\sqrt n=' + xbar + '/\\sqrt{' + n + '}=' + dec(se)) + '.',
      },
      {
        prompt: 'The Wald statistic for ' + tex('H_0:\\theta=' + th0) + ' is ' + tex('(\\hat\\theta-\\theta_0)^2I_n(\\hat\\theta)') + '. Find its value.',
        answer: wald, tolerance: tol4, lecture: 7,
        explanation: tex('n(\\bar x-\\theta_0)^2/\\bar x^2=' + n + '(' + dec(xbar - th0) + ')^2/' + dec(xbar ** 2) + '=' + dec(wald)) + ', to be compared with a ' + tex('\\chi^2_1') + ' distribution.',
      },
      {
        prompt: 'The score statistic for the same hypothesis is ' + tex('U(\\theta_0)^2/I_n(\\theta_0)') + ', with score ' + tex('U(\\theta)=n(\\bar x-\\theta)/\\theta^2') + '. Find its value.',
        answer: score, tolerance: tol4, lecture: 7,
        explanation: tex('U(\\theta_0)^2/I_n(\\theta_0)=n(\\bar x-\\theta_0)^2/\\theta_0^2=' + n + '(' + dec(xbar - th0) + ')^2/' + dec(th0 ** 2) + '=' + dec(score)) + '. It uses information at the null value, so it differs from the Wald statistic. (A 95% Wald interval would be ' + tex('\\bar x\\pm' + dec(half)) + '.)',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'inf-lq-b-exponential', generate: (rng) => build(sample(rng)) }
