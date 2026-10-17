// LQ-C: entropy, Kraft sums, Huffman and Shannon codes for a six-symbol source.
// Lectures 1 (entropy of a simple source) and 4 (Kraft inequality, Huffman codes, optimal expected length).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params { n: number; w: number[]; lens: number[] } // symbol weights (probability w/n) and a length list for the Kraft part

export function sample(rng: Rng): Params {
  const n = rng.pick([20, 24, 30, 32])
  const w = Array(6).fill(1)
  for (let i = 0; i < n - 6; i++) w[rng.int(0, 5)]++
  w.sort((a, b) => b - a)
  const lens = Array.from({ length: 6 }, () => rng.int(1, 4)).sort((a, b) => a - b)
  return { n, w, lens }
}

/** Expected length of a Huffman code: the sum of the weights of all merged nodes, divided by n. */
export function huffmanLength(w: number[], n: number): number {
  const q = [...w].sort((a, b) => a - b)
  let total = 0
  while (q.length > 1) {
    const a = q.shift()!
    const b = q.shift()!
    total += a + b
    q.push(a + b)
    q.sort((x, y) => x - y)
  }
  return total / n
}

export function build({ n, w, lens }: Params): LQInstance {
  const p = w.map((x) => x / n)
  const H = -p.reduce((s, x) => s + x * Math.log2(x), 0)
  const kraft = lens.reduce((s, l) => s + 2 ** -l, 0)
  const L = huffmanLength(w, n)
  const red = L - H
  const shannonLens = p.map((x) => Math.ceil(-Math.log2(x)))
  const Ls = p.reduce((s, x, i) => s + x * shannonLens[i], 0)
  return {
    intro: 'A source emits six symbols with probabilities ' + tex(w.map((x) => '\\frac{' + x + '}{' + n + '}').join(',\\ ')) + '. Use logarithms to base 2 and binary codes, and give each answer to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the entropy ' + tex('H(X)') + ' in bits.',
        answer: H, tolerance: tol3, lecture: 1,
        explanation: tex('H=-\\sum p_i\\log_2 p_i=' + dec(H)) + '.',
      },
      {
        prompt: 'A code has codeword lengths ' + tex('(' + lens.join(',') + ')') + '. Find the Kraft sum ' + tex('\\sum_i 2^{-l_i}') + '. (A prefix code with these lengths exists iff it is at most 1.)',
        answer: kraft, tolerance: tol3, lecture: 4,
        explanation: tex(lens.map((l) => '2^{-' + l + '}').join('+') + '=' + dec(kraft)) + (kraft <= 1 ? ', at most 1, so a prefix code exists.' : ', above 1, so no prefix code has these lengths.'),
      },
      {
        prompt: 'Build a binary Huffman code for the source and find its expected codeword length ' + tex('L') + ' in bits per symbol.',
        answer: L, tolerance: tol3, lecture: 4,
        explanation: 'Merge the two smallest weights repeatedly (weights out of ' + tex(String(n)) + '); the expected length is the sum of the merged weights divided by ' + tex(String(n)) + ': ' + tex('L=' + dec(L)) + '.',
      },
      {
        prompt: 'Find the redundancy ' + tex('L-H(X)') + ' of the Huffman code.',
        answer: red, tolerance: tol3, lecture: 4,
        explanation: tex('L-H=' + dec(L) + '-' + dec(H) + '=' + dec(red)) + ', which lies in ' + tex('[0,1)') + '.',
      },
      {
        prompt: 'The Shannon code uses lengths ' + tex('l_i=\\lceil-\\log_2 p_i\\rceil') + '. Find its expected length.',
        answer: Ls, tolerance: tol3, lecture: 4,
        explanation: 'The lengths are ' + tex('(' + shannonLens.join(',') + ')') + ', so ' + tex('\\sum p_il_i=' + dec(Ls)) + ', never below the Huffman length ' + tex(dec(L)) + '.',
      },
    ],
  }
}

export const genC: LQGenerator = { id: 'it-lq-c-huffman', generate: (rng) => build(sample(rng)) }
