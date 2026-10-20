// Lecture 9: one quarterly ferry series; seasonal differences, seasonal ACF and SARIMA identification.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { xs: number[] }

export function sample(rng: Rng): Params {
  for (;;) {
    const xs = Array.from({ length: 8 }, (_, i) => rng.int(20 + 5 * (i % 4), 24 + 5 * (i % 4)))
    const m = xs.reduce((a, x) => a + x, 0) / 8
    const den = xs.reduce((a, x) => a + (x - m) ** 2, 0)
    let num = 0
    for (let t = 0; t < 4; t++) num += (xs[t] - m) * (xs[t + 4] - m)
    if (den > 0 && Math.abs(num / den) > 0.2) return { xs }
  }
}

export function build({ xs }: Params): LQInstance {
  const sdiff = xs.slice(4).map((x, i) => x - xs[i])
  const smean = sdiff.reduce((a, x) => a + x, 0) / sdiff.length
  const m = xs.reduce((a, x) => a + x, 0) / 8
  const den = xs.reduce((a, x) => a + (x - m) ** 2, 0)
  let num = 0
  for (let t = 0; t < 4; t++) num += (xs[t] - m) * (xs[t + 4] - m)
  const rho4 = num / den
  return {
    intro: 'A ferry operator records a quarterly passenger-pressure index for eight consecutive quarters: ' + xs.map((x, i) => tex('x_' + (i + 1) + '=' + x)).join(', ') + '. The period is ' + tex('s=4') + '. A residual ACF has one prominent spike at lag 4 and no important spike at lag 8; nonseasonal low-lag spikes are absent. For the identification code enter 1 for no seasonal term, 2 for a seasonal MA(1), and 3 for a seasonal AR(1). Give decimal answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Enter the seasonal period ' + tex('s') + ' as a whole number.',
        answer: 4, tolerance: tolInt, lecture: 9,
        explanation: 'The data are quarterly, so one full seasonal cycle contains ' + tex('4') + ' observations.',
      },
      {
        prompt: 'Find the seasonal difference ' + tex('\\nabla_4x_6=x_6-x_2') + '.',
        answer: sdiff[1], tolerance: tol4, lecture: 9,
        explanation: tex('\\nabla_4x_6=' + dec(xs[5]) + '-' + dec(xs[1]) + '=' + dec(sdiff[1])) + '.',
      },
      {
        prompt: 'How many seasonal differences of period 4 can be formed from eight observations? Give a whole number.',
        answer: 4, tolerance: tolInt, lecture: 9,
        explanation: tex('n-s=8-4=4') + '.',
      },
      {
        prompt: 'Find the sample mean of the four seasonal differences.',
        answer: smean, tolerance: tol4, lecture: 9,
        explanation: tex('(' + sdiff.join('+') + ')/4=' + dec(smean)) + '.',
      },
      {
        prompt: 'Find the lag-four sample autocorrelation ' + tex('\\hat\\rho(4)') + '.',
        answer: rho4, tolerance: tol4, lecture: 9,
        explanation: tex('\\hat\\rho(4)=\\frac{\\sum_{t=1}^{4}(x_t-\\bar x)(x_{t+4}-\\bar x)}{\\sum_{t=1}^{8}(x_t-\\bar x)^2}=' + dec(num) + '/' + dec(den) + '=' + dec(rho4)) + '.',
      },
      {
        prompt: 'Enter the identification code for the stated seasonal ACF pattern.',
        answer: 2, tolerance: tolInt, lecture: 9,
        explanation: 'A seasonal MA(1) has a spike at lag ' + tex('s') + ' and then cuts off at the seasonal lags, matching one lag-4 spike and no lag-8 spike. The code is 2.',
      },
    ],
  }
}

export const genLec9: LQGenerator = { id: 'ts1-lq-lec9', generate: (rng) => build(sample(rng)) }
