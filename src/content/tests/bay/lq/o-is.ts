// LQ-O: self-normalised importance sampling for an unnormalised target with an exponential proposal: weights, SNIS estimate, ESS.
// Lecture 8 (importance sampling).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { x: number[]; r: number }

export function sample(rng: Rng): Params {
  const r = rng.pick([0.4, 0.5, 0.6])
  return { x: rng.sample([0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7], 4), r }
}

export function build({ x, r }: Params): LQInstance {
  // target kernel f~(x) = x^2 e^{-x} (a Gamma(3,1) kernel), proposal g(x) = r e^{-r x}
  const w = x.map((v) => (v * v * Math.exp(-v)) / (r * Math.exp(-r * v)))
  const sw = w.reduce((a, b) => a + b, 0)
  const est = w.reduce((a, b, i) => a + b * x[i], 0) / sw
  const ess = sw ** 2 / w.reduce((a, b) => a + b * b, 0)
  const imax = w.indexOf(Math.max(...w))
  const wmax = w[imax] / sw

  return {
    intro: 'We want ' + tex('E[X]') + ' for a target known only up to a constant, ' + tex('\\tilde f(x)=x^2e^{-x}') + ' for ' + tex('x>0') + ' (a Gamma(3,1) kernel). Four draws from the proposal ' + tex('g(x)=' + dec(r) + 'e^{-' + dec(r) + 'x}') + ' (exponential with rate ' + tex(dec(r)) + ') are ' + tex('x=' + x.map(dec).join(',\\ ')) + '. Use the unnormalised importance weights ' + tex('\\tilde w(x)=\\tilde f(x)/g(x)') + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the weight ' + tex('\\tilde w(x_1)') + ' of the first draw ' + tex('x_1=' + dec(x[0])) + '.',
        answer: w[0], tolerance: tol4, lecture: 5,
        explanation: tex('\\tilde w=\\dfrac{' + dec(x[0]) + '^2e^{-' + dec(x[0]) + '}}{' + dec(r) + 'e^{-' + dec(r * x[0]) + '}}') + ' = ' + dec(w[0]) + '.',
      },
      {
        prompt: 'Find the sum of the four weights ' + tex('\\sum_i\\tilde w(x_i)') + '.',
        answer: sw, tolerance: tol4, lecture: 5,
        explanation: 'The weights are ' + w.map(dec).join(', ') + ', which add to ' + dec(sw) + '.',
      },
      {
        prompt: 'Find the self-normalised estimate ' + tex('\\sum_i\\tilde w(x_i)x_i\\big/\\sum_i\\tilde w(x_i)') + ' of ' + tex('E[X]') + '. (The unknown constant in ' + tex('\\tilde f') + ' cancels.)',
        answer: est, tolerance: tol4, lecture: 5,
        explanation: tex('(' + w.map((v, i) => dec(v) + '\\times' + dec(x[i])).join('+') + ')/' + dec(sw)) + ' = ' + dec(est) + '. The true mean of a Gamma(3,1) is ' + tex('3') + '.',
      },
      {
        prompt: 'Find the effective sample size ' + tex('(\\sum\\tilde w_i)^2/\\sum\\tilde w_i^2') + '.',
        answer: ess, tolerance: tol4, lecture: 5,
        explanation: tex('(' + dec(sw) + ')^2/' + dec(w.reduce((a, b) => a + b * b, 0))) + ' = ' + dec(ess) + ', out of ' + tex('4') + ' draws; it equals ' + tex('4') + ' only for equal weights.',
      },
      {
        prompt: 'Find the largest normalised weight ' + tex('\\max_i\\tilde w_i/\\sum_j\\tilde w_j') + '. A value near ' + tex('1') + ' means one draw dominates.',
        answer: wmax, tolerance: tol4, lecture: 5,
        explanation: 'The largest weight is ' + dec(w[imax]) + ' (at ' + tex('x=' + dec(x[imax])) + '), so ' + tex(dec(w[imax]) + '/' + dec(sw)) + ' = ' + dec(wmax) + '.',
      },
    ],
  }
}

export const genO: LQGenerator = { id: 'bay-lq-o-is', generate: (rng) => build(sample(rng)) }
