// LQ-C: AR(2) autocorrelations from the Yule-Walker equations (lecture 4), variance, and Yule-Walker estimates from sample autocorrelations.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'
import { term } from './util'

export interface Params { p1: number; p2: number; sigma2: number; r1: number; r2: number }

export function sample(rng: Rng): Params {
  let p1: number, p2: number
  do { p1 = rng.int(3, 11) / 10; p2 = rng.int(-5, 3) / 10 } while (!(p1 + p2 < 0.95 && p2 - p1 < 0.95 && Math.abs(p2) < 0.95) || p2 === 0)
  const r1 = rng.int(4, 8) / 10
  let r2: number
  do r2 = rng.int(0, 7) / 10; while (r2 <= 2 * r1 * r1 - 1 + 0.05 || Math.abs(r2 - r1 * r1) < 0.005)
  return { p1, p2, sigma2: rng.pick([1, 2, 3]), r1, r2 }
}

export function build({ p1, p2, sigma2, r1, r2 }: Params): LQInstance {
  const rho1 = p1 / (1 - p2)
  const rho2 = p1 * rho1 + p2
  const rho3 = p1 * rho2 + p2 * rho1
  const g0 = (sigma2 * (1 - p2)) / ((1 + p2) * ((1 - p2) ** 2 - p1 * p1))
  const hat1 = (r1 * (1 - r2)) / (1 - r1 * r1)
  return {
    intro: 'The process ' + tex('X_t=' + dec(p1) + 'X_{t-1}' + term(p2, 'X_{t-2}') + '+Z_t') + ' is causal, with white noise variance ' + tex('\\sigma^2=' + dec(sigma2)) + '. Give answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the autocorrelation ' + tex('\\rho(1)') + '.',
        answer: rho1, tolerance: tol3, lecture: 4,
        explanation: 'The Yule-Walker equation at lag 1 is ' + tex('\\rho(1)=\\phi_1+\\phi_2\\rho(1)') + ', so ' + tex('\\rho(1)=' + dec(p1) + '/(1-' + dec(p2) + ')') + ' = ' + dec(rho1) + '.',
      },
      {
        prompt: 'Find the autocorrelation ' + tex('\\rho(2)') + '.',
        answer: rho2, tolerance: tol3, lecture: 4,
        explanation: tex('\\rho(2)=\\phi_1\\rho(1)+\\phi_2=' + dec(p1) + '\\cdot' + dec(rho1) + '+(' + dec(p2) + ')') + ' = ' + dec(rho2) + '.',
      },
      {
        prompt: 'Find the autocorrelation ' + tex('\\rho(3)') + '.',
        answer: rho3, tolerance: tol3, lecture: 4,
        explanation: tex('\\rho(3)=\\phi_1\\rho(2)+\\phi_2\\rho(1)') + ' = ' + dec(rho3) + '.',
      },
      {
        prompt: 'Find the variance ' + tex('\\gamma(0)') + ' of the process.',
        answer: g0, tolerance: tol3, lecture: 4,
        explanation: tex('\\gamma(0)=\\sigma^2/(1-\\phi_1\\rho(1)-\\phi_2\\rho(2))=' + dec(sigma2) + '/' + dec(1 - p1 * rho1 - p2 * rho2)) + ' = ' + dec(g0) + '.',
      },
      {
        prompt: 'A different series has sample autocorrelations ' + tex('r_1=' + dec(r1) + ',\\ r_2=' + dec(r2)) + '. Fit an AR(2) by the Yule-Walker equations and give the estimate ' + tex('\\hat\\phi_1') + '.',
        answer: hat1, tolerance: tol3, lecture: 4,
        explanation: 'Solve ' + tex('\\begin{pmatrix}1&r_1\\\\r_1&1\\end{pmatrix}\\binom{\\phi_1}{\\phi_2}=\\binom{r_1}{r_2}') + ': ' + tex('\\hat\\phi_1=r_1(1-r_2)/(1-r_1^2)') + ' = ' + dec(hat1) + '.',
      },
    ],
  }
}

export const genC: LQGenerator = { id: 'ts1-lq-c-ar', generate: (rng) => build(sample(rng)) }
