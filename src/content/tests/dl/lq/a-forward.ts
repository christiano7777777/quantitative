// LQ-A: a forward pass through a tiny ReLU network by hand, and parameter counting for an MLP.
// Lecture 1 (perceptrons and MLPs).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { x: number[]; w1: number[][]; b1: number[]; w2: number[]; b2: number; d: number; h: number; k: number }

export function sample(rng: Rng): Params {
  const r = (lo: number, hi: number) => rng.int(lo, hi)
  return {
    x: [r(-3, 3), r(-3, 3)], w1: [[r(-2, 2), r(-2, 2)], [r(-2, 2), r(-2, 2)]], b1: [r(-1, 1), r(-1, 1)],
    w2: [rng.pick([-2, -1, 1, 2]), rng.pick([-2, -1, 1, 2])], b2: r(-2, 2), d: r(3, 10), h: r(4, 12), k: r(2, 5),
  }
}

export function build({ x, w1, b1, w2, b2, d, h, k }: Params): LQInstance {
  const z = w1.map((row, i) => row[0] * x[0] + row[1] * x[1] + b1[i])
  const a = z.map((v) => Math.max(0, v))
  const y = w2[0] * a[0] + w2[1] * a[1] + b2
  const p = 1 / (1 + Math.exp(-y))
  const params = (d + 1) * h + (h + 1) * k
  const mat = String.raw`\begin{pmatrix}` + w1.map((r) => r.join(' & ')).join(String.raw` \\ `) + String.raw`\end{pmatrix}`

  return {
    intro: 'A network takes ' + tex('x=(' + x.join(',') + ')') + ', has a hidden layer of two ReLU units with ' + tex('W_1=' + mat) + ' (row ' + tex('i') + ' feeds unit ' + tex('i') + ') and biases ' + tex('b_1=(' + b1.join(',') + ')') + ', and outputs ' + tex('y=w_2^\\top a+b_2') + ' with ' + tex('w_2=(' + w2.join(',') + '),\\ b_2=' + b2) + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the pre-activation of hidden unit 1, ' + tex('z_1=W_{1,1}x_1+W_{1,2}x_2+b_{1,1}') + '.',
        answer: z[0], tolerance: tol4, lecture: 1,
        explanation: tex(w1[0][0] + '\\cdot' + x[0] + '+' + w1[0][1] + '\\cdot' + x[1] + '+' + b1[0] + '=' + z[0]) + '.',
      },
      {
        prompt: 'Find the activation of hidden unit 2 after the ReLU, ' + tex('a_2=\\max(0,z_2)') + '.',
        answer: a[1], tolerance: tol4, lecture: 1,
        explanation: tex('z_2=' + z[1] + '\\Rightarrow a_2=' + a[1]) + '. ReLU zeroes negative pre-activations.',
      },
      {
        prompt: 'Find the network output ' + tex('y=w_2^\\top a+b_2') + '.',
        answer: y, tolerance: tol4, lecture: 1,
        explanation: tex(w2[0] + '\\cdot' + a[0] + '+' + w2[1] + '\\cdot' + a[1] + '+' + b2 + '=' + y) + '.',
      },
      {
        prompt: 'The output is passed through a sigmoid to give a probability. Find ' + tex('\\sigma(y)=1/(1+e^{-y})') + '.',
        answer: p, tolerance: tol4, lecture: 1,
        explanation: tex('1/(1+e^{' + (-y) + '})=' + dec(p)) + '.',
      },
      {
        prompt: 'A different fully connected network has ' + tex(d) + ' inputs, one hidden layer of ' + tex(h) + ' units and ' + tex(k) + ' outputs, with a bias in every unit. How many parameters does it have? (An integer.)',
        answer: params, tolerance: tolInt, lecture: 1,
        explanation: tex('(' + d + '+1)\\cdot' + h + '+(' + h + '+1)\\cdot' + k + '=' + (d + 1) * h + '+' + (h + 1) * k + '=' + params) + '.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'dl-lq-a-forward', generate: (rng) => build(sample(rng)) }
