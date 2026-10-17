// LQ-A: estimating theta for a uniform(0, theta) sample: moment estimate, MLE, mean squared errors, a UMVUE variance.
// Lectures 2 (method of moments), 3 (maximum likelihood), 4 (MSE), 5 (unbiased function of the sufficient statistic).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params {
  theta: number // the true value, used in the MSE parts
  n: number
  tenths: number[] // observations in units of 0.1, all below 10 * theta
}

export function sample(rng: Rng): Params {
  const theta = rng.pick([4, 5, 6, 8, 10, 12])
  const n = rng.pick([5, 6, 8])
  const tenths = Array.from({ length: n }, () => rng.int(3, 10 * theta - 1))
  return { theta, n, tenths }
}

export function build({ theta, n, tenths }: Params): LQInstance {
  const xs = tenths.map((t) => t / 10)
  const mean = xs.reduce((s, x) => s + x, 0) / n
  const max = Math.max(...xs)
  const mom = 2 * mean
  const mseMom = (theta * theta) / (3 * n)
  const mseMle = (2 * theta * theta) / ((n + 1) * (n + 2))
  const varU = (theta * theta) / (n * (n + 2))
  const th = tex('\\theta')

  return {
    intro:
      'A sample of ' + tex(n) + ' independent observations from the uniform distribution on ' + tex('(0,\\theta)') + ' is ' + xs.map(dec).join(', ') +
      '. Give answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the method of moments estimate of ' + th + ' from these data.',
        answer: mom, tolerance: tol3, lecture: 2,
        explanation: tex('E X=\\theta/2') + ', so set ' + tex('\\theta/2=\\bar x=' + dec(mean)) + ' and ' + tex('\\hat\\theta=2\\bar x') + ' = ' + dec(mom) + '.',
      },
      {
        prompt: 'Find the maximum likelihood estimate of ' + th + '.',
        answer: max, tolerance: tol3, lecture: 3,
        explanation: tex('L(\\theta)=\\theta^{-n}') + ' for ' + tex('\\theta\\ge x_{(n)}') + ' and decreases in ' + th + ', so the maximiser is the sample maximum ' + dec(max) + '.',
      },
      {
        prompt: 'Suppose the true value is ' + tex('\\theta=' + theta) + '. Find the mean squared error of the moment estimator ' + tex('2\\bar X') + ' (an average over all samples of size ' + n + ').',
        answer: mseMom, tolerance: tol3, lecture: 4,
        explanation: tex('2\\bar X') + ' is unbiased, so the MSE is its variance: ' + tex('4\\cdot\\dfrac{\\theta^2/12}{n}=\\dfrac{\\theta^2}{3n}=\\dfrac{' + theta * theta + '}{' + 3 * n + '}') + ' = ' + dec(mseMom) + '.',
      },
      {
        prompt: 'With the same true value ' + tex('\\theta=' + theta) + ', find the mean squared error of the maximum likelihood estimator ' + tex('X_{(n)}') + '. (Use ' + tex('E X_{(n)}=\\frac{n}{n+1}\\theta') + ' and ' + tex('E X_{(n)}^2=\\frac{n}{n+2}\\theta^2') + '.)',
        answer: mseMle, tolerance: tol3, lecture: 4,
        explanation: tex('\\mathrm{MSE}=E X_{(n)}^2-2\\theta E X_{(n)}+\\theta^2=\\theta^2\\Big(\\dfrac{n}{n+2}-\\dfrac{2n}{n+1}+1\\Big)=\\dfrac{2\\theta^2}{(n+1)(n+2)}') + ' = ' + dec(mseMle) + '.',
      },
      {
        prompt: 'The estimator ' + tex('\\tfrac{n+1}{n}X_{(n)}') + ' is the UMVUE of ' + th + ' (it is unbiased and a function of the complete sufficient statistic). Find its variance when ' + tex('\\theta=' + theta) + '.',
        answer: varU, tolerance: tol3, lecture: 5,
        explanation: tex('\\operatorname{Var}\\big(\\tfrac{n+1}{n}X_{(n)}\\big)=\\Big(\\dfrac{n+1}{n}\\Big)^2\\Big(\\dfrac{n}{n+2}-\\dfrac{n^2}{(n+1)^2}\\Big)\\theta^2=\\dfrac{\\theta^2}{n(n+2)}=\\dfrac{' + theta * theta + '}{' + n * (n + 2) + '}') + ' = ' + dec(varU) + '.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'inf-lq-a-uniform', generate: (rng) => build(sample(rng)) }
