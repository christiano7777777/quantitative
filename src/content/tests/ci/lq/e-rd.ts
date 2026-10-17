// LQ-E: a regression discontinuity from three points on each side of the cutoff: local linear intercepts, the jump, a slope, a fuzzy estimate.
// Lecture 7 (regression discontinuity).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params { yl: number[]; yr: number[]; pl: number; pr: number } // outcomes in tenths at x = -3,-2,-1 and 1,2,3

export const XL = [-3, -2, -1], XR = [1, 2, 3]
/** least squares line through (x, y); returns intercept and slope */
export function line(x: number[], y: number[]) {
  const n = x.length
  const mx = x.reduce((a, v) => a + v, 0) / n, my = y.reduce((a, v) => a + v, 0) / n
  const sxy = x.reduce((a, v, i) => a + (v - mx) * (y[i] - my), 0), sxx = x.reduce((a, v) => a + (v - mx) ** 2, 0)
  return { slope: sxy / sxx, intercept: my - (sxy / sxx) * mx }
}

export function sample(rng: Rng): Params {
  const a = rng.int(30, 80)
  const sl = rng.int(-5, 10), sr = rng.int(-5, 10), jump = rng.int(8, 40)
  const yl = XL.map((x) => a + sl * x + rng.int(-6, 6)), yr = XR.map((x) => a + jump + sr * x + rng.int(-6, 6))
  return { yl, yr, pl: rng.int(5, 30), pr: rng.int(55, 90) }
}

export function build({ yl, yr, pl, pr }: Params): LQInstance {
  const L = line(XL, yl.map((v) => v / 10)), R = line(XR, yr.map((v) => v / 10))
  const rd = R.intercept - L.intercept
  const fuzzy = rd / ((pr - pl) / 100)

  return {
    intro:
      'The running variable is centred at the cutoff (' + tex('x=0') + '). Three observations lie on each side within the bandwidth: for ' + tex('x=-3,-2,-1') + ' the outcomes are ' + tex(yl.map((v) => dec(v / 10)).join(',')) + ', and for ' + tex('x=1,2,3') + ' they are ' + tex(yr.map((v) => dec(v / 10)).join(',')) +
      '. Fit a separate straight line by least squares on each side (a local linear RD). Give answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the left-hand line\'s value at the cutoff (its intercept).',
        answer: L.intercept, tolerance: tol3, lecture: 7,
        explanation: tex('\\bar y-\\hat b\\bar x') + ' with slope ' + dec(L.slope) + ' gives ' + dec(L.intercept) + '.',
      },
      {
        prompt: 'Find the right-hand line\'s value at the cutoff.',
        answer: R.intercept, tolerance: tol3, lecture: 7,
        explanation: 'Slope ' + dec(R.slope) + ', intercept ' + dec(R.intercept) + '.',
      },
      {
        prompt: 'Find the sharp RD estimate: the right intercept minus the left intercept.',
        answer: rd, tolerance: tol3, lecture: 7,
        explanation: tex(dec(R.intercept) + '-' + dec(L.intercept)) + ' = ' + dec(rd) + '.',
      },
      {
        prompt: 'Find the slope of the right-hand line. (The two sides are allowed different slopes.)',
        answer: R.slope, tolerance: tol3, lecture: 7,
        explanation: tex('\\hat b=\\sum(x-\\bar x)(y-\\bar y)/\\sum(x-\\bar x)^2') + ' = ' + dec(R.slope) + '.',
      },
      {
        prompt: 'Treatment is only partly determined by the cutoff: the probability of treatment is ' + tex(pl + '\\%') + ' just below and ' + tex(pr + '\\%') + ' just above. Find the fuzzy RD estimate: the outcome jump divided by the jump in treatment probability.',
        answer: fuzzy, tolerance: tol3, lecture: 7,
        explanation: tex(dec(rd) + '/' + dec((pr - pl) / 100)) + ' = ' + dec(fuzzy) + ', the effect for compliers at the cutoff.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'ci-lq-e-rd', generate: (rng) => build(sample(rng)) }
