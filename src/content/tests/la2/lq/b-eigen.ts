// LQ-B: a 3x3 integer matrix with three distinct integer eigenvalues (A = P D P^-1, det P = +-1).
// Lecture 3: determinant, characteristic polynomial, eigenvalues, eigenvectors, trace identities.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { fixZero } from '../util'
import { dec, pm, tex, tol3, tolInt } from '../../../shared/format'

export interface Params { P: number[][]; lam: number[] }

const sg = (x: number) => (x < 0 ? '(' + x + ')' : String(x)) // parenthesise negatives inside formulas
const sn = (x: number) => (x < 0 ? '-' + -x : '+' + x) // signed term
const mul = (X: number[][], Y: number[][]) => X.map((r) => Y[0].map((_, j) => r.reduce((s, v, k) => s + v * Y[k][j], 0)))
const det3 = (M: number[][]) =>
  M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0])
/** inverse of an integer matrix with determinant +-1 (adjugate / det) */
function inv3(M: number[][]): number[][] {
  const d = det3(M)
  const cof = (i: number, j: number) => {
    const r = [0, 1, 2].filter((x) => x !== i), c = [0, 1, 2].filter((x) => x !== j)
    return ((i + j) % 2 === 0 ? 1 : -1) * (M[r[0]][c[0]] * M[r[1]][c[1]] - M[r[0]][c[1]] * M[r[1]][c[0]])
  }
  return [0, 1, 2].map((i) => [0, 1, 2].map((j) => cof(j, i) / d))
}
export const matrixOf = ({ P, lam }: Params) => mul(mul(P, lam.map((l, i) => [0, 1, 2].map((j) => (i === j ? l : 0)))), inv3(P))

export function sample(rng: Rng): Params {
  for (;;) {
    let P = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
    for (let step = 0; step < 4; step++) {
      const i = rng.int(0, 2), j = (i + rng.int(1, 2)) % 3, k = rng.pick([-1, 1])
      P = P.map((r, t) => (t === i ? r.map((v, c) => v + k * P[j][c]) : r))
    }
    const lam = rng.sample([-3, -2, -1, 0, 1, 2, 3, 4], 3)
    const med = [...lam].sort((x, y) => x - y)[1]
    const m = lam.indexOf(med)
    const A = matrixOf({ P, lam })
    if (P[0][m] === 0) continue
    if (A.some((r) => r.some((v) => Math.abs(v) > 9))) continue
    return { P, lam }
  }
}

function buildRaw(prm: Params): LQInstance {
  const { P, lam } = prm
  const A = matrixOf(prm)
  const [l1, l2, l3] = lam
  const det = l1 * l2 * l3 + 0 // + 0 turns -0 into 0
  const e2 = l1 * l2 + l1 * l3 + l2 * l3
  const big = Math.max(...lam)
  const med = [...lam].sort((x, y) => x - y)[1]
  const m = lam.indexOf(med)
  const third = P[2][m] / P[0][m]
  const trSq = l1 * l1 + l2 * l2 + l3 * l3
  return {
    intro: 'Let ' + tex('A=' + pm(A)) + '. All three eigenvalues of ' + tex('A') + ' are distinct integers. Give decimals to 3 places where needed.',
    parts: [
      {
        prompt: 'Compute ' + tex('\\det A') + '.',
        answer: det, tolerance: tolInt, lecture: 3,
        explanation: 'Expanding along a row gives ' + tex('\\det A=' + det) + '; equivalently the product of the eigenvalues ' + tex(lam.slice().sort((x, y) => x - y).join('\\cdot')) + '.',
      },
      {
        prompt: 'Write the characteristic polynomial as ' + tex('\\det(\\lambda I-A)=\\lambda^3-t\\lambda^2+e\\lambda-d') + '. Find ' + tex('e') + ' (the sum of the three principal ' + tex('2\\times2') + ' minors of ' + tex('A') + ').',
        answer: e2, tolerance: tolInt, lecture: 3,
        explanation: 'The three principal minors add to ' + tex(e2) + ', which equals ' + tex('\\lambda_1\\lambda_2+\\lambda_1\\lambda_3+\\lambda_2\\lambda_3') + '.',
      },
      {
        prompt: 'Find the largest eigenvalue of ' + tex('A') + '.',
        answer: big, tolerance: tolInt, lecture: 3,
        explanation: 'Solving ' + tex('\\lambda^3-t\\lambda^2+e\\lambda-d=0') + ' with ' + tex('t=\\operatorname{tr}A=' + (l1 + l2 + l3) + ',\\ e=' + e2 + ',\\ d=' + det) + ' (the roots are integers: try the divisors of ' + tex('d') + ', or small integers when ' + tex('d=0') + ') gives eigenvalues ' + tex(lam.slice().sort((x, y) => x - y).join(',')) + '.',
      },
      {
        prompt: 'The middle eigenvalue (the one between the smallest and the largest) has an eigenvector with first coordinate ' + tex('1') + ': ' + tex('(1,y,z)^{\\top}') + '. Find ' + tex('z') + ' to 3 decimal places.',
        answer: third, tolerance: tol3, lecture: 3,
        explanation: 'Solve ' + tex('(A' + sn(-med) + 'I)v=0') + ' with ' + tex('v_1=1') + '. The eigenvector is proportional to ' + tex('(' + P[0][m] + ',' + P[1][m] + ',' + P[2][m] + ')') + ', so ' + tex('z=' + sg(P[2][m]) + '/' + sg(P[0][m]) + '=' + dec(third)) + '.',
      },
      {
        prompt: 'Find ' + tex('\\operatorname{tr}(A^2)') + '.',
        answer: trSq, tolerance: tolInt, lecture: 3,
        explanation: tex('\\operatorname{tr}(A^2)=\\sum_i\\lambda_i^2=' + lam.map((l) => l * l).join('+') + '=' + trSq) + ', which also equals ' + tex('\\sum_{i,j}a_{ij}a_{ji}') + '.',
      },
    ],
  }
}

export const build = (prm: Params): LQInstance => fixZero(buildRaw(prm))

export const genB: LQGenerator = { id: 'la2-lq-b-eigen', generate: (rng) => build(sample(rng)) }
