// LQ-G: scaled dot-product attention for three tokens by hand, and sinusoidal positional encoding.
// Lecture 9.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { q: number[]; keys: number[][]; vals: number[]; pos: number; dmodel: number; idx: number }

export function sample(rng: Rng): Params {
  const v2 = () => [rng.int(-2, 2), rng.int(-2, 2)]
  return { q: v2(), keys: [v2(), v2(), v2()], vals: [rng.int(-3, 3), rng.int(-3, 3), rng.int(-3, 3)], pos: rng.int(1, 6), dmodel: rng.pick([8, 16]), idx: rng.int(0, 2) }
}

export function build({ q, keys, vals, pos, dmodel, idx }: Params): LQInstance {
  const s = keys.map((k) => (q[0] * k[0] + q[1] * k[1]) / Math.sqrt(2))
  const e = s.map((v) => Math.exp(v))
  const Z = e.reduce((a, b) => a + b, 0)
  const alpha = e.map((v) => v / Z)
  const out = alpha.reduce((a, v, j) => a + v * vals[j], 0)
  const pe = Math.sin(pos / 10000 ** ((2 * idx) / dmodel))
  const ks = keys.map((k) => '(' + k.join(',') + ')').join(',\\ ')

  return {
    intro: 'One query ' + tex('q=(' + q.join(',') + ')') + ' attends to three tokens with keys ' + tex(ks) + ' and scalar values ' + tex(vals.join(',\\ ')) + '. Key dimension ' + tex('d_k=2') + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the scaled score of the first key, ' + tex('s_1=q\\cdot k_1/\\sqrt{d_k}') + '.',
        answer: s[0], tolerance: tol4, lecture: 9,
        explanation: tex('(' + q[0] + '\\cdot' + keys[0][0] + '+' + q[1] + '\\cdot' + keys[0][1] + ')/\\sqrt2=' + dec(s[0])) + '.',
      },
      {
        prompt: 'Find the attention weight on the first token, ' + tex('\\alpha_1=e^{s_1}/\\sum_je^{s_j}') + '.',
        answer: alpha[0], tolerance: tol4, lecture: 9,
        explanation: 'Scores ' + tex(s.map(dec).join(',\\ ')) + '; ' + tex('\\alpha_1=' + dec(alpha[0])) + '.',
      },
      {
        prompt: 'Find the attention weight on the second token, ' + tex('\\alpha_2') + '.',
        answer: alpha[1], tolerance: tol4, lecture: 9,
        explanation: tex('\\alpha_2=' + dec(alpha[1])) + '. The three weights sum to one: ' + tex(alpha.map(dec).join('+') + '\\approx1') + '.',
      },
      {
        prompt: 'Find the attention output ' + tex('\\sum_j\\alpha_jv_j') + '.',
        answer: out, tolerance: tol4, lecture: 9,
        explanation: tex(alpha.map((a2, j) => dec(a2) + '\\times' + vals[j]).join('+') + '=' + dec(out)) + '.',
      },
      {
        prompt: 'Sinusoidal positional encoding uses ' + tex('PE(\\text{pos},2i)=\\sin(\\text{pos}/10000^{2i/d})') + '. For ' + tex('d=' + dmodel + ',\\ \\text{pos}=' + pos + ',\\ i=' + idx) + ', find the encoding of that even dimension (radians).',
        answer: pe, tolerance: tol4, lecture: 9,
        explanation: tex('\\sin(' + pos + '/10000^{' + (2 * idx) + '/' + dmodel + '})=\\sin(' + dec(pos / 10000 ** ((2 * idx) / dmodel)) + ')=' + dec(pe)) + '.',
      },
    ],
  }
}

export const genG: LQGenerator = { id: 'dl-lq-g-attention', generate: (rng) => build(sample(rng)) }
