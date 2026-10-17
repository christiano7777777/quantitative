// LQ-D: order statistics of uniforms (min, k-th, range), Buffon's needle, and the chance that two uniform points are close.
// Lecture 6 (order statistics and geometric probability).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { n: number; k: number; len: number; d: number; a: number } // len, d in tenths; a in hundredths

export function sample(rng: Rng): Params {
  const n = rng.pick([4, 5, 7, 9, 12])
  const d = rng.pick([20, 30, 40])
  return { n, k: rng.int(2, n - 1), len: rng.int(5, d), d, a: rng.pick([10, 20, 25, 30, 40]) }
}

export function build({ n, k, len, d, a }: Params): LQInstance {
  const mn = 1 / (n + 1)
  const kth = k / (n + 1)
  const range = (n - 1) / (n + 1)
  const buffon = (2 * (len / 10)) / (Math.PI * (d / 10))
  const A = a / 100
  const close = 2 * A - A * A

  return {
    intro: 'Give answers to 4 decimal places.',
    parts: [
      {
        prompt: tex(n) + ' independent uniform' + tex('(0,1)') + ' variables are drawn. Find the expected value of the smallest.',
        answer: mn, tolerance: tol4, lecture: 6,
        explanation: 'The points cut ' + tex('(0,1)') + ' into ' + tex(n + 1) + ' gaps of equal mean length: ' + tex('1/' + (n + 1)) + ' = ' + dec(mn) + '.',
      },
      {
        prompt: 'Find the expected value of the ' + tex(k) + (k === 2 ? 'nd' : k === 3 ? 'rd' : 'th') + ' smallest of the ' + tex(n) + ' variables, ' + tex('k/(n+1)') + '.',
        answer: kth, tolerance: tol4, lecture: 6,
        explanation: tex(k + '/' + (n + 1)) + ' = ' + dec(kth) + '.',
      },
      {
        prompt: 'Find the expected range (largest minus smallest), ' + tex('(n-1)/(n+1)') + '.',
        answer: range, tolerance: tol4, lecture: 6,
        explanation: tex('E[\\max]-E[\\min]=\\tfrac{n}{n+1}-\\tfrac1{n+1}') + ' = ' + dec(range) + '.',
      },
      {
        prompt: 'A needle of length ' + tex(dec(len / 10)) + ' is dropped on a floor ruled with parallel lines ' + tex(dec(d / 10)) + ' apart. Find the probability that it crosses a line, ' + tex('2\\ell/(\\pi d)') + ' (valid for ' + tex('\\ell\\le d') + ').',
        answer: buffon, tolerance: tol4, lecture: 6,
        explanation: tex('2\\cdot' + dec(len / 10) + '/(\\pi\\cdot' + dec(d / 10) + ')') + ' = ' + dec(buffon) + '.',
      },
      {
        prompt: 'Two points are chosen independently and uniformly on ' + tex('[0,1]') + '. Find the probability that they are less than ' + tex(dec(A)) + ' apart, ' + tex('2a-a^2') + '.',
        answer: close, tolerance: tol4, lecture: 6,
        explanation: 'The region ' + tex('|x-y|<a') + ' in the unit square has area ' + tex('1-(1-a)^2=2a-a^2') + ' = ' + dec(close) + '.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'pz-lq-d-order', generate: (rng) => build(sample(rng)) }
