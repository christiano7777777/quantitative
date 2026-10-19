// bay lecture 5 (importance sampling): one story. Estimate the mean of an Exp(2) target from draws of an Exp(1) proposal: one weight,
// the mean weight, the importance sampling estimate, the self-normalised estimate, and the effective sample size.
// Lecture 5.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { x: number[] }

export function sample(rng: Rng): Params {
  return { x: rng.sample([0.1, 0.2, 0.3, 0.5, 0.7, 0.9, 1.1, 1.4, 1.8, 2.3], 5) }
}

export function build({ x }: Params): LQInstance {
  const n = x.length
  const w = x.map((v) => 2 * Math.exp(-v)) // target 2e^{-2x} over proposal e^{-x}
  const sw = w.reduce((a, b) => a + b, 0)
  const mw = sw / n
  const est = x.reduce((s, v, i) => s + w[i] * v, 0) / n
  const snis = x.reduce((s, v, i) => s + w[i] * v, 0) / sw
  const ess = (sw * sw) / w.reduce((s, v) => s + v * v, 0)

  return {
    intro: 'We want ' + tex('E_p[X]') + ' for the target density ' + tex('p(x)=2e^{-2x}') + ' (an exponential with rate ' + tex(2) + ', true mean ' + tex('0.5') + ') but can only draw from the proposal ' + tex('q(x)=e^{-x}') + '. Five draws from ' + tex('q') + ' are ' + tex(x.map(dec).join(',\\ ')) + '. The importance weights are ' + tex('w_i=p(x_i)/q(x_i)=2e^{-x_i}') + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the weight ' + tex('w_1') + ' of the first draw ' + tex('x_1=' + dec(x[0])) + '.',
        answer: w[0], tolerance: tol4, lecture: 5,
        explanation: tex('2e^{-' + dec(x[0]) + '}') + ' = ' + dec(w[0]) + '. The weights are ' + w.map(dec).join(', ') + '. Draws that are more likely under ' + tex('p') + ' than under ' + tex('q') + ' get weight above ' + tex(1) + '.',
      },
      {
        prompt: 'Find the mean weight ' + tex('\\bar w=\\frac1n\\sum w_i') + '. Since ' + tex('E_q[w]=1') + ', it should be near ' + tex(1) + '.',
        answer: mw, tolerance: tol4, lecture: 5,
        explanation: tex('(' + w.map(dec).join('+') + ')/' + n) + ' = ' + dec(mw) + '.',
      },
      {
        prompt: 'Find the importance sampling estimate ' + tex('\\frac1n\\sum w_ix_i') + ' of ' + tex('E_p[X]') + '.',
        answer: est, tolerance: tol4, lecture: 5,
        explanation: tex('\\sum w_ix_i=' + dec(x.reduce((s, v, i) => s + w[i] * v, 0))) + ', divided by ' + tex(n) + ' gives ' + dec(est) + '.',
      },
      {
        prompt: 'Find the self-normalised estimate ' + tex('\\sum w_ix_i\\big/\\sum w_i') + '. It needs ' + tex('p') + ' only up to a constant.',
        answer: snis, tolerance: tol4, lecture: 5,
        explanation: tex(dec(x.reduce((s, v, i) => s + w[i] * v, 0)) + '/' + dec(sw)) + ' = ' + dec(snis) + '.',
      },
      {
        prompt: 'Find the effective sample size ' + tex('(\\sum w_i)^2/\\sum w_i^2') + ', the number of equally weighted draws with the same variance.',
        answer: ess, tolerance: tol4, lecture: 5,
        explanation: tex('(' + dec(sw) + ')^2/' + dec(w.reduce((s, v) => s + v * v, 0))) + ' = ' + dec(ess) + ', at most ' + tex(n) + '. Very unequal weights give a small effective sample size.',
      },
    ],
  }
}

export const genLec5: LQGenerator = { id: 'bay-lq-lec5', generate: (rng) => build(sample(rng)) }
