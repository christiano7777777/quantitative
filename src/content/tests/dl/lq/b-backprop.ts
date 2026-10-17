// LQ-B: backpropagation through a two-parameter network with a sigmoid hidden unit and squared loss.
// Lecture 2.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { x: number; w1: number; w2: number; y: number }

export function sample(rng: Rng): Params {
  return { x: rng.int(5, 30) / 10, w1: rng.int(-15, 15) / 10, w2: rng.int(-20, 20) / 10, y: rng.int(-10, 10) / 10 }
}

export function build({ x, w1, w2, y }: Params): LQInstance {
  const a = w1 * x
  const h = 1 / (1 + Math.exp(-a))
  const yhat = w2 * h
  const loss = 0.5 * (yhat - y) ** 2
  const dy = yhat - y
  const g2 = dy * h
  const g1 = dy * w2 * h * (1 - h) * x

  return {
    intro: 'A network computes ' + tex('h=\\sigma(w_1x)') + ' and ' + tex('\\hat y=w_2h') + ' with loss ' + tex('L=\\tfrac12(\\hat y-y)^2') + '. Take ' + tex('x=' + dec(x) + ',\\ y=' + dec(y) + ',\\ w_1=' + dec(w1) + ',\\ w_2=' + dec(w2)) + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Forward pass: find the hidden activation ' + tex('h') + '.',
        answer: h, tolerance: tol4, lecture: 2,
        explanation: tex('\\sigma(' + dec(a) + ')=' + dec(h)) + '.',
      },
      {
        prompt: 'Find the prediction ' + tex('\\hat y') + ' and then the loss ' + tex('L') + '. Enter ' + tex('L') + '.',
        answer: loss, tolerance: tol4, lecture: 2,
        explanation: tex('\\hat y=' + dec(yhat) + ',\\ L=\\tfrac12(' + dec(dy) + ')^2=' + dec(loss)) + '.',
      },
      {
        prompt: 'Backward pass: find ' + tex('\\partial L/\\partial\\hat y') + '.',
        answer: dy, tolerance: tol4, lecture: 2,
        explanation: tex('\\hat y-y=' + dec(yhat) + '-' + dec(y) + '=' + dec(dy)) + '.',
      },
      {
        prompt: 'Find ' + tex('\\partial L/\\partial w_2') + ' by the chain rule.',
        answer: g2, tolerance: tol4, lecture: 2,
        explanation: tex('\\dfrac{\\partial L}{\\partial\\hat y}\\cdot\\dfrac{\\partial\\hat y}{\\partial w_2}=' + dec(dy) + '\\times h=' + dec(g2)) + '.',
      },
      {
        prompt: 'Find ' + tex('\\partial L/\\partial w_1') + ', using ' + tex('\\sigma\'(a)=h(1-h)') + '.',
        answer: g1, tolerance: tol4, lecture: 2,
        explanation: tex('\\dfrac{\\partial L}{\\partial \\hat y}\\,w_2\\,h(1-h)\\,x=' + dec(dy) + '\\times' + dec(w2) + '\\times' + dec(h * (1 - h)) + '\\times' + dec(x) + '=' + dec(g1)) + '.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'dl-lq-b-backprop', generate: (rng) => build(sample(rng)) }
