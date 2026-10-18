// LQ-A: sample autocovariance and autocorrelation of a short series by hand (lecture 1), autocovariance of a linear filter and the variance of an MA(infinity) (lecture 2).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'
import { term } from './util'

export interface Params { x: number[]; psi1: number; psi2: number; sigma2: number; phi: number }

export function sample(rng: Rng): Params {
  let x: number[]
  do x = Array.from({ length: 8 }, () => rng.int(-5, 9))
  while (new Set(x).size < 5)
  let psi1 = 0
  while (psi1 === 0) psi1 = rng.int(-8, 8) / 10
  return { x, psi1, psi2: rng.int(-6, 6) / 10, sigma2: rng.pick([1, 2, 4]), phi: rng.int(3, 8) / 10 }
}

export function build({ x, psi1, psi2, sigma2, phi }: Params): LQInstance {
  const n = x.length
  const mean = x.reduce((a, v) => a + v, 0) / n
  const g = (h: number) => { let s = 0; for (let t = 0; t + h < n; t++) s += (x[t] - mean) * (x[t + h] - mean); return s / n }
  const g0 = g(0), g1 = g(1), g2 = g(2)
  const gy1 = sigma2 * (psi1 + psi1 * psi2)
  const arVar = sigma2 / (1 - phi * phi)
  const filt = 'Y_t=Z_t' + term(psi1, 'Z_{t-1}') + term(psi2, 'Z_{t-2}')
  return {
    intro: 'Eight observations of a series are ' + x.join(', ') + ' (in time order). Use the sample autocovariance ' + tex('\\hat\\gamma(h)=\\frac1n\\sum_{t=1}^{n-h}(x_t-\\bar x)(x_{t+h}-\\bar x)') + ' with divisor ' + tex('n') + ' and ' + tex('\\hat\\rho(h)=\\hat\\gamma(h)/\\hat\\gamma(0)') + '. Give answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the sample variance ' + tex('\\hat\\gamma(0)') + ' (divisor ' + tex('n=8') + ').',
        answer: g0, tolerance: tol3, lecture: 1,
        explanation: tex('\\bar x=' + dec(mean)) + ' and ' + tex('\\hat\\gamma(0)=\\frac18\\sum(x_t-\\bar x)^2') + ' = ' + dec(g0) + '.',
      },
      {
        prompt: 'Find the sample autocorrelation ' + tex('\\hat\\rho(1)') + '.',
        answer: g1 / g0, tolerance: tol3, lecture: 1,
        explanation: tex('\\hat\\gamma(1)=' + dec(g1)) + ', so ' + tex('\\hat\\rho(1)=' + dec(g1) + '/' + dec(g0)) + ' = ' + dec(g1 / g0) + '.',
      },
      {
        prompt: 'Find the sample autocorrelation ' + tex('\\hat\\rho(2)') + '.',
        answer: g2 / g0, tolerance: tol3, lecture: 1,
        explanation: tex('\\hat\\gamma(2)=' + dec(g2)) + ', so ' + tex('\\hat\\rho(2)=' + dec(g2 / g0)) + '. Only the ' + tex('n-h') + ' available products are summed, but the divisor stays ' + tex('n') + '.',
      },
      {
        prompt: 'Let ' + tex('Z_t') + ' be white noise with variance ' + tex('\\sigma^2=' + dec(sigma2)) + ' and ' + tex(filt) + '. Find the autocovariance ' + tex('\\gamma_Y(1)=\\mathrm{Cov}(Y_t,Y_{t+1})') + '.',
        answer: gy1, tolerance: tol3, lecture: 2,
        explanation: 'Only the shared noise terms count: ' + tex('\\gamma_Y(1)=\\sigma^2(\\psi_0\\psi_1+\\psi_1\\psi_2)=' + dec(sigma2) + '\\cdot(' + dec(psi1) + '+' + dec(psi1) + '\\cdot' + dec(psi2) + ')') + ' = ' + dec(gy1) + '.',
      },
      {
        prompt: 'The process ' + tex('X_t=\\sum_{j\\ge0}' + dec(phi) + '^j Z_{t-j}') + ' (same ' + tex('\\sigma^2=' + dec(sigma2)) + ') is a linear process. Find its variance.',
        answer: arVar, tolerance: tol3, lecture: 2,
        explanation: tex('\\gamma(0)=\\sigma^2\\sum_j\\psi_j^2=\\sigma^2/(1-' + dec(phi * phi) + ')') + ' = ' + dec(arVar) + '.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'ts1-lq-a-sample', generate: (rng) => build(sample(rng)) }
