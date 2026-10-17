// LQ-A: train and test error of a fitted line, gradient descent read from a short loop, and the logistic loss and its gradient.
// Lectures 1 (train/test error) and 2 (linear and logistic models, gradient steps).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params { xs: number[]; ys: number[]; xt: number[]; yt: number[]; eta: number; steps: number; w0: number; lx: number[]; ly: number[] }

export function sample(rng: Rng): Params {
  for (;;) {
    const xs = [1, 2, 3, 4, 5, 6]
    const ys = xs.map((v) => rng.int(1, 4) + v + rng.int(-3, 3))
    const xt = [rng.int(1, 3), rng.int(4, 6), rng.int(2, 5)]
    if (new Set(ys).size >= 4) return { xs, ys, xt, yt: xt.map((v) => v + rng.int(0, 6)), eta: rng.pick([0.02, 0.05, 0.1]), steps: rng.pick([2, 3]), w0: rng.int(-10, 10) / 10, lx: [rng.int(-20, 20) / 10, rng.int(-20, 20) / 10, rng.int(-20, 20) / 10], ly: [1, 0, 1] }
  }
}

export function fitLine(x: number[], y: number[]) {
  const n = x.length, mx = x.reduce((a, v) => a + v, 0) / n, my = y.reduce((a, v) => a + v, 0) / n
  const b = x.reduce((a, v, i) => a + (v - mx) * (y[i] - my), 0) / x.reduce((a, v) => a + (v - mx) ** 2, 0)
  return { a: my - b * mx, b }
}

export function build({ xs, ys, xt, yt, eta, steps, w0, lx, ly }: Params): LQInstance {
  const { a, b } = fitLine(xs, ys)
  const mse = (x: number[], y: number[]) => x.reduce((s, v, i) => s + (y[i] - a - b * v) ** 2, 0) / x.length
  const train = mse(xs, ys), test = mse(xt, yt)
  let w = 0
  for (let t = 0; t < steps; t++) w -= eta * ((2 / xs.length) * xs.reduce((s, v, i) => s + v * (w * v - ys[i]), 0))
  const sig = (z: number) => 1 / (1 + Math.exp(-z))
  const grad = lx.reduce((s, v, i) => s + v * (sig(w0 * v) - ly[i]), 0) / lx.length
  const loss = -lx.reduce((s, v, i) => s + ly[i] * Math.log(sig(w0 * v)) + (1 - ly[i]) * Math.log(1 - sig(w0 * v)), 0) / lx.length
  const code = ' Procedure: start with w = 0; repeat ' + steps + ' times: g = 2 * (average over the six pairs of x * (w * x - y)), then w = w - ' + dec(eta) + ' * g.'

  return {
    intro:
      'Training data ' + tex('(x,y)') + ': ' + tex(xs.map((v, i) => '(' + v + ',' + ys[i] + ')').join(',')) + '. A straight line ' + tex('\\hat y=a+bx') + ' is fitted by least squares. Test data: ' + tex(xt.map((v, i) => '(' + v + ',' + yt[i] + ')').join(',')) + '. Give answers to 3 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the training mean squared error of the fitted line.',
        answer: train, tolerance: tol3, lecture: 1,
        explanation: 'The fit is ' + tex('\\hat y=' + dec(a) + '+' + dec(b) + 'x') + '; the mean of the six squared residuals is ' + dec(train) + '.',
      },
      {
        prompt: 'Find the test mean squared error of the same line on the test data. (It is usually larger than the training error.)',
        answer: test, tolerance: tol3, lecture: 1,
        explanation: 'Squared residuals on the three test points average ' + dec(test) + '.',
      },
      {
        prompt: 'Gradient descent for the model ' + tex('\\hat y=wx') + ' with squared loss is run on the training data by the procedure below on the six training pairs above. What is the value of ' + tex('w') + ' at the end? (4 decimal places)' + code,
        answer: w, tolerance: tol4, lecture: 2,
        explanation: 'Each step moves ' + tex('w') + ' by ' + tex('-' + dec(eta) + '\\cdot\\frac2n\\sum x_i(wx_i-y_i)') + '; after ' + steps + ' steps ' + tex('w=' + dec(w)) + '.',
      },
      {
        prompt: 'A logistic model ' + tex('p=1/(1+e^{-wx})') + ' with ' + tex('w=' + dec(w0)) + ' is evaluated on three points with ' + tex('x=' + lx.map(dec).join(',')) + ' and labels ' + tex('y=1,0,1') + '. Find the gradient of the average logistic loss, ' + tex('\\frac1n\\sum x_i(p_i-y_i)') + '. (4 decimal places)',
        answer: grad, tolerance: tol4, lecture: 2,
        explanation: 'Predicted probabilities ' + tex(lx.map((v) => dec(sig(w0 * v))).join(',')) + '; the average of ' + tex('x_i(p_i-y_i)') + ' is ' + dec(grad) + '.',
      },
      {
        prompt: 'Find the average logistic loss ' + tex('-\\frac1n\\sum\\{y_i\\ln p_i+(1-y_i)\\ln(1-p_i)\\}') + ' for the same model and data. (4 decimal places)',
        answer: loss, tolerance: tol4, lecture: 2,
        explanation: 'Evaluate the cross-entropy of each point and average: ' + dec(loss) + '.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'ml-lq-a-linear', generate: (rng) => build(sample(rng)) }
