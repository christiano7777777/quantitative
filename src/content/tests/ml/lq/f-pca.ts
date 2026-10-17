// LQ-F: PCA from a 2x2 covariance matrix: eigenvalues, explained variance, the first loading vector, and a projection score.
// Lecture 9 (dimensionality reduction).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, pm, tex, tol4 } from '../../../shared/format'

export interface Params { a: number; b: number; d: number; px: number; py: number }

export function sample(rng: Rng): Params {
  return { a: rng.int(20, 60) / 10, b: rng.int(5, 25) / 10, d: rng.int(8, 30) / 10, px: rng.int(-30, 30) / 10, py: rng.int(-30, 30) / 10 }
}

export function build({ a, b, d, px, py }: Params): LQInstance {
  const tr = a + d, det = a * d - b * b
  const disc = Math.sqrt((tr * tr) / 4 - det)
  const l1 = tr / 2 + disc, l2 = tr / 2 - disc
  const share = l1 / tr
  // eigenvector for l1: (b, l1 - a), normalised
  const v = [b, l1 - a]
  const nv = Math.hypot(v[0], v[1])
  const v1 = [v[0] / nv, v[1] / nv]
  const score = px * v1[0] + py * v1[1]

  return {
    intro: 'Centred data in two variables have sample covariance matrix ' + tex('S=' + pm([[dec(a), dec(b)], [dec(b), dec(d)]])) + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the largest eigenvalue ' + tex('\\lambda_1') + ' of ' + tex('S') + ' (the variance along the first principal component).',
        answer: l1, tolerance: tol4, lecture: 9,
        explanation: tex('\\lambda=\\tfrac{\\mathrm{tr}}2\\pm\\sqrt{\\tfrac{\\mathrm{tr}^2}4-\\det}') + ' with ' + tex('\\mathrm{tr}=' + dec(tr) + ',\\ \\det=' + dec(det)) + ' gives ' + dec(l1) + '.',
      },
      {
        prompt: 'Find the smaller eigenvalue ' + tex('\\lambda_2') + '.',
        answer: l2, tolerance: tol4, lecture: 9,
        explanation: tex(dec(tr / 2) + '-' + dec(disc)) + ' = ' + dec(l2) + '.',
      },
      {
        prompt: 'What proportion of the total variance does the first principal component explain?',
        answer: share, tolerance: tol4, lecture: 9,
        explanation: tex('\\lambda_1/(\\lambda_1+\\lambda_2)=' + dec(l1) + '/' + dec(tr)) + ' = ' + dec(share) + '.',
      },
      {
        prompt: 'The first principal axis is the unit eigenvector ' + tex('v_1\\propto(b,\\ \\lambda_1-a)') + ' (positive first coordinate). Find its first coordinate.',
        answer: v1[0], tolerance: tol4, lecture: 9,
        explanation: tex('(b,\\lambda_1-a)=(' + dec(b) + ',' + dec(l1 - a) + ')') + ' has length ' + dec(nv) + ', so the first coordinate is ' + dec(v1[0]) + '.',
      },
      {
        prompt: 'Find the score (projection) of the centred point ' + tex('(' + dec(px) + ',' + dec(py) + ')') + ' on the first principal axis, ' + tex('v_1^\\top x') + '.',
        answer: score, tolerance: tol4, lecture: 9,
        explanation: tex(dec(v1[0]) + '\\cdot' + dec(px) + '+' + dec(v1[1]) + '\\cdot' + dec(py)) + ' = ' + dec(score) + '.',
      },
    ],
  }
}

export const genF: LQGenerator = { id: 'ml-lq-f-pca', generate: (rng) => build(sample(rng)) }
