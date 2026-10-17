// LQ-A: estimating theta for a uniform(0, theta) sample: moment estimate, MLE, MSE, a Chebyshev bound, a Rao-Blackwell improvement.
// Lectures 3 (method of moments), 4 (maximum likelihood), 5 (MSE), 2 (Chebyshev bound), 6 (sufficiency, Rao-Blackwell).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params {
  theta: number // the true value, used in the MSE parts
  n: number
  tenths: number[] // observations in units of 0.1, all below 10 * theta
  r: number // Chebyshev deviation eps = r * theta
}

export function sample(rng: Rng): Params {
  const theta = rng.pick([4, 5, 6, 8, 10, 12])
  const n = rng.pick([5, 6, 8])
  const tenths = Array.from({ length: n }, () => rng.int(3, 10 * theta - 1))
  const r = rng.pick([0.3, 0.4, 0.5])
  return { theta, n, tenths, r }
}

export function build({ theta, n, tenths, r }: Params): LQInstance {
  const xs = tenths.map((t) => t / 10)
  const mean = xs.reduce((s, x) => s + x, 0) / n
  const max = Math.max(...xs)
  const mom = 2 * mean
  const mseMom = (theta * theta) / (3 * n)
  const eps = r * theta
  const cheb = (theta * theta) / (3 * n * eps * eps)
  const varU = (theta * theta) / (n * (n + 2))
  const gain = (theta * theta) / 3 - varU
  const th = tex('\\theta')

  return {
    intro:
      'A sample of ' + tex(n) + ' independent observations from the uniform distribution on ' + tex('(0,\\theta)') + ' is ' + xs.map(dec).join(', ') +
      '. Give answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the method of moments estimate of ' + th + ' from these data.',
        answer: mom, tolerance: tol3, lecture: 3,
        explanation: tex('E X=\\theta/2') + ', so set ' + tex('\\theta/2=\\bar x=' + dec(mean)) + ' and ' + tex('\\hat\\theta=2\\bar x') + ' = ' + dec(mom) + '.',
      },
      {
        prompt: 'Find the maximum likelihood estimate of ' + th + '.',
        answer: max, tolerance: tol3, lecture: 4,
        explanation: tex('L(\\theta)=\\theta^{-n}') + ' for ' + tex('\\theta\\ge x_{(n)}') + ' and decreases in ' + th + ', so the maximiser is the sample maximum ' + dec(max) + '.',
      },
      {
        prompt: 'Suppose the true value is ' + tex('\\theta=' + theta) + '. Find the mean squared error of the moment estimator ' + tex('2\\bar X') + ' (an average over all samples of size ' + n + ').',
        answer: mseMom, tolerance: tol3, lecture: 5,
        explanation: tex('2\\bar X') + ' is unbiased, so the MSE is its variance: ' + tex('4\\cdot\\dfrac{\\theta^2/12}{n}=\\dfrac{\\theta^2}{3n}=\\dfrac{' + theta * theta + '}{' + 3 * n + '}') + ' = ' + dec(mseMom) + '.',
      },
      {
        prompt: 'With the same true value ' + tex('\\theta=' + theta) + ', use Chebyshev\'s inequality to give an upper bound for ' + tex('P(|2\\bar X-\\theta|\\ge' + dec(eps) + ')') + '. (Use ' + tex('\\operatorname{Var}(2\\bar X)=\\theta^2/(3n)') + '.)',
        answer: cheb, tolerance: tol3, lecture: 2,
        explanation: 'Chebyshev: ' + tex('P(|Y-EY|\\ge\\varepsilon)\\le\\operatorname{Var}(Y)/\\varepsilon^2') + ' with ' + tex('Y=2\\bar X') + ' unbiased, so the bound is ' + tex('\\dfrac{\\theta^2}{3n\\varepsilon^2}=\\dfrac{' + theta * theta + '}{' + dec(3 * n * eps * eps) + '}') + ' = ' + dec(cheb) + '.',
      },
      {
        prompt: tex('2X_1') + ' is unbiased for ' + th + ' with variance ' + tex('\\theta^2/3') + '. The maximum ' + tex('X_{(n)}') + ' is sufficient, and Rao-Blackwellisation gives ' + tex('E[2X_1\\mid X_{(n)}]=\\tfrac{n+1}{n}X_{(n)}') + ', whose variance is ' + tex('\\theta^2/\\{n(n+2)\\}') + '. By how much does conditioning reduce the variance when ' + tex('\\theta=' + theta) + '?',
        answer: gain, tolerance: tol3, lecture: 6,
        explanation: 'The variance falls from ' + tex('\\theta^2/3=' + dec(theta * theta / 3)) + ' to ' + tex('\\theta^2/\\{n(n+2)\\}=\\dfrac{' + theta * theta + '}{' + n * (n + 2) + '}=' + dec(varU)) + ', a reduction of ' + dec(gain) + '. Conditioning on a sufficient statistic never increases the variance.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'p2-lq-a-uniform', generate: (rng) => build(sample(rng)) }
