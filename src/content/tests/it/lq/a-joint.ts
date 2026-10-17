// LQ-A: information measures of a joint distribution given as a table of counts.
// Lectures 1 (entropy) and 2 (joint, conditional, mutual information, divergence).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, pm, tex, tol3 } from '../../../shared/format'

export interface Params { n: number; c: number[][] } // 2 x 3 table of counts summing to n

export function sample(rng: Rng): Params {
  const n = rng.pick([16, 20, 24, 32])
  const flat = Array(6).fill(1)
  for (let i = 0; i < n - 6; i++) flat[rng.int(0, 5)]++
  return { n, c: [flat.slice(0, 3), flat.slice(3, 6)] }
}

const lg = Math.log2
const H = (ps: number[]) => -ps.reduce((s, p) => s + p * lg(p), 0)

export function build({ n, c }: Params): LQInstance {
  const p = c.map((row) => row.map((x) => x / n))
  const px = p.map((row) => row[0] + row[1] + row[2])
  const py = [0, 1, 2].map((j) => p[0][j] + p[1][j])
  const hx = H(px)
  const hy = H(py)
  const hxy = H(p.flat())
  const hyGivenX = hxy - hx
  const mi = hx + hy - hxy
  const dUnif = lg(3) - hy
  const col0 = [p[0][0] / py[0], p[1][0] / py[0]]
  const hxGivenY0 = H(col0)
  return {
    intro: 'The pair ' + tex('(X,Y)') + ' has joint distribution ' + tex('P(X=i,Y=j)=\\frac{1}{' + n + '}\\,m_{ij}') + ' with the counts ' + tex('m_{ij}') + ' in the table (rows ' + tex('i=1,2') + ', columns ' + tex('j=1,2,3') + '): ' + tex(pm(c)) + '. Use logarithms to base 2 (bits) and give each answer to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the entropy ' + tex('H(X)') + ' of the row variable.',
        answer: hx, tolerance: tol3, lecture: 1,
        explanation: 'The row probabilities are ' + tex(px.map(dec).join(',\\ ')) + ', so ' + tex('H(X)=-\\sum p\\log_2 p=' + dec(hx)) + '.',
      },
      {
        prompt: 'Find the conditional entropy ' + tex('H(Y|X)') + '.',
        answer: hyGivenX, tolerance: tol3, lecture: 2,
        explanation: 'Chain rule: ' + tex('H(X,Y)-H(X)=' + dec(hxy) + '-' + dec(hx) + '=' + dec(hyGivenX)) + '.',
      },
      {
        prompt: 'Find the mutual information ' + tex('I(X;Y)') + '.',
        answer: mi, tolerance: tol3, lecture: 2,
        explanation: tex('I(X;Y)=H(X)+H(Y)-H(X,Y)=' + dec(hx) + '+' + dec(hy) + '-' + dec(hxy) + '=' + dec(mi)) + '.',
      },
      {
        prompt: 'Find the divergence ' + tex('D(P_Y\\,\\|\\,U)') + ' of the column distribution ' + tex('P_Y') + ' from the uniform distribution ' + tex('U') + ' on ' + tex('\\{1,2,3\\}') + '.',
        answer: dUnif, tolerance: tol3, lecture: 2,
        explanation: tex('D(P_Y\\|U)=\\log_2 3-H(Y)=' + dec(lg(3)) + '-' + dec(hy) + '=' + dec(dUnif)) + '.',
      },
      {
        prompt: 'Find the entropy of the row variable given that the column is 1, that is ' + tex('H(X|Y=1)') + '.',
        answer: hxGivenY0, tolerance: tol3, lecture: 2,
        explanation: tex('P(X=1|Y=1)=' + dec(col0[0]) + ',\\ P(X=2|Y=1)=' + dec(col0[1])) + ', so ' + tex('H(X|Y=1)=' + dec(hxGivenY0)) + '.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'it-lq-a-joint', generate: (rng) => build(sample(rng)) }
