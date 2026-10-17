// LQ-H: reading a Gaussian graphical model from a precision matrix: partial correlation, conditional variance, regression coefficients, edges.
// Lecture 10 (graphical models).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, pm, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { th: number[][] } // entries in tenths, symmetric, diagonally dominant

export function sample(rng: Rng): Params {
  const d = [rng.int(20, 40), rng.int(20, 40), rng.int(20, 40)]
  const off = (): number => rng.pick([0, 0, -3, -5, -8, 4, 6])
  const t12 = off(), t13 = off(), t23 = off()
  return { th: [[d[0], t12, t13], [t12, d[1], t23], [t13, t23, d[2]]] }
}

export function build({ th }: Params): LQInstance {
  const T = th.map((r) => r.map((v) => v / 10))
  const pc = -T[0][1] / Math.sqrt(T[0][0] * T[1][1])
  const cv = 1 / T[0][0]
  const b3 = -T[0][2] / T[0][0]
  const pc23 = -T[1][2] / Math.sqrt(T[1][1] * T[2][2])
  let edges = 0
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (th[i][j] !== 0) edges++

  return {
    intro: 'Three Gaussian variables have precision matrix ' + tex('\\Theta=\\Sigma^{-1}=' + pm(T.map((r) => r.map(dec)))) + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the partial correlation of ' + tex('X_1') + ' and ' + tex('X_2') + ' given ' + tex('X_3') + ', ' + tex('-\\Theta_{12}/\\sqrt{\\Theta_{11}\\Theta_{22}}') + '.',
        answer: pc, tolerance: tol4, lecture: 10,
        explanation: tex('-(' + dec(T[0][1]) + ')/\\sqrt{' + dec(T[0][0]) + '\\cdot' + dec(T[1][1]) + '}') + ' = ' + dec(pc) + '.',
      },
      {
        prompt: 'Find the conditional variance of ' + tex('X_1') + ' given ' + tex('X_2,X_3') + ', which is ' + tex('1/\\Theta_{11}') + '.',
        answer: cv, tolerance: tol4, lecture: 10,
        explanation: tex('1/' + dec(T[0][0])) + ' = ' + dec(cv) + '.',
      },
      {
        prompt: 'In the regression of ' + tex('X_1') + ' on ' + tex('X_2') + ' and ' + tex('X_3') + ', the coefficient of ' + tex('X_3') + ' is ' + tex('-\\Theta_{13}/\\Theta_{11}') + '. Find it.',
        answer: b3, tolerance: tol4, lecture: 10,
        explanation: tex('-(' + dec(T[0][2]) + ')/' + dec(T[0][0])) + ' = ' + dec(b3) + (th[0][2] === 0 ? ' (zero: no edge between 1 and 3).' : '.'),
      },
      {
        prompt: 'Find the partial correlation of ' + tex('X_2') + ' and ' + tex('X_3') + ' given ' + tex('X_1') + '.',
        answer: pc23, tolerance: tol4, lecture: 10,
        explanation: tex('-(' + dec(T[1][2]) + ')/\\sqrt{' + dec(T[1][1]) + '\\cdot' + dec(T[2][2]) + '}') + ' = ' + dec(pc23) + '.',
      },
      {
        prompt: 'How many edges does the Gaussian graphical model have (pairs with a nonzero off-diagonal entry of ' + tex('\\Theta') + ')?',
        answer: edges, tolerance: tolInt, lecture: 10,
        explanation: 'Nonzero off-diagonal entries: ' + edges + ' of the 3 possible pairs; the zero ones are conditionally independent given the remaining variable.',
      },
    ],
  }
}

export const genH: LQGenerator = { id: 'hd-lq-h-graphical', generate: (rng) => build(sample(rng)) }
