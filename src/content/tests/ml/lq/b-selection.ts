// LQ-B: choosing lambda from cross-validation output, a mean and standard error of fold errors, k-NN predictions and an RBF kernel value.
// Lectures 3 (regularisation and model selection) and 4 (k-NN and kernel methods).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params { lams: number[]; cv: number[]; folds: number[]; xs: number[]; ys: number[]; cls: number[]; x0: number; k: number; gamma: number; u: number[]; v: number[] }

export function sample(rng: Rng): Params {
  const lams = [0.01, 0.1, 1, 10, 100]
  const c = rng.int(1, 3)
  for (;;) {
    const xs = rng.sample(Array.from({ length: 20 }, (_, i) => i + 1), 7).sort((a, b) => a - b)
    const x0 = rng.int(3, 18) + 0.5
    const d = xs.map((x) => Math.abs(x - x0)).sort((a, b) => a - b)
    const k = rng.pick([3, 5])
    if (d[k - 1] !== d[k]) return {
      lams, cv: lams.map((_, i) => Math.round((2 + 0.5 * (i - c) ** 2 + rng.int(0, 30) / 100) * 100) / 100), folds: Array.from({ length: 5 }, () => rng.int(150, 320) / 100),
      xs, ys: xs.map(() => rng.int(0, 20)), cls: xs.map(() => rng.int(0, 1)), x0, k, gamma: rng.pick([0.1, 0.5, 1]), u: [rng.int(0, 3), rng.int(0, 3)], v: [rng.int(0, 3), rng.int(0, 3)],
    }
  }
}

export function build({ lams, cv, folds, xs, ys, cls, x0, k, gamma, u, v }: Params): LQInstance {
  const best = lams[cv.indexOf(Math.min(...cv))]
  const mean = folds.reduce((a, b) => a + b, 0) / folds.length
  const near = xs.map((x, i) => i).sort((a, b) => Math.abs(xs[a] - x0) - Math.abs(xs[b] - x0)).slice(0, k)
  const pred = near.reduce((a, i) => a + ys[i], 0) / k
  const frac = near.reduce((a, i) => a + cls[i], 0) / k
  const kern = Math.exp(-gamma * ((u[0] - v[0]) ** 2 + (u[1] - v[1]) ** 2))
  const tbl = lams.map((l, i) => tex(dec(l)) + ': ' + tex(dec(cv[i]))).join('; ')

  return {
    intro: 'Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Five-fold cross-validation of a ridge regression gave these mean squared errors for ' + tex('\\lambda') + ': ' + tbl + '. Which ' + tex('\\lambda') + ' minimises the cross-validation error?',
        answer: best, tolerance: { abs: 0.0001 }, lecture: 3,
        explanation: 'The smallest error ' + dec(Math.min(...cv)) + ' occurs at ' + tex('\\lambda=' + dec(best)) + '.',
      },
      {
        prompt: 'For the chosen model, the five fold errors were ' + tex(folds.map(dec).join(',')) + '. Find their mean, the cross-validation estimate (3 decimal places).',
        answer: mean, tolerance: tol3, lecture: 3,
        explanation: 'The average of the five fold errors is ' + dec(mean) + '.',
      },
      {
        prompt: 'The RBF kernel ' + tex('k(u,v)=\\exp(-\\gamma\\|u-v\\|^2)') + ' with ' + tex('\\gamma=' + dec(gamma)) + ' is used for similarities. Find ' + tex('k(u,v)') + ' for ' + tex('u=(' + u.join(',') + ')') + ' and ' + tex('v=(' + v.join(',') + ')') + '.',
        answer: kern, tolerance: tol4, lecture: 4,
        explanation: tex('\\|u-v\\|^2=' + ((u[0] - v[0]) ** 2 + (u[1] - v[1]) ** 2)) + ', so ' + tex('k=e^{-' + dec(gamma * ((u[0] - v[0]) ** 2 + (u[1] - v[1]) ** 2)) + '}') + ' = ' + dec(kern) + '.',
      },
      {
        prompt: 'Training points ' + tex('(x,y)') + ': ' + tex(xs.map((v2, i) => '(' + v2 + ',' + ys[i] + ')').join(',')) + '. Predict ' + tex('y') + ' at ' + tex('x_0=' + dec(x0)) + ' by ' + tex(k) + '-nearest-neighbour regression (the average of the ' + tex(k) + ' nearest ' + tex('y') + ' values). (3 decimal places)',
        answer: pred, tolerance: tol3, lecture: 4,
        explanation: 'The ' + tex(k) + ' nearest ' + tex('x') + ' values are ' + near.map((i) => xs[i]).join(', ') + ' with ' + tex('y') + ' values ' + near.map((i) => ys[i]).join(', ') + '; their mean is ' + dec(pred) + '.',
      },
      {
        prompt: 'The same points have class labels ' + tex(cls.join(',')) + ' (in the order listed). Find the fraction of the ' + tex(k) + ' nearest neighbours of ' + tex('x_0') + ' that have label 1, which is the predicted probability of class 1.',
        answer: frac, tolerance: tol4, lecture: 4,
        explanation: 'Labels of the ' + tex(k) + ' nearest points: ' + near.map((i) => cls[i]).join(', ') + ', so the fraction is ' + dec(frac) + '.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'ml-lq-b-selection', generate: (rng) => build(sample(rng)) }
