// LQ-E: one step of the Euler, Milstein and exact schemes for geometric Brownian motion, strong-error scaling, and a Metropolis acceptance ratio.
// Lectures 7 (discretising SDEs) and 8 (MCMC).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol2, tol4 } from '../../../shared/format'

export interface Params { s0: number; mu: number; sigma: number; h: number; dw: number; err: number; k: number; alpha: number; beta: number; x: number; y: number }

export function sample(rng: Rng): Params {
  return {
    s0: rng.int(50, 150), mu: rng.int(2, 12) / 100, sigma: rng.int(2, 5) / 10, h: rng.pick([0.25, 0.5, 1]), dw: rng.int(-30, 30) / 100,
    err: rng.int(2, 9) / 100, k: rng.pick([4, 9, 16, 25]), alpha: rng.int(2, 5), beta: rng.int(1, 3), x: rng.int(5, 40) / 10, y: rng.int(5, 40) / 10,
  }
}

export function build({ s0, mu, sigma, h, dw, err, k, alpha, beta, x, y }: Params): LQInstance {
  const euler = s0 + mu * s0 * h + sigma * s0 * dw
  const milstein = euler + 0.5 * sigma * sigma * s0 * (dw * dw - h)
  const exact = s0 * Math.exp((mu - 0.5 * sigma * sigma) * h + sigma * dw)
  const scaled = err / Math.sqrt(k)
  const acc = Math.min(1, (y / x) ** (alpha - 1) * Math.exp(-beta * (y - x)))
  const sde = tex('dS=' + dec(mu) + 'S\\,dt+' + dec(sigma) + 'S\\,dW')

  return {
    intro: 'Geometric Brownian motion ' + sde + ' starts at ' + tex('S_0=' + s0) + '. One time step has size ' + tex('h=' + dec(h)) + ' and the Brownian increment is ' + tex('\\Delta W=' + dec(dw)) + '. Give the first three answers to 2 decimal places and the others to 4.',
    parts: [
      {
        prompt: 'Find the Euler-Maruyama value ' + tex('S_1=S_0+\\mu S_0h+\\sigma S_0\\Delta W') + '.',
        answer: euler, tolerance: tol2, lecture: 7,
        explanation: tex(s0 + '+' + dec(mu * s0 * h) + '+' + dec(sigma * s0 * dw) + '=' + dec(euler)) + '.',
      },
      {
        prompt: 'Find the Milstein value, which adds ' + tex('\\tfrac12\\sigma^2S_0(\\Delta W^2-h)') + ' to the Euler value.',
        answer: milstein, tolerance: tol2, lecture: 7,
        explanation: 'The correction is ' + tex('\\tfrac12(' + dec(sigma) + ')^2\\cdot' + s0 + '\\cdot(' + dec(dw * dw) + '-' + dec(h) + ')=' + dec(milstein - euler)) + ', giving ' + tex(dec(milstein)) + '.',
      },
      {
        prompt: 'Find the exact solution over the step, ' + tex('S_0\\exp\\{(\\mu-\\tfrac12\\sigma^2)h+\\sigma\\Delta W\\}') + ', using the same ' + tex('\\Delta W') + '.',
        answer: exact, tolerance: tol2, lecture: 7,
        explanation: tex('\\exp\\{' + dec((mu - 0.5 * sigma * sigma) * h) + '+' + dec(sigma * dw) + '\\}=' + dec(exact / s0)) + ', times ' + tex(String(s0)) + ' gives ' + tex(dec(exact)) + '. Milstein is typically closer than Euler.',
      },
      {
        prompt: 'The Euler scheme has strong order ' + tex('1/2') + '. If its strong error is ' + tex(dec(err)) + ' at step size ' + tex('h') + ', what strong error do you expect with step size ' + tex('h/' + k) + '?',
        answer: scaled, tolerance: tol4, lecture: 7,
        explanation: 'Error ' + tex('\\propto h^{1/2}') + ': ' + tex(dec(err) + '/\\sqrt{' + k + '}=' + dec(scaled)) + '.',
      },
      {
        prompt: 'A random-walk Metropolis sampler targets ' + tex('\\pi(x)\\propto x^{' + (alpha - 1) + '}e^{-' + beta + 'x}') + ' for ' + tex('x>0') + '. The chain is at ' + tex('x=' + dec(x)) + ' and proposes ' + tex('y=' + dec(y)) + ' from a symmetric proposal. Find the acceptance probability ' + tex('\\min\\{1,\\pi(y)/\\pi(x)\\}') + '.',
        answer: acc, tolerance: tol4, lecture: 8,
        explanation: tex('(' + dec(y) + '/' + dec(x) + ')^{' + (alpha - 1) + '}e^{-' + beta + '(' + dec(y) + '-' + dec(x) + ')}=' + dec((y / x) ** (alpha - 1) * Math.exp(-beta * (y - x)))) + ', capped at 1: ' + dec(acc) + '. The normalising constant cancels.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'mc-lq-e-sde', generate: (rng) => build(sample(rng)) }
