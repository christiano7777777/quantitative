// LQ-G: kernel density estimates at one point (Gaussian and Epanechnikov kernels), Silverman's bandwidth, and the bandwidth and error scaling.
// Lecture 9 (kernel density estimation).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { x: number[]; x0: number; h: number; m: number }

export function sample(rng: Rng): Params {
  return { x: Array.from({ length: 5 }, () => rng.int(0, 40) / 10), x0: rng.int(5, 35) / 10, h: rng.pick([0.5, 0.8, 1, 1.5]), m: rng.pick([2, 4, 10, 32]) }
}

export const gauss = (u: number) => Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI)
export const epan = (u: number) => (Math.abs(u) <= 1 ? 0.75 * (1 - u * u) : 0)
export const kde = (x: number[], x0: number, h: number, K: (u: number) => number) => x.reduce((a, v) => a + K((x0 - v) / h), 0) / (x.length * h)

export function build({ x, x0, h, m }: Params): LQInstance {
  const n = x.length
  const g = kde(x, x0, h, gauss), e = kde(x, x0, h, epan)
  const mean = x.reduce((a, v) => a + v, 0) / n
  const s = Math.sqrt(x.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1))
  const silver = 1.06 * s * n ** (-1 / 5)
  const within = x.filter((v) => Math.abs(x0 - v) <= h).length
  const factor = m ** (-4 / 5)

  return {
    intro: 'A sample is ' + tex(x.map(dec).join(',')) + '. Estimate its density at ' + tex('x_0=' + dec(x0)) + ' by ' + tex('\\hat f(x_0)=\\frac1{nh}\\sum_iK\\{(x_0-X_i)/h\\}') + ' with bandwidth ' + tex('h=' + dec(h)) + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find ' + tex('\\hat f(x_0)') + ' with the Gaussian kernel ' + tex('K(u)=e^{-u^2/2}/\\sqrt{2\\pi}') + '.',
        answer: g, tolerance: tol4, lecture: 9,
        explanation: 'Scaled distances ' + tex('u_i=(x_0-X_i)/h') + ' are ' + x.map((v) => dec((x0 - v) / h)).join(', ') + '; averaging the kernel values and dividing by ' + tex('h') + ' gives ' + dec(g) + '.',
      },
      {
        prompt: 'Find ' + tex('\\hat f(x_0)') + ' with the Epanechnikov kernel ' + tex('K(u)=\\tfrac34(1-u^2)') + ' for ' + tex('|u|\\le1') + ' (zero otherwise).',
        answer: e, tolerance: tol4, lecture: 9,
        explanation: 'Only observations within ' + tex('h') + ' of ' + tex('x_0') + ' contribute: ' + dec(e) + '.',
      },
      {
        prompt: 'How many observations lie within ' + tex('h') + ' of ' + tex('x_0') + ' (and so contribute to the Epanechnikov estimate)?',
        answer: within, tolerance: tolInt, lecture: 9,
        explanation: 'The observations with ' + tex('|x_0-X_i|\\le' + dec(h)) + ' number ' + within + '.',
      },
      {
        prompt: 'Find Silverman\'s rule-of-thumb bandwidth ' + tex('h=1.06\\,s\\,n^{-1/5}') + ', with ' + tex('s') + ' the sample standard deviation (divisor ' + tex('n-1') + ').',
        answer: silver, tolerance: tol4, lecture: 9,
        explanation: tex('s=' + dec(s) + ',\\ 1.06\\cdot' + dec(s) + '\\cdot' + n + '^{-0.2}') + ' = ' + dec(silver) + '.',
      },
      {
        prompt: 'With the optimal bandwidth the mean integrated squared error falls like ' + tex('n^{-4/5}') + '. By what factor does it change if the sample size is multiplied by ' + tex(m) + '? (' + tex(m + '^{-4/5}') + ')',
        answer: factor, tolerance: tol4, lecture: 9,
        explanation: tex(m + '^{-0.8}') + ' = ' + dec(factor) + '. A parametric estimator would improve by the factor ' + dec(1 / m) + '.',
      },
    ],
  }
}

export const genG: LQGenerator = { id: 'np-lq-g-kde', generate: (rng) => build(sample(rng)) }
