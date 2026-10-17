// LQ-F: adjoints with respect to a non-standard inner product <x,y> = x^T G y, self-adjointness, and normality of a complex matrix.
// Lectures 5 (inner product) and 7 (adjoint, self-adjoint, normal operators).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { fixZero } from '../util'
import { dec, pm, tex, tol3, tolInt } from '../../../shared/format'

const sg = (x: number) => (x < 0 ? '(' + x + ')' : String(x)) // parenthesise negatives inside formulas
const sn = (x: number) => (x < 0 ? '-' + -x : '+' + x) // signed term
export interface Params {
  G: number[][]; x: number[]; y: number[]; A: number[][]
  S: number[] // the matrix S = [[S0, S1], [c, S2]] with unknown c
  a: number; b1: number; b2: number; c1: number; t: number
}

/** (b1, b2, c1, t) with b1^2 + b2^2 = c1^2 + t^2 and t > 0, so that |b| = |c1 + t i| */
const triples: [number, number, number, number][] = []
for (let b1 = 0; b1 <= 6; b1++) for (let b2 = 1; b2 <= 6; b2++) for (let c1 = 0; c1 <= 6; c1++) for (let t = 1; t <= 7; t++)
  if (b1 * b1 + b2 * b2 === c1 * c1 + t * t && !(b1 === c1 && b2 === t)) triples.push([b1, b2, c1, t])

export function sample(rng: Rng): Params {
  const g12 = rng.pick([-1, 1]), g11 = rng.pick([2, 3, 4]), g22 = rng.pick([2, 3])
  const r = () => rng.int(-3, 3)
  const [b1, b2, c1, t] = rng.pick(triples)
  return {
    G: [[g11, g12], [g12, g22]], x: [r(), r()], y: [r(), r()], A: [[r(), r()], [r(), r()]],
    S: [r(), r(), r()], a: rng.int(-3, 3), b1: rng.pick([-1, 1]) * b1, b2: rng.pick([-1, 1]) * b2, c1: rng.pick([-1, 1]) * c1, t,
  }
}

const cx = (re: number, im: number) => (im === 0 ? String(re) : (re === 0 ? '' : re) + (im < 0 ? '-' : re === 0 ? '' : '+') + (Math.abs(im) === 1 ? '' : Math.abs(im)) + 'i')

function buildRaw({ G, x, y, A, S, a, b1, b2, c1, t }: Params): LQInstance {
  const gy = [G[0][0] * y[0] + G[0][1] * y[1], G[1][0] * y[0] + G[1][1] * y[1]]
  const ipv = x[0] * gy[0] + x[1] * gy[1]
  // T* = G^{-1} A^T G
  const dG = G[0][0] * G[1][1] - G[0][1] * G[1][0]
  const Gi = [[G[1][1] / dG, -G[0][1] / dG], [-G[1][0] / dG, G[0][0] / dG]]
  const AtG = [0, 1].map((i) => [0, 1].map((j) => A[0][i] * G[0][j] + A[1][i] * G[1][j]))
  const Ts = Gi.map((r) => [0, 1].map((j) => r[0] * AtG[0][j] + r[1] * AtG[1][j]))
  // S = [[S0, S1], [c, S2]] is G-self-adjoint iff G S is symmetric
  const cStar = (G[0][0] * S[1] + G[0][1] * S[2] - G[0][1] * S[0]) / G[1][1]
  const modB2 = b1 * b1 + b2 * b2
  const tr = 2 * a * a + 2 * modB2
  const Gs = pm(G)
  return {
    intro: 'On ' + tex('\\mathbb{R}^2') + ' use the inner product ' + tex('\\langle u,w\\rangle=u^{\\top}Gw') + ' with ' + tex('G=' + Gs) + '. For an operator ' + tex('T(x)=Ax') + ', its adjoint ' + tex('T^*') + ' is defined by ' + tex('\\langle Tu,w\\rangle=\\langle u,T^*w\\rangle') + '. Give decimals to 3 places.',
    parts: [
      {
        prompt: 'Compute ' + tex('\\langle x,y\\rangle') + ' for ' + tex('x=(' + x.join(',') + ')^{\\top}') + ' and ' + tex('y=(' + y.join(',') + ')^{\\top}') + '.',
        answer: ipv, tolerance: tolInt, lecture: 5,
        explanation: tex('Gy=(' + gy.join(',') + ')^{\\top}') + ', then ' + tex('x^{\\top}Gy=' + sg(x[0]) + '\\cdot' + sg(gy[0]) + '+' + sg(x[1]) + '\\cdot' + sg(gy[1]) + '=' + ipv) + '.',
      },
      {
        prompt: 'Let ' + tex('A=' + pm(A)) + '. The matrix of ' + tex('T^*') + ' in the standard basis is ' + tex('G^{-1}A^{\\top}G') + '. Find its ' + tex('(1,2)') + ' entry to 3 decimal places.',
        answer: Ts[0][1], tolerance: tol3, lecture: 7,
        explanation: tex('\\langle Tu,w\\rangle=u^{\\top}A^{\\top}Gw') + ' must equal ' + tex('u^{\\top}G(T^*w)') + ' for all ' + tex('u,w') + ', so ' + tex('T^*=G^{-1}A^{\\top}G') + '. Here ' + tex('A^{\\top}G=' + pm(AtG)) + ' and ' + tex('T^*=' + pm(Ts.map((r) => r.map((v) => dec(v))))) + '.',
      },
      {
        prompt: 'Let ' + tex('S=' + pm([[S[0], S[1]], ['c', S[2]]])) + '. For exactly one value of ' + tex('c') + ' the operator ' + tex('S') + ' is self-adjoint for this inner product. Find ' + tex('c') + ' to 3 decimal places.',
        answer: cStar, tolerance: tol3, lecture: 7,
        explanation: tex('S=S^*') + ' means ' + tex('GS') + ' is symmetric. The off-diagonal entries are ' + tex('(GS)_{12}=' + sg(G[0][0]) + '\\cdot' + sg(S[1]) + '+' + sg(G[0][1]) + '\\cdot' + sg(S[2])) + ' and ' + tex('(GS)_{21}=' + sg(G[1][0]) + '\\cdot' + sg(S[0]) + '+' + sg(G[1][1]) + 'c') + '; equating gives ' + tex('c=' + dec(cStar)) + '.',
      },
      {
        prompt: 'Now work over ' + tex('\\mathbb{C}') + ' with the standard inner product. Let ' + tex('N=' + pm([[a, cx(b1, b2)], [(c1 === 0 ? '' : c1 + '+') + 'ti', a]])) + ' where ' + tex('t>0') + ' is real. ' + tex('N') + ' is normal (' + tex('NN^*=N^*N') + ') for exactly one value of ' + tex('t') + '. Find it.',
        answer: t, tolerance: tolInt, lecture: 7,
        explanation: 'With equal diagonal entries, ' + tex('NN^*-N^*N=\\operatorname{diag}(|b|^2-|c|^2,\\ |c|^2-|b|^2)') + ', so normality needs ' + tex('|b|=|c|') + ': ' + tex(sg(b1) + '^2+' + sg(b2) + '^2=' + modB2 + '=' + sg(c1) + '^2+t^2') + ', hence ' + tex('t=' + t) + '.',
      },
      {
        prompt: 'For the normal matrix ' + tex('N') + ' of the previous part (with that ' + tex('t') + '), find ' + tex('\\operatorname{tr}(N^*N)=\\sum_{i,j}|n_{ij}|^2') + '. (For a normal matrix this equals ' + tex('\\sum|\\lambda_i|^2') + '.)',
        answer: tr, tolerance: tolInt, lecture: 7,
        explanation: 'The entries have squared moduli ' + tex(a * a + ',\\ ' + modB2 + ',\\ ' + (c1 * c1 + t * t) + ',\\ ' + a * a) + ', which add to ' + tex(tr) + '.',
      },
    ],
  }
}

export const build = (prm: Params): LQInstance => fixZero(buildRaw(prm))

export const genF: LQGenerator = { id: 'la2-lq-f-adjoint', generate: (rng) => build(sample(rng)) }
