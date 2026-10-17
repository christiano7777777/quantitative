// LQ-G: one hand iteration of the Blahut-Arimoto algorithm for a binary-input binary-output channel.
// Lecture 9 (alternating optimisation, the update rule and the upper and lower bounds on capacity).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, pm, tex, tol3 } from '../../../shared/format'

export interface Params { a: number; b: number } // W(1|0)=a, W(0|1)=b, a != b

export function sample(rng: Rng): Params {
  const a = rng.int(1, 9) / 20
  let b = rng.int(1, 9) / 20
  if (Math.abs(a - b) < 0.1) b = a <= 0.25 ? a + 0.2 : a - 0.2
  return { a, b }
}

const lg = Math.log2

export function build({ a, b }: Params): LQInstance {
  const q1 = (a + 1 - b) / 2
  const q0 = 1 - q1
  const d0 = (1 - a) * lg((1 - a) / q0) + a * lg(a / q1)
  const d1 = b * lg(b / q0) + (1 - b) * lg((1 - b) / q1)
  const r1 = 2 ** d1 / (2 ** d0 + 2 ** d1)
  const lower = (d0 + d1) / 2
  const upper = Math.max(d0, d1)
  return {
    intro: 'A binary channel has transition matrix ' + tex('W=' + pm([[dec(1 - a), dec(a)], [dec(b), dec(1 - b)]])) + ' (row ' + tex('x') + ', column ' + tex('y') + ', so ' + tex('W(1|0)=' + dec(a) + ',\\ W(0|1)=' + dec(b)) + '). Run one iteration of the Blahut-Arimoto algorithm for the capacity from the input distribution ' + tex('r=(\\tfrac12,\\tfrac12)') + '. With ' + tex('q') + ' the output distribution of ' + tex('r') + ' and ' + tex('D_x=D(W(\\cdot|x)\\,\\|\\,q)') + ' in bits, the update is ' + tex('r_{\\text{new}}(x)\\propto r(x)\\,2^{D_x}') + ', and ' + tex('\\sum_xr(x)D_x\\le C\\le\\max_xD_x') + '. Give each answer to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the output probability ' + tex('q(1)=P(Y=1)') + '.',
        answer: q1, tolerance: tol3, lecture: 9,
        explanation: tex('q(1)=\\frac12W(1|0)+\\frac12W(1|1)=\\frac12(' + dec(a) + '+' + dec(1 - b) + ')=' + dec(q1)) + '.',
      },
      {
        prompt: 'Find ' + tex('D_0=D(W(\\cdot|0)\\|q)') + ' in bits.',
        answer: d0, tolerance: tol3, lecture: 9,
        explanation: tex('D_0=' + dec(1 - a) + '\\log_2\\frac{' + dec(1 - a) + '}{' + dec(q0) + '}+' + dec(a) + '\\log_2\\frac{' + dec(a) + '}{' + dec(q1) + '}=' + dec(d0)) + '.',
      },
      {
        prompt: 'Find ' + tex('D_1=D(W(\\cdot|1)\\|q)') + ' in bits.',
        answer: d1, tolerance: tol3, lecture: 9,
        explanation: tex('D_1=' + dec(b) + '\\log_2\\frac{' + dec(b) + '}{' + dec(q0) + '}+' + dec(1 - b) + '\\log_2\\frac{' + dec(1 - b) + '}{' + dec(q1) + '}=' + dec(d1)) + '.',
      },
      {
        prompt: 'Find the updated input probability ' + tex('r_{\\text{new}}(1)') + '.',
        answer: r1, tolerance: tol3, lecture: 9,
        explanation: tex('2^{D_0}=' + dec(2 ** d0) + ',\\ 2^{D_1}=' + dec(2 ** d1)) + ', so ' + tex('r_{\\text{new}}(1)=\\frac{2^{D_1}}{2^{D_0}+2^{D_1}}=' + dec(r1)) + '; the input with the larger divergence gains weight.',
      },
      {
        prompt: 'The capacity satisfies ' + tex('\\sum_xr(x)D_x\\le C\\le\\max_xD_x') + '. Find the width of this bracket, ' + tex('\\max_xD_x-\\sum_xr(x)D_x') + '.',
        answer: upper - lower, tolerance: tol3, lecture: 9,
        explanation: 'Lower bound ' + tex('\\tfrac12(D_0+D_1)=' + dec(lower)) + ', upper bound ' + tex('\\max(D_0,D_1)=' + dec(upper)) + ', width ' + tex(dec(upper - lower)) + '; the width is zero exactly when all used inputs have equal divergence, at the optimum.',
      },
    ],
  }
}

export const genG: LQGenerator = { id: 'it-lq-g-ba', generate: (rng) => build(sample(rng)) }
