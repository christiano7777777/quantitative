// LQ-D: the spiked covariance model: BBP threshold, bulk edge, sample eigenvalue, eigenvector alignment, sample size for detection.
// Lecture 6 (PCA in high dimensions).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params { p: number; n: number; ell: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const n = rng.pick([200, 400, 500, 1000]), p = rng.pick([100, 150, 200, 250])
    const ell = rng.pick([2, 2.5, 3, 4, 5])
    const g = p / n
    if (g <= 1 && ell > 1 + Math.sqrt(g) + 0.2) return { p, n, ell }
  }
}

export function build({ p, n, ell }: Params): LQInstance {
  const g = p / n
  const thr = 1 + Math.sqrt(g)
  const edge = (1 + Math.sqrt(g)) ** 2
  const hat = ell * (1 + g / (ell - 1))
  const cos2 = (1 - g / (ell - 1) ** 2) / (1 + g / (ell - 1))
  const need = p / (ell - 1) ** 2

  return {
    intro: 'A covariance matrix has one population eigenvalue ' + tex('\\ell=' + dec(ell)) + ' and ' + tex(p - 1) + ' eigenvalues equal to 1. It is estimated from ' + tex(n) + ' observations in dimension ' + tex('p=' + p) + ', so ' + tex('\\gamma=p/n=' + dec(p / n)) + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the BBP detection threshold ' + tex('1+\\sqrt\\gamma') + ' for the spike.',
        answer: thr, tolerance: tol4, lecture: 6,
        explanation: tex('1+\\sqrt{' + dec(g) + '}') + ' = ' + dec(thr) + '. The spike ' + tex(dec(ell)) + ' is above it, so it can be detected.',
      },
      {
        prompt: 'Find the upper edge ' + tex('(1+\\sqrt\\gamma)^2') + ' of the noise bulk of the sample eigenvalues.',
        answer: edge, tolerance: tol4, lecture: 6,
        explanation: tex('(1+\\sqrt{' + dec(g) + '})^2') + ' = ' + dec(edge) + '.',
      },
      {
        prompt: 'The top sample eigenvalue converges to ' + tex('\\ell(1+\\gamma/(\\ell-1))') + '. Find this limit.',
        answer: hat, tolerance: tol4, lecture: 6,
        explanation: tex(dec(ell) + '(1+' + dec(g) + '/' + dec(ell - 1) + ')') + ' = ' + dec(hat) + ', above ' + tex('\\ell=' + dec(ell)) + ': the sample eigenvalue overestimates the spike.',
      },
      {
        prompt: 'Find the limiting squared cosine between the top sample eigenvector and the true spike direction, ' + tex('\\dfrac{1-\\gamma/(\\ell-1)^2}{1+\\gamma/(\\ell-1)}') + '.',
        answer: cos2, tolerance: tol4, lecture: 6,
        explanation: tex('\\dfrac{1-' + dec(g) + '/' + dec((ell - 1) ** 2) + '}{1+' + dec(g) + '/' + dec(ell - 1) + '}') + ' = ' + dec(cos2) + ', below 1: the direction is only partly recovered.',
      },
      {
        prompt: 'In dimension ' + tex('p=' + p) + ', detection of this spike needs ' + tex('\\ell>1+\\sqrt{p/n}') + '. What is the smallest sample size ' + tex('n') + ' (not necessarily an integer; give ' + tex('p/(\\ell-1)^2') + ') at which the spike is exactly at the threshold? (3 decimal places)',
        answer: need, tolerance: tol3, lecture: 6,
        explanation: tex('\\ell-1=\\sqrt{p/n}\\Rightarrow n=p/(\\ell-1)^2=' + p + '/' + dec((ell - 1) ** 2)) + ' = ' + dec(need) + '. Detection needs more observations than this.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'hd-lq-d-spiked', generate: (rng) => build(sample(rng)) }
