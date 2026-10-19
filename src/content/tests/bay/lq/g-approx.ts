// LQ-G: Laplace approximation of a Beta posterior, and the ELBO and optimal factor variance for a normal model.
// Lectures 10 (Laplace approximation) and 11 (variational Bayes).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { a: number; b: number; y: number; sigma: number; tau: number; m: number; s2: number }

export function sample(rng: Rng): Params {
  return { a: rng.int(5, 30), b: rng.int(5, 30), y: rng.int(-20, 40) / 10, sigma: rng.pick([1, 2]), tau: rng.pick([1, 2, 3]), m: rng.int(-10, 20) / 10, s2: rng.pick([0.3, 0.5, 0.8, 1]) }
}

export function build({ a, b, y, sigma, tau, m, s2 }: Params): LQInstance {
  const mode = (a - 1) / (a + b - 2)
  const hess = (a - 1) / mode ** 2 + (b - 1) / (1 - mode) ** 2
  const lapVar = 1 / hess
  const exact = (a * b) / ((a + b) ** 2 * (a + b + 1))
  const elbo = -0.5 * Math.log(2 * Math.PI * sigma * sigma) - ((y - m) ** 2 + s2) / (2 * sigma * sigma) - 0.5 * Math.log(2 * Math.PI * tau * tau) - (m * m + s2) / (2 * tau * tau) + 0.5 * Math.log(2 * Math.PI * Math.E * s2)
  const sOpt = 1 / (1 / (sigma * sigma) + 1 / (tau * tau))

  return {
    intro: 'Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'A posterior is ' + tex('\\mathrm{Beta}(' + a + ',' + b + ')') + '. Find its mode ' + tex('(a-1)/(a+b-2)') + ', the centre of the Laplace approximation.',
        answer: mode, tolerance: tol4, lecture: 13,
        explanation: tex('(' + a + '-1)/(' + a + '+' + b + '-2)') + ' = ' + dec(mode) + '.',
      },
      {
        prompt: 'The negative second derivative of the log-posterior ' + tex('(a-1)\\ln\\theta+(b-1)\\ln(1-\\theta)') + ' at the mode is ' + tex('\\frac{a-1}{\\theta^2}+\\frac{b-1}{(1-\\theta)^2}') + '. Find the variance of the Laplace approximation (its reciprocal), to 6 decimal places.',
        answer: lapVar, tolerance: { abs: 0.0000005 }, lecture: 13,
        explanation: 'At ' + tex('\\theta=' + dec(mode)) + ' the curvature is ' + dec(hess) + ', so the variance is ' + dec(lapVar) + '.',
      },
      {
        prompt: 'Find the exact variance of the ' + tex('\\mathrm{Beta}(' + a + ',' + b + ')') + ' posterior, ' + tex('\\dfrac{ab}{(a+b)^2(a+b+1)}') + ' (6 decimal places), for comparison.',
        answer: exact, tolerance: { abs: 0.0000005 }, lecture: 13,
        explanation: tex('\\dfrac{' + a * b + '}{' + (a + b) ** 2 + '\\cdot' + (a + b + 1) + '}') + ' = ' + dec(exact) + ', close to the Laplace value ' + dec(lapVar) + '.',
      },
      {
        prompt: 'One observation ' + tex('y=' + dec(y)) + ' with ' + tex('y\\mid\\theta\\sim N(\\theta,' + dec(sigma * sigma) + ')') + ' and prior ' + tex('\\theta\\sim N(0,' + dec(tau * tau) + ')') + ' is given. For the variational family ' + tex('q=N(m,s^2)') + ' with ' + tex('m=' + dec(m) + ',\\ s^2=' + dec(s2)) + ', find the ELBO ' + tex('E_q[\\log p(y\\mid\\theta)]+E_q[\\log p(\\theta)]+H(q)') + ' (use ' + tex('H(q)=\\tfrac12\\ln(2\\pi e s^2)') + ' and ' + tex('E_q[(c-\\theta)^2]=(c-m)^2+s^2') + ').',
        answer: elbo, tolerance: tol4, lecture: 14,
        explanation: 'The three pieces are ' + tex('-\\tfrac12\\ln(2\\pi\\sigma^2)-\\frac{(y-m)^2+s^2}{2\\sigma^2}') + ', ' + tex('-\\tfrac12\\ln(2\\pi\\tau^2)-\\frac{m^2+s^2}{2\\tau^2}') + ' and ' + tex('\\tfrac12\\ln(2\\pi es^2)') + '; the total is ' + dec(elbo) + '.',
      },
      {
        prompt: 'Maximising the ELBO over ' + tex('s^2') + ' gives ' + tex('s^2=(1/\\sigma^2+1/\\tau^2)^{-1}') + ', the exact posterior variance in this model. Find it.',
        answer: sOpt, tolerance: tol4, lecture: 14,
        explanation: tex('(1/' + dec(sigma * sigma) + '+1/' + dec(tau * tau) + ')^{-1}') + ' = ' + dec(sOpt) + '. Here the exact posterior is normal, so the variational family contains it; in general mean-field underestimates variances.',
      },
    ],
  }
}

export const genG: LQGenerator = { id: 'bay-lq-g-approx', generate: (rng) => build(sample(rng)) }
