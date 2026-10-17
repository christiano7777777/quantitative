// LQ-F: a scalar linear recurrent network unrolled by hand: hidden state, gradients through time, vanishing gradients, and LSTM/GRU state updates.
// Lecture 8.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { w: number; x: number[]; wv: number; f: number; i: number; g: number; c0: number; z: number; hprev: number; ht: number }

export function sample(rng: Rng): Params {
  return {
    w: rng.int(3, 9) / 10, x: [rng.int(-3, 3), rng.int(-3, 3), rng.int(-3, 3)], wv: rng.int(2, 8) / 10, f: rng.int(5, 95) / 100, i: rng.int(5, 95) / 100,
    g: rng.int(-9, 9) / 10, c0: rng.int(-20, 20) / 10, z: rng.int(5, 95) / 100, hprev: rng.int(-20, 20) / 10, ht: rng.int(-20, 20) / 10,
  }
}

export function build({ w, x, wv, f, i, g, c0, z, hprev, ht }: Params): LQInstance {
  const h: number[] = [0]
  for (let t = 0; t < 3; t++) h.push(w * h[t] + x[t])
  // dh_t/dw = h_{t-1} + w * dh_{t-1}/dw
  let d = 0
  for (let t = 1; t <= 3; t++) d = h[t - 1] + w * d
  const jac = w ** 3
  const steps = Math.ceil(Math.log(0.01) / Math.log(wv))
  const cell = f * c0 + i * g
  const gru = (1 - z) * hprev + z * ht

  return {
    intro: 'A scalar linear RNN has ' + tex('h_t=wh_{t-1}+x_t') + ' with ' + tex('h_0=0') + ', ' + tex('w=' + dec(w)) + ' and inputs ' + tex('x_1=' + x[0] + ',\\ x_2=' + x[1] + ',\\ x_3=' + x[2]) + '. Give answers to 4 decimal places except the integer.',
    parts: [
      {
        prompt: 'Unroll the recurrence and find ' + tex('h_3') + '.',
        answer: h[3], tolerance: tol4, lecture: 8,
        explanation: tex('h_1=' + dec(h[1]) + ',\\ h_2=' + dec(h[2]) + ',\\ h_3=' + dec(h[3])) + '.',
      },
      {
        prompt: 'Find the gradient of the final state with respect to the weight, ' + tex('\\partial h_3/\\partial w') + ', using ' + tex('\\partial h_t/\\partial w=h_{t-1}+w\\,\\partial h_{t-1}/\\partial w') + '.',
        answer: d, tolerance: tol4, lecture: 8,
        explanation: tex('\\partial h_3/\\partial w=h_2+w(h_1+w\\cdot h_0)=' + dec(h[2]) + '+' + dec(w) + '\\times' + dec(h[1]) + '=' + dec(d)) + '.',
      },
      {
        prompt: 'How strongly does the first state influence the third? Find ' + tex('\\partial h_3/\\partial h_0=w^3') + '.',
        answer: jac, tolerance: tol4, lecture: 8,
        explanation: tex(dec(w) + '^3=' + dec(jac)) + '. Repeated multiplication by ' + tex('|w|<1') + ' shrinks the signal: the vanishing gradient.',
      },
      {
        prompt: 'With recurrent weight ' + tex('w=' + dec(wv)) + ', what is the smallest number of steps ' + tex('T') + ' such that ' + tex('w^T<0.01') + '? (An integer.)',
        answer: steps, tolerance: tolInt, lecture: 8,
        explanation: tex('T>\\ln(0.01)/\\ln(' + dec(wv) + ')=' + dec(Math.log(0.01) / Math.log(wv))) + ', so ' + tex('T=' + steps) + '.',
      },
      {
        prompt: 'An LSTM cell updates ' + tex('c_t=f_t\\,c_{t-1}+i_t\\,g_t') + '. With forget gate ' + tex('f=' + dec(f)) + ', input gate ' + tex('i=' + dec(i)) + ', candidate ' + tex('g=' + dec(g)) + ' and ' + tex('c_{t-1}=' + dec(c0)) + ', find ' + tex('c_t') + '. (The additive path is what lets gradients survive.)',
        answer: cell, tolerance: tol4, lecture: 8,
        explanation: tex(dec(f) + '\\times' + dec(c0) + '+' + dec(i) + '\\times' + dec(g) + '=' + dec(cell)) + '.',
      },
    ],
  }
}

export const genF: LQGenerator = { id: 'dl-lq-f-rnn', generate: (rng) => build(sample(rng)) }
