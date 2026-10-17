// LQ-F: compressed sensing arithmetic: number of measurements, coherence, coherence bound on sparsity, l1 versus l2 solutions.
// Lecture 8 (sparse recovery).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { p: number; s: number; a1: number; a2: number; y: number; u: number[] } // u: third column direction (integers)

export function sample(rng: Rng): Params {
  for (;;) {
    const a1 = rng.int(1, 5), a2 = rng.int(1, 5)
    if (a1 === a2) continue
    return { p: rng.pick([1000, 5000, 10000]), s: rng.pick([5, 10, 20]), a1, a2, y: rng.int(2, 9), u: rng.pick([[3, 4], [5, 12], [8, 15], [1, 1]]) }
  }
}

export function build({ p, s, a1, a2, y, u }: Params): LQInstance {
  const m = Math.ceil(2 * s * Math.log(p / s))
  const un = Math.hypot(u[0], u[1])
  const cols = [[1, 0], [0, 1], [u[0] / un, u[1] / un]]
  let mu = 0
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) mu = Math.max(mu, Math.abs(cols[i][0] * cols[j][0] + cols[i][1] * cols[j][1]))
  const sMax = 0.5 * (1 + 1 / mu)
  const l1 = y / Math.max(a1, a2)
  const l2 = y / Math.hypot(a1, a2)

  return {
    intro: 'Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'A Gaussian measurement matrix recovers ' + tex('s=' + s) + '-sparse vectors in dimension ' + tex('p=' + p) + ' with about ' + tex('m=2s\\ln(p/s)') + ' measurements. Find the smallest whole ' + tex('m') + '.',
        answer: m, tolerance: tolInt, lecture: 8,
        explanation: tex('2\\cdot' + s + '\\cdot\\ln(' + p + '/' + s + ')=' + dec(2 * s * Math.log(p / s))) + ', rounded up to ' + m + ': far fewer than ' + p + '.',
      },
      {
        prompt: 'A dictionary in ' + tex('\\mathbb R^2') + ' has the three unit-norm columns ' + tex('(1,0),\\ (0,1)') + ' and ' + tex('(' + u[0] + ',' + u[1] + ')/' + dec(un)) + '. Find its mutual coherence: the largest absolute inner product between two different columns.',
        answer: mu, tolerance: tol4, lecture: 8,
        explanation: 'The inner products are 0, ' + dec(u[0] / un) + ' and ' + dec(u[1] / un) + '; the largest is ' + dec(mu) + '.',
      },
      {
        prompt: 'Basis pursuit recovers every ' + tex('s') + '-sparse vector when ' + tex('s<\\tfrac12(1+1/\\mu)') + '. Find the bound ' + tex('\\tfrac12(1+1/\\mu)') + ' for this dictionary.',
        answer: sMax, tolerance: tol4, lecture: 8,
        explanation: tex('\\tfrac12(1+1/' + dec(mu) + ')') + ' = ' + dec(sMax) + '.',
      },
      {
        prompt: 'One measurement ' + tex(a1 + 'x_1+' + a2 + 'x_2=' + y) + ' is given. Among all solutions, the minimum-' + tex('\\ell_1') + ' solution puts all the weight on the coordinate with the larger coefficient. Find its (nonzero) value.',
        answer: l1, tolerance: tol4, lecture: 8,
        explanation: 'Weight on ' + tex('x_' + (a1 > a2 ? 1 : 2)) + ': ' + tex(y + '/' + Math.max(a1, a2)) + ' = ' + dec(l1) + ' (the other coordinate is 0), with ' + tex('\\ell_1') + ' norm ' + dec(l1) + '.',
      },
      {
        prompt: 'For the same measurement, find the Euclidean norm of the minimum-' + tex('\\ell_2') + ' solution, ' + tex('y/\\sqrt{a_1^2+a_2^2}') + '. (Its coordinates are both nonzero: not sparse.)',
        answer: l2, tolerance: tol4, lecture: 8,
        explanation: tex(y + '/\\sqrt{' + (a1 * a1 + a2 * a2) + '}') + ' = ' + dec(l2) + '.',
      },
    ],
  }
}

export const genF: LQGenerator = { id: 'hd-lq-f-recovery', generate: (rng) => build(sample(rng)) }
