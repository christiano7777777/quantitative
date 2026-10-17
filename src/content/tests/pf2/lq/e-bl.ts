// LQ-E: Black-Litterman with one absolute view: equilibrium return, weight on the view, posterior mean and variance, optimal weight.
// Lecture 6 (Black-Litterman).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { delta: number; s11: number; s12: number; w1: number; tau: number; omega: number; q: number }

export function sample(rng: Rng): Params {
  return {
    delta: rng.pick([2, 2.5, 3]), s11: rng.pick([0.04, 0.05, 0.06]), s12: rng.pick([0.01, 0.015, 0.02]), w1: rng.pick([0.5, 0.6, 0.7]),
    tau: rng.pick([0.05, 0.1]), omega: rng.pick([0.001, 0.002, 0.004]), q: rng.int(5, 14) / 100,
  }
}

export function build({ delta, s11, s12, w1, tau, omega, q }: Params): LQInstance {
  const w2 = 1 - w1
  const pi = delta * (s11 * w1 + s12 * w2)
  const prec0 = 1 / (tau * s11), precV = 1 / omega
  const wv = precV / (prec0 + precV)
  const mu = (prec0 * pi + precV * q) / (prec0 + precV)
  const v = 1 / (prec0 + precV)
  const wopt = mu / (delta * s11)

  return {
    intro:
      'Two assets have covariance matrix with ' + tex('\\sigma_{11}=' + dec(s11) + ',\\ \\sigma_{12}=' + dec(s12)) + ' and market weights ' + tex('(' + dec(w1) + ',' + dec(w2) + ')') + '. The risk aversion is ' + tex('\\delta=' + dec(delta)) + ' and ' + tex('\\tau=' + dec(tau)) +
      '. An investor has an absolute view that asset 1 will return ' + tex('q=' + dec(q)) + ' with view variance ' + tex('\\Omega=' + dec(omega)) + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the equilibrium (prior) expected return of asset 1, ' + tex('\\pi_1=\\delta(\\sigma_{11}w_1+\\sigma_{12}w_2)') + '.',
        answer: pi, tolerance: tol4, lecture: 6,
        explanation: tex(dec(delta) + '(' + dec(s11) + '\\cdot' + dec(w1) + '+' + dec(s12) + '\\cdot' + dec(w2) + ')') + ' = ' + dec(pi) + '.',
      },
      {
        prompt: 'The prior for asset 1 has variance ' + tex('\\tau\\sigma_{11}') + '. Find the weight the posterior puts on the view, ' + tex('\\dfrac{1/\\Omega}{1/(\\tau\\sigma_{11})+1/\\Omega}') + '.',
        answer: wv, tolerance: tol4, lecture: 6,
        explanation: tex('\\tau\\sigma_{11}=' + dec(tau * s11)) + ', so the precisions are ' + dec(prec0) + ' and ' + dec(precV) + ', giving ' + dec(wv) + '.',
      },
      {
        prompt: 'Find the posterior mean return of asset 1 (treating asset 1 on its own).',
        answer: mu, tolerance: tol4, lecture: 6,
        explanation: tex('(1-w)\\pi_1+wq=' + dec(1 - wv) + '\\cdot' + dec(pi) + '+' + dec(wv) + '\\cdot' + dec(q)) + ' = ' + dec(mu) + '.',
      },
      {
        prompt: 'Find the posterior variance of the expected return of asset 1, ' + tex('1/(1/(\\tau\\sigma_{11})+1/\\Omega)') + ' (4 decimal places).',
        answer: v, tolerance: { abs: 0.00005 }, lecture: 6,
        explanation: tex('1/(' + dec(prec0) + '+' + dec(precV) + ')') + ' = ' + dec(v) + ', smaller than both the prior variance and the view variance.',
      },
      {
        prompt: 'Treating asset 1 on its own, find its mean-variance weight ' + tex('\\mu/(\\delta\\sigma_{11})') + ' using the posterior mean.',
        answer: wopt, tolerance: tol4, lecture: 6,
        explanation: tex(dec(mu) + '/(' + dec(delta) + '\\cdot' + dec(s11) + ')') + ' = ' + dec(wopt) + '.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'pf2-lq-e-bl', generate: (rng) => build(sample(rng)) }
