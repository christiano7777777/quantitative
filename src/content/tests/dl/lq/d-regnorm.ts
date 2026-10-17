// LQ-D: weight-decay shrinkage, inverted dropout, initialisation scales and batch normalisation.
// Lectures 4 (regularisation) and 5 (initialisation and normalisation).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { eta: number; lam: number; T: number; p: number; x: number; nin: number; nout: number; batch: number[]; v: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const batch = Array.from({ length: 4 }, () => rng.int(-6, 6))
    if (new Set(batch).size > 1) {
      return { eta: rng.pick([0.1, 0.05, 0.01]), lam: rng.pick([0.1, 0.5, 1, 2]), T: rng.int(5, 40), p: rng.pick([0.2, 0.25, 0.5]), x: rng.int(1, 5), nin: rng.pick([64, 100, 256, 400, 512]), nout: rng.pick([32, 100, 128, 256]), batch, v: batch[rng.int(0, 3)] }
    }
  }
}

export function build({ eta, lam, T, p, x, nin, nout, batch, v }: Params): LQInstance {
  const shrink = (1 - eta * lam) ** T
  const dvar = (x * x * p) / (1 - p)
  const he = Math.sqrt(2 / nin)
  const xav = 2 / (nin + nout)
  const mu = batch.reduce((s, b) => s + b, 0) / batch.length
  const va = batch.reduce((s, b) => s + (b - mu) ** 2, 0) / batch.length
  const bn = (v - mu) / Math.sqrt(va + 1e-5)

  return {
    intro: 'Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'L2 weight decay with penalty ' + tex('\\frac\\lambda2\\|w\\|^2') + ', ' + tex('\\lambda=' + dec(lam)) + ', and learning rate ' + tex('\\eta=' + dec(eta)) + ' multiplies the weight by ' + tex('(1-\\eta\\lambda)') + ' each step before the data-gradient term. If the data gradient were zero, what fraction of the weight remains after ' + tex(T) + ' steps?',
        answer: shrink, tolerance: tol4, lecture: 4,
        explanation: tex('(1-' + dec(eta) + '\\times' + dec(lam) + ')^{' + T + '}=' + dec(1 - eta * lam) + '^{' + T + '}=' + dec(shrink)) + '.',
      },
      {
        prompt: 'Inverted dropout keeps each unit with probability ' + tex('1-p') + ' (' + tex('p=' + dec(p)) + ') and divides kept values by ' + tex('1-p') + '. For a unit with fixed activation ' + tex('x=' + x) + ', find the variance of the dropped-out output ' + tex('x\\,m/(1-p)') + ' with ' + tex('m\\sim\\mathrm{Bernoulli}(1-p)') + '.',
        answer: dvar, tolerance: tol4, lecture: 4,
        explanation: 'The mean stays ' + tex(String(x)) + '; the variance is ' + tex('x^2\\dfrac{p}{1-p}=' + x * x + '\\times' + dec(p / (1 - p)) + '=' + dec(dvar)) + '.',
      },
      {
        prompt: 'He initialisation for a ReLU layer draws weights with variance ' + tex('2/n_{\\text{in}}') + '. Find the standard deviation for ' + tex('n_{\\text{in}}=' + nin) + '.',
        answer: he, tolerance: tol4, lecture: 5,
        explanation: tex('\\sqrt{2/' + nin + '}=' + dec(he)) + '.',
      },
      {
        prompt: 'Xavier (Glorot) initialisation uses variance ' + tex('2/(n_{\\text{in}}+n_{\\text{out}})') + '. Find it for ' + tex('n_{\\text{in}}=' + nin + ',\\ n_{\\text{out}}=' + nout) + ', to 5 decimal places.',
        answer: xav, tolerance: { abs: 0.000005 }, lecture: 5,
        explanation: tex('2/(' + nin + '+' + nout + ')=' + dec(xav)) + '.',
      },
      {
        prompt: 'Batch normalisation on a mini-batch ' + tex('(' + batch.join(',') + ')') + ' with ' + tex('\\varepsilon=10^{-5}') + ', no scale or shift, and the batch variance with divisor ' + tex('n') + '. Find the normalised value of the entry ' + tex(v) + '.',
        answer: bn, tolerance: tol4, lecture: 5,
        explanation: tex('\\mu=' + dec(mu) + ',\\ \\sigma^2=' + dec(va) + ',\\ (' + v + '-' + dec(mu) + ')/\\sqrt{' + dec(va) + '+10^{-5}}=' + dec(bn)) + '.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'dl-lq-d-regnorm', generate: (rng) => build(sample(rng)) }
