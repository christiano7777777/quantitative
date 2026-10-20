// Lecture 8: one inventory-pressure series; first differences, ADF decisions and ARIMA d.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { xs: number[]; adfLevel: number; adfDiff: number; crit: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const xs = [rng.int(18, 22)]
    for (let i = 1; i < 6; i++) xs.push(xs[i - 1] + rng.int(-2, 3))
    const diffs = xs.slice(1).map((x, i) => x - xs[i])
    const allSame = diffs.every((d) => d === diffs[0])
    if (!allSame) return { xs, adfLevel: rng.pick([-1.2, -1.5, -1.8]), adfDiff: rng.pick([-3.8, -4.1, -4.4]), crit: -2.9 }
  }
}

export function build({ xs, adfLevel, adfDiff, crit }: Params): LQInstance {
  const ds = xs.slice(1).map((x, i) => x - xs[i])
  const dm = ds.reduce((a, x) => a + x, 0) / ds.length
  return {
    intro: 'A retailer records an inventory-pressure index on six consecutive days: ' + xs.map((x, i) => tex('x_' + (i + 1) + '=' + x)).join(', ') + '. The ADF statistic for the levels is ' + tex(dec(adfLevel)) + '; after one difference it is ' + tex(dec(adfDiff)) + '. The 5% critical value in both tests is ' + tex(dec(crit)) + '. Reject the unit-root null when the statistic is smaller than the critical value. For a decision code enter 1 for reject and 0 for do not reject. Give decimal answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the first difference ' + tex('\\nabla x_2=x_2-x_1') + '.',
        answer: ds[0], tolerance: tol4, lecture: 8,
        explanation: tex('\\nabla x_2=' + dec(xs[1]) + '-' + dec(xs[0]) + '=' + dec(ds[0])) + '.',
      },
      {
        prompt: 'Find the first difference ' + tex('\\nabla x_6=x_6-x_5') + '.',
        answer: ds[4], tolerance: tol4, lecture: 8,
        explanation: tex('\\nabla x_6=' + dec(xs[5]) + '-' + dec(xs[4]) + '=' + dec(ds[4])) + '.',
      },
      {
        prompt: 'Find the sample mean of the five first differences.',
        answer: dm, tolerance: tol4, lecture: 8,
        explanation: tex('\\bar d=(' + ds.join('+') + ')/5=' + dec(dm)) + '.',
      },
      {
        prompt: 'Give the ADF decision code for the levels.',
        answer: 0, tolerance: tolInt, lecture: 8,
        explanation: tex(dec(adfLevel) + '>' + dec(crit)) + ', so the unit-root null is not rejected for the levels. The code is 0.',
      },
      {
        prompt: 'Give the ADF decision code for the first differences.',
        answer: 1, tolerance: tolInt, lecture: 8,
        explanation: tex(dec(adfDiff) + '<' + dec(crit)) + ', so the unit-root null is rejected for the first differences. The code is 1.',
      },
      {
        prompt: 'Enter the smallest differencing order ' + tex('d') + ' supported by these decisions.',
        answer: 1, tolerance: tolInt, lecture: 8,
        explanation: 'The levels retain a unit root but one difference does not, so an ARIMA specification uses ' + tex('d=1') + '.',
      },
    ],
  }
}

export const genLec8: LQGenerator = { id: 'ts1-lq-lec8', generate: (rng) => build(sample(rng)) }
