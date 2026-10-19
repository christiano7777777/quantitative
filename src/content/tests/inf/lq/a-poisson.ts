// LQ-A: Poisson sample: natural parameter of the exponential family, UMVU estimators by Rao-Blackwell / Lehmann-Scheffe, and the variance of a UMVUE.
// Lectures 1 (exponential families), 2 (UMVU estimation) and 3 (information inequality).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params { n: number; total: number; lam0: number }

export function sample(rng: Rng): Params {
  const n = rng.int(5, 10)
  return { n, total: rng.int(2 * n, 4 * n), lam0: rng.pick([0.5, 1, 1.5, 2]) }
}

export function build({ n, total, lam0 }: Params): LQInstance {
  const t = total
  const eta = Math.log(t / n)
  const u2 = (t * (t - 1)) / (n * n)
  const u3 = (1 - 1 / n) ** t
  const u4 = (t / n) * (1 - 1 / n) ** (t - 1)
  const v = (4 * lam0 ** 3) / n + (2 * lam0 ** 2) / (n * n)

  return {
    intro: 'Let ' + tex('X_1,\\dots,X_{' + n + '}') + ' be i.i.d. Poisson(' + tex('\\lambda') + ') and suppose the observed total is ' + tex('T=\\sum_i X_i=' + t) + '. Recall that ' + tex('T') + ' is complete and sufficient. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'The Poisson pmf is ' + tex('\\frac{1}{x!}\\exp\\{x\\eta-e^{\\eta}\\}') + ' with natural parameter ' + tex('\\eta=\\log\\lambda') + '. Find the maximum likelihood estimate of ' + tex('\\eta') + ' from the data.',
        answer: eta, tolerance: tol4, lecture: 8,
        explanation: 'The MLE of ' + tex('\\lambda') + ' is ' + tex('T/n=' + t + '/' + n + '=' + dec(t / n)) + ', so by invariance ' + tex('\\hat\\eta=\\log(' + dec(t / n) + ')=' + dec(eta)) + '.',
      },
      {
        prompt: 'The UMVUE of ' + tex('\\lambda^2') + ' is a function of ' + tex('T') + ' with expectation ' + tex('\\lambda^2') + '. Using ' + tex('E[T(T-1)]=(n\\lambda)^2') + ', find its value.',
        answer: u2, tolerance: tol4, lecture: 12,
        explanation: tex('T(T-1)/n^2=' + t + '\\cdot' + (t - 1) + '/' + n * n + '=' + dec(u2)) + '. It is unbiased and a function of the complete sufficient statistic, so by Lehmann-Scheffe it is the UMVUE.',
      },
      {
        prompt: 'The indicator ' + tex('\\mathbf 1\\{X_1=0\\}') + ' is unbiased for ' + tex('e^{-\\lambda}') + '. Given ' + tex('T=' + t) + ', ' + tex('X_1') + ' is ' + tex('\\mathrm{Bin}(' + t + ',1/' + n + ')') + '. Find the UMVUE of ' + tex('e^{-\\lambda}') + ' (the conditional expectation of the indicator).',
        answer: u3, tolerance: tol4, lecture: 12,
        explanation: 'Rao-Blackwellization: ' + tex('P(X_1=0\\mid T=t)=(1-1/n)^t=(1-1/' + n + ')^{' + t + '}=' + dec(u3)) + '. Note that the plug-in ' + tex('e^{-T/n}') + ' is a different (biased) estimator.',
      },
      {
        prompt: 'Similarly find the UMVUE of ' + tex('P(X_1=1)=\\lambda e^{-\\lambda}') + ', that is ' + tex('P(X_1=1\\mid T=' + t + ')') + '.',
        answer: u4, tolerance: tol4, lecture: 12,
        explanation: 'With ' + tex('X_1\\mid T=t\\sim\\mathrm{Bin}(t,1/n)') + ': ' + tex(t + '\\cdot\\frac1{' + n + '}(1-\\frac1{' + n + '})^{' + (t - 1) + '}=' + dec(u4)) + '.',
      },
      {
        prompt: 'The UMVUE ' + tex('T(T-1)/n^2') + ' of ' + tex('\\lambda^2') + ' has variance ' + tex('4\\lambda^3/n+2\\lambda^2/n^2') + '. Find this variance at ' + tex('\\lambda=' + lam0) + ' (3 decimal places). It exceeds the Cramer-Rao bound ' + tex('4\\lambda^3/n') + '.',
        answer: v, tolerance: tol3, lecture: 13,
        explanation: tex('4(' + lam0 + ')^3/' + n + '=' + dec((4 * lam0 ** 3) / n)) + ' plus ' + tex('2(' + lam0 + ')^2/' + n * n + '=' + dec((2 * lam0 ** 2) / (n * n))) + ' gives ' + dec(v) + '. The UMVUE does not attain the information bound for ' + tex('\\lambda^2') + '.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'inf-lq-a-poisson', generate: (rng) => build(sample(rng)) }
