// LQ-C: diagonalising 2x2 matrices, matrix powers, long-run direction, a defective matrix, and when diagonalisation fails.
// Lecture 4 (with lecture 3 for eigenvalues).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { fixZero } from '../util'
import { dec, pm, tex, tol3, tolInt } from '../../../shared/format'

const sg = (x: number) => (x < 0 ? '(' + x + ')' : String(x)) // parenthesise negatives inside formulas
const sn = (x: number) => (x < 0 ? '-' + -x : '+' + x) // signed term
export interface Params {
  u: number; v: number; l1: number; l2: number; n: number
  lamB: number; s: number; t: number; m: number; nB: number
  a: number; d: number; c: number
}

export const matA = ({ u, v, l1, l2 }: Pick<Params, 'u' | 'v' | 'l1' | 'l2'>) => {
  // A = P diag(l1,l2) P^-1 with P = [[1,u],[v,uv+1]] (det 1), P^-1 = [[uv+1,-u],[-v,1]]
  const P = [[1, u], [v, u * v + 1]], Pi = [[u * v + 1, -u], [-v, 1]], D = [[l1, 0], [0, l2]]
  const mm = (X: number[][], Y: number[][]) => X.map((r) => Y[0].map((_, j) => r.reduce((s, x, k) => s + x * Y[k][j], 0)))
  return mm(mm(P, D), Pi)
}
export const matB = ({ lamB, s, t, m }: Pick<Params, 'lamB' | 's' | 't' | 'm'>) => [[lamB - m * s * t, m * s * s], [-m * t * t, lamB + m * s * t]]

export function sample(rng: Rng): Params {
  const pool = [-3, -2, -1, 1, 2, 3, 4]
  for (;;) {
    const l1 = rng.pick(pool), l2 = rng.pick(pool)
    if (Math.abs(l1) === Math.abs(l2)) continue
    const a = rng.int(-3, 3), d = a + rng.pick([-4, -2, 2, 4, 6])
    const u = rng.pick([-2, -1, 1, 2]), v = rng.pick([-2, -1, 1, 2])
    if (u * v === -1) continue // keeps the second coordinate of the second eigenvector nonzero
    return {
      u, v, l1, l2, n: rng.int(5, 7),
      lamB: rng.pick([-2, 2, 3]), s: rng.pick([1, 2]), t: rng.pick([1, 2]), m: rng.pick([-1, 1]), nB: rng.int(5, 6),
      a, d, c: rng.pick([1, 2, 4]),
    }
  }
}

function buildRaw(p: Params): LQInstance {
  const { u, v, l1, l2, n, lamB, s, t, m, nB, a, d, c } = p
  const A = matA(p), B = matB(p)
  const minEig = Math.min(l1, l2)
  const entry = u * (l2 ** n - l1 ** n)
  const dom = Math.abs(l1) > Math.abs(l2) ? [1, v] : [u, u * v + 1]
  const ratio = dom[0] / dom[1]
  const bEntry = lamB ** nB - nB * lamB ** (nB - 1) * m * s * t
  const delta = a - d
  const k = (delta * delta) / (4 * c)
  return {
    intro: 'Let ' + tex('A=' + pm(A)) + ' (it has two real eigenvalues, one larger than the other in absolute value). Give decimals to 3 places where needed.',
    parts: [
      {
        prompt: 'Find the smaller eigenvalue of ' + tex('A') + '.',
        answer: minEig, tolerance: tolInt, lecture: 3,
        explanation: tex('\\operatorname{tr}A=' + (l1 + l2) + ',\\ \\det A=' + l1 * l2) + ', so ' + tex('\\lambda^2-(' + (l1 + l2) + ')\\lambda+(' + l1 * l2 + ')=0') + ' has roots ' + tex(l1 + ',\\ ' + l2) + '.',
      },
      {
        prompt: 'Compute the ' + tex('(1,2)') + ' entry of ' + tex('A^{' + n + '}') + '.',
        answer: entry, tolerance: tolInt, lecture: 4,
        explanation: 'With ' + tex('A=PDP^{-1}') + ' and the eigenvectors ' + tex('(1,' + v + ')^{\\top}') + ' and ' + tex('(' + u + ',' + (u * v + 1) + ')^{\\top}') + ' (for ' + tex(l1) + ' and ' + tex(l2) + '), ' + tex('(A^{' + n + '})_{12}=' + sg(u) + '\\left(' + sg(l2) + '^{' + n + '}-' + sg(l1) + '^{' + n + '}\\right)=' + entry) + '.',
      },
      {
        prompt: 'Start from a vector ' + tex('x_0') + ' that has a nonzero component along the eigenvector of the larger-modulus eigenvalue, and put ' + tex('x_k=A^kx_0=(x_k^{(1)},x_k^{(2)})') + '. As ' + tex('k\\to\\infty') + ' the ratio ' + tex('x_k^{(1)}/x_k^{(2)}') + ' converges. Find the limit to 3 decimal places.',
        answer: ratio, tolerance: tol3, lecture: 4,
        explanation: 'The dominant eigenvalue is ' + tex(Math.abs(l1) > Math.abs(l2) ? l1 : l2) + ' with eigenvector ' + tex('(' + dom[0] + ',' + dom[1] + ')') + '; ' + tex('x_k') + ' aligns with it, so the ratio tends to ' + tex(dom[0] + '/' + dom[1] + '=' + dec(ratio)) + '.',
      },
      {
        prompt: 'Now let ' + tex('B=' + pm(B)) + '. Find the ' + tex('(1,1)') + ' entry of ' + tex('B^{' + nB + '}') + '. (Hint: ' + tex('B') + ' has only one eigenvalue.)',
        answer: bEntry, tolerance: tolInt, lecture: 4,
        explanation: tex('B=' + sg(lamB) + 'I+N') + ' with ' + tex('N=B' + sn(-lamB) + 'I=' + pm([[-m * s * t, m * s * s], [-m * t * t, m * s * t]])) + ' and ' + tex('N^2=0') + ', so ' + tex('B^{' + nB + '}=' + sg(lamB) + '^{' + nB + '}I+' + nB + '\\cdot' + sg(lamB) + '^{' + (nB - 1) + '}N') + ', giving ' + tex(lamB ** nB) + (-nB * lamB ** (nB - 1) * m * s * t < 0 ? ' minus ' : ' plus ') + tex(Math.abs(nB * lamB ** (nB - 1) * s * t)) + ' = ' + tex(bEntry) + '.',
      },
      {
        prompt: 'The matrix ' + tex('M=' + pm([[a, 'k'], [-c, d]])) + ' with ' + tex('k>0') + ' is not diagonalizable for exactly one value of ' + tex('k') + '. Find it to 3 decimal places.',
        answer: k, tolerance: tol3, lecture: 4,
        explanation: 'It fails when the eigenvalue is repeated, i.e. discriminant ' + tex('(\\operatorname{tr}M)^2-4\\det M=(' + a + '-' + sg(d) + ')^2-' + 4 * c + 'k=0') + ' (and ' + tex('M') + ' is not scalar). So ' + tex('k=' + delta * delta + '/' + 4 * c + '=' + dec(k)) + '.',
      },
    ],
  }
}

export const build = (prm: Params): LQInstance => fixZero(buildRaw(prm))

export const genC: LQGenerator = { id: 'la2-lq-c-diag', generate: (rng) => build(sample(rng)) }
