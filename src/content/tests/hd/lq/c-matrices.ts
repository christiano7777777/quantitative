// LQ-C: Marchenko-Pastur edges and zero mass, and shrinkage of sample eigenvalues towards their average.
// Lectures 4 (covariance estimation, shrinkage) and 5 (random matrices).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params { p: number; n: number; p2: number; n2: number; ev: number[]; delta: number }

export function sample(rng: Rng): Params {
  const n = rng.pick([100, 200, 400, 500]), p = rng.pick([20, 50, 100]) * (n >= 200 ? 1 : 1)
  const n2 = rng.pick([50, 80, 100]), p2 = n2 + rng.pick([20, 40, 100])
  const ev = [rng.int(60, 120) / 10, rng.int(25, 50) / 10, rng.int(10, 20) / 10, rng.int(2, 8) / 10]
  return { p: Math.min(p, n), n, p2, n2, ev, delta: rng.pick([0.1, 0.2, 0.3, 0.5]) }
}

export function build({ p, n, p2, n2, ev, delta }: Params): LQInstance {
  const g = p / n
  const lo = (1 - Math.sqrt(g)) ** 2, hi = (1 + Math.sqrt(g)) ** 2
  const g2 = p2 / n2
  const zero = 1 - 1 / g2
  const mean = ev.reduce((a, v) => a + v, 0) / ev.length
  const shr = (v: number) => (1 - delta) * v + delta * mean

  return {
    intro: 'Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'The sample covariance of ' + tex(n) + ' observations of ' + tex(p) + ' independent unit-variance variables has Marchenko-Pastur spectrum with ' + tex('\\gamma=p/n') + '. Find the upper edge ' + tex('(1+\\sqrt\\gamma)^2') + '.',
        answer: hi, tolerance: tol4, lecture: 5,
        explanation: tex('\\gamma=' + dec(g) + ',\\ (1+\\sqrt{' + dec(g) + '})^2') + ' = ' + dec(hi) + '.',
      },
      {
        prompt: 'For the same setting, find the lower edge ' + tex('(1-\\sqrt\\gamma)^2') + '.',
        answer: lo, tolerance: tol4, lecture: 5,
        explanation: tex('(1-\\sqrt{' + dec(g) + '})^2') + ' = ' + dec(lo) + '.',
      },
      {
        prompt: 'Now ' + tex(p2) + ' variables are observed ' + tex(n2) + ' times (' + tex('p>n') + '). What fraction of the eigenvalues of ' + tex('\\frac1nX^\\top X') + ' is exactly zero, ' + tex('1-1/\\gamma') + '?',
        answer: zero, tolerance: tol4, lecture: 5,
        explanation: tex('\\gamma=' + dec(g2) + '), so ' + '1-1/\\gamma=' + dec(zero)) + '; equivalently ' + tex('p-n=' + (p2 - n2)) + ' of the ' + tex(p2) + ' eigenvalues vanish.',
      },
      {
        prompt: 'A sample covariance matrix has eigenvalues ' + tex(ev.map(dec).join(',')) + '. Shrink it with intensity ' + tex('\\delta=' + dec(delta)) + ' towards ' + tex('\\bar\\lambda I') + ', where ' + tex('\\bar\\lambda') + ' is the average eigenvalue. Find the new largest eigenvalue ' + tex('(1-\\delta)\\lambda_1+\\delta\\bar\\lambda') + '.',
        answer: shr(ev[0]), tolerance: tol4, lecture: 4,
        explanation: tex('\\bar\\lambda=' + dec(mean) + ',\\ ' + dec(1 - delta) + '\\cdot' + dec(ev[0]) + '+' + dec(delta) + '\\cdot' + dec(mean)) + ' = ' + dec(shr(ev[0])) + '.',
      },
      {
        prompt: 'Find the new smallest eigenvalue after the same shrinkage, and note that the ratio largest/smallest (the condition number) has fallen.',
        answer: shr(ev[3]), tolerance: tol4, lecture: 4,
        explanation: tex(dec(1 - delta) + '\\cdot' + dec(ev[3]) + '+' + dec(delta) + '\\cdot' + dec(mean)) + ' = ' + dec(shr(ev[3])) + '; the condition number goes from ' + dec(ev[0] / ev[3]) + ' to ' + dec(shr(ev[0]) / shr(ev[3])) + '.',
      },
    ],
  }
}

export const genC: LQGenerator = { id: 'hd-lq-c-matrices', generate: (rng) => build(sample(rng)) }
