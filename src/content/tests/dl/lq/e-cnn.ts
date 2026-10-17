// LQ-E: convolution output sizes, parameter counts, receptive fields, multiply-accumulate counts and residual blocks.
// Lectures 6 (convolutional networks) and 7 (modern CNNs).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { tex, tolInt } from '../../../shared/format'

export interface Params { w: number; k: number; pad: number; stride: number; cin: number; cout: number; k2: number; s2: number; c: number }

export function sample(rng: Rng): Params {
  return { w: rng.pick([28, 32, 64, 224]), k: rng.pick([3, 5, 7]), pad: rng.int(0, 3), stride: rng.pick([1, 2]), cin: rng.pick([1, 3, 16, 32]), cout: rng.pick([8, 16, 32, 64]), k2: rng.pick([3, 5]), s2: rng.pick([1, 2]), c: rng.pick([16, 32, 64, 128]) }
}

export function build({ w, k, pad, stride, cin, cout, k2, s2, c }: Params): LQInstance {
  const out = Math.floor((w + 2 * pad - k) / stride) + 1
  const params = k * k * cin * cout + cout
  // receptive field of a stack: first conv (k, stride), then second conv (k2, stride s2)
  const rf = k + (k2 - 1) * stride
  const macs = out * out * k * k * cin * cout
  const block = 2 * (9 * c * c + c)

  return {
    intro: 'All answers are integers. Convolutions are square, with a bias per output channel, and an input of size ' + tex(w + '\\times' + w) + '.',
    parts: [
      {
        prompt: 'A convolution has kernel ' + tex(k + '\\times' + k) + ', padding ' + tex(pad) + ' and stride ' + tex(stride) + '. Find the output width ' + tex('\\lfloor(W+2P-K)/S\\rfloor+1') + '.',
        answer: out, tolerance: tolInt, lecture: 6,
        explanation: tex('\\lfloor(' + w + '+' + 2 * pad + '-' + k + ')/' + stride + '\\rfloor+1=' + out) + '.',
      },
      {
        prompt: 'The layer has ' + tex(cin) + ' input channels and ' + tex(cout) + ' output channels. How many learnable parameters (weights and biases) does it have?',
        answer: params, tolerance: tolInt, lecture: 6,
        explanation: tex(k + '^2\\cdot' + cin + '\\cdot' + cout + '+' + cout + '=' + params) + '. The count does not depend on the image size: weights are shared.',
      },
      {
        prompt: 'A second convolution with kernel ' + tex(k2 + '\\times' + k2) + ' and stride ' + tex(s2) + ' follows the first (which has kernel ' + tex(k) + ' and stride ' + tex(stride) + '). What is the side length of the receptive field of one second-layer unit in the input, ' + tex('k_1+(k_2-1)s_1') + '?',
        answer: rf, tolerance: tolInt, lecture: 6,
        explanation: tex(k + '+(' + k2 + '-1)\\cdot' + stride + '=' + rf) + '. Strides multiply the growth of later layers.',
      },
      {
        prompt: 'Count the multiply-accumulate operations of the first convolution, ' + tex('H_{\\text{out}}W_{\\text{out}}K^2C_{\\text{in}}C_{\\text{out}}') + '.',
        answer: macs, tolerance: tolInt, lecture: 7,
        explanation: tex(out + '^2\\cdot' + k + '^2\\cdot' + cin + '\\cdot' + cout + '=' + macs) + '.',
      },
      {
        prompt: 'A basic residual block applies two ' + tex('3\\times3') + ' convolutions with ' + tex(c) + ' channels in and out (with biases) and adds the identity skip connection. How many parameters does the block have?',
        answer: block, tolerance: tolInt, lecture: 7,
        explanation: 'Each convolution has ' + tex('9\\cdot' + c + '^2+' + c + '=' + (9 * c * c + c)) + ' parameters; the identity skip adds none, so ' + tex(String(block)) + '.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'dl-lq-e-cnn', generate: (rng) => build(sample(rng)) }
