// LQ-G: a symmetric 2x2 matrix A = l2 I + k v v^T (v = (p,q)): eigenvalues, unit eigenvector, spectral power, extreme values of the form, completing the square.
// Lectures 8 (spectral theorem, orthogonal diagonalisation) and 9 (quadratic forms, definiteness).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { fixZero } from '../util'
import { dec, pm, tex, tol3, tolInt } from '../../../shared/format'

const sg = (x: number) => (x < 0 ? '(' + x + ')' : String(x)) // parenthesise negatives inside formulas
const sn = (x: number) => (x < 0 ? '-' + -x : '+' + x) // signed term
export interface Params { p: number; q: number; k: number; l2: number; n: number; r: number }

export const matrix = ({ p, q, k, l2 }: Params) => [[l2 + k * p * p, k * p * q], [k * p * q, l2 + k * q * q]]

export function sample(rng: Rng): Params {
  for (;;) {
    const prm = { p: rng.int(1, 3), q: rng.int(1, 3), k: rng.pick([1, 2]), l2: rng.int(-5, -1), n: rng.pick([3, 4]), r: rng.pick([2, 3, 5]) }
    const A = matrix(prm)
    if (A[0][0] === 0 || prm.l2 + prm.k * (prm.p * prm.p + prm.q * prm.q) > 9) continue // the completing-the-square step divides by a_11
    return prm
  }
}

function buildRaw(prm: Params): LQInstance {
  const { p, q, k, l2, n, r } = prm
  const A = matrix(prm)
  const s = p * p + q * q
  const l1 = l2 + k * s
  const unit = p / Math.sqrt(s)
  // (A^n)_{12} = (l1^n - l2^n) / (l1 - l2) * k p q
  const powEntry = ((l1 ** n - l2 ** n) / (l1 - l2)) * k * p * q
  const minQ = l2 * r
  const detA = A[0][0] * A[1][1] - A[0][1] * A[0][1]
  const schur = detA / A[0][0]
  return {
    intro: 'Let ' + tex('A=' + pm(A)) + ', which is symmetric, and let ' + tex('Q(x)=x^{\\top}Ax') + '. Its eigenvalues are two different integers. Give decimals to 3 places where needed.',
    parts: [
      {
        prompt: 'Find the larger eigenvalue of ' + tex('A') + '.',
        answer: l1, tolerance: tolInt, lecture: 8,
        explanation: tex('\\operatorname{tr}A=' + (A[0][0] + A[1][1]) + ',\\ \\det A=' + detA) + ' so ' + tex('\\lambda^2' + sn(-(A[0][0] + A[1][1])) + '\\lambda' + sn(detA) + '=0') + ' with roots ' + tex(l1 + ',\\ ' + l2) + '.',
      },
      {
        prompt: 'The eigenvectors of a symmetric matrix for different eigenvalues are orthogonal, so ' + tex('A=Q\\Lambda Q^{\\top}') + ' with ' + tex('Q') + ' orthogonal. Find the first coordinate of the unit eigenvector for the larger eigenvalue, chosen with both coordinates positive.',
        answer: unit, tolerance: tol3, lecture: 8,
        explanation: tex('(A' + sn(-l1) + 'I)v=0') + ' gives ' + tex('v\\propto(' + p + ',' + q + ')') + '; normalising, ' + tex(p + '/\\sqrt{' + s + '}=' + dec(unit)) + '.',
      },
      {
        prompt: 'Use the spectral decomposition to find the ' + tex('(1,2)') + ' entry of ' + tex('A^{' + n + '}') + '.',
        answer: powEntry, tolerance: tolInt, lecture: 8,
        explanation: tex('A^{' + n + '}=\\lambda_1^{' + n + '}u_1u_1^{\\top}+\\lambda_2^{' + n + '}u_2u_2^{\\top}') + ' with ' + tex('u_1u_1^{\\top}=\\frac1{' + s + '}' + pm([[p * p, p * q], [p * q, q * q]])) + ' and ' + tex('u_2u_2^{\\top}=I-u_1u_1^{\\top}') + '. The off-diagonal entry is ' + tex('(' + sg(l1) + '^{' + n + '}-' + sg(l2) + '^{' + n + '})\\cdot' + p * q + '/' + s + '=' + powEntry) + '.',
      },
      {
        prompt: 'What is the minimum of ' + tex('Q(x)') + ' over all vectors with ' + tex('\\|x\\|^2=' + r) + '?',
        answer: minQ, tolerance: tolInt, lecture: 9,
        explanation: 'On ' + tex('\\|x\\|^2=' + r) + ', ' + tex('Q(x)=\\lambda_1y_1^2+\\lambda_2y_2^2') + ' in eigen-coordinates with ' + tex('y_1^2+y_2^2=' + r) + '; the minimum puts everything on the smaller eigenvalue: ' + tex(l2 + '\\cdot' + r + '=' + minQ) + '.',
      },
      {
        prompt: 'Complete the square: ' + tex('Q(x)=a_{11}\\,(x_1+\\gamma x_2)^2+\\delta\\,x_2^2') + '. Find ' + tex('\\delta') + ' to 3 decimal places.',
        answer: schur, tolerance: tol3, lecture: 9,
        explanation: tex('\\gamma=a_{12}/a_{11}=' + A[0][1] + '/' + A[0][0]) + ' and ' + tex('\\delta=a_{22}-a_{12}^2/a_{11}=\\det A/a_{11}=' + detA + '/' + A[0][0] + '=' + dec(schur)) + '.',
      },
    ],
  }
}

export const build = (prm: Params): LQInstance => fixZero(buildRaw(prm))

export const genG: LQGenerator = { id: 'la2-lq-g-spectral', generate: (rng) => build(sample(rng)) }
