// Lecture 1: one clinic waiting-count series; sample mean, autocovariances and sample ACF by hand.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { xs: number[] }

const acov = (xs: number[], h: number) => {
  const n = xs.length
  const m = xs.reduce((a, x) => a + x, 0) / n
  let s = 0
  for (let t = 0; t < n - h; t++) s += (xs[t] - m) * (xs[t + h] - m)
  return s / n
}

export function sample(rng: Rng): Params {
  for (;;) {
    const n = rng.pick([5, 6])
    const xs = Array.from({ length: n }, () => rng.int(10, 19))
    const g0 = acov(xs, 0)
    const g1 = acov(xs, 1)
    const g2 = acov(xs, 2)
    if (g0 > 1 && Math.abs(g1) > 0.2 && Math.abs(g2) > 0.05 && Math.abs(g1 / g0) < 0.95) return { xs }
  }
}

export function build({ xs }: Params): LQInstance {
  const n = xs.length
  const mean = xs.reduce((a, x) => a + x, 0) / n
  const ds = xs.map((x) => x - mean)
  const g0 = acov(xs, 0)
  const g1 = acov(xs, 1)
  const g2 = acov(xs, 2)
  const r1 = g1 / g0
  const list = xs.map((x, i) => tex('x_' + (i + 1) + '=' + x)).join(', ')
  const dev = ds.map((d, i) => tex('d_' + (i + 1) + '=' + dec(d))).join(', ')
  return {
    intro: 'A campus clinic records the number of patients waiting at noon on ' + tex(n) + ' consecutive weekdays. The observations, in time order, are ' + list + '. Use the sample autocovariance convention ' + tex('\\hat\\gamma(h)=\\frac1n\\sum_{t=1}^{n-h}(x_t-\\bar x)(x_{t+h}-\\bar x)') + '. Give decimal answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the sample mean ' + tex('\\bar x') + '.',
        answer: mean, tolerance: tol4, lecture: 1,
        explanation: tex('\\bar x=(' + xs.join('+') + ')/' + n + '=' + dec(mean)) + '.',
      },
      {
        prompt: 'Find the sample variance ' + tex('\\hat\\gamma(0)') + '.',
        answer: g0, tolerance: tol4, lecture: 1,
        explanation: 'The deviations are ' + dev + '. Thus ' + tex('\\hat\\gamma(0)=\\frac1' + n + '\\sum_{t=1}^{' + n + '}d_t^2=' + dec(g0)) + '.',
      },
      {
        prompt: 'Find the lag-one sample autocovariance ' + tex('\\hat\\gamma(1)') + '.',
        answer: g1, tolerance: tol4, lecture: 1,
        explanation: tex('\\hat\\gamma(1)=\\frac1' + n + '(' + ds.slice(0, n - 1).map((d, i) => '(' + dec(d) + ')(' + dec(ds[i + 1]) + ')').join('+') + ')=' + dec(g1)) + '.',
      },
      {
        prompt: 'Find the lag-one sample autocorrelation ' + tex('\\hat\\rho(1)') + '.',
        answer: r1, tolerance: tol4, lecture: 1,
        explanation: tex('\\hat\\rho(1)=\\hat\\gamma(1)/\\hat\\gamma(0)=' + dec(g1) + '/' + dec(g0) + '=' + dec(r1)) + '.',
      },
      {
        prompt: 'Find the lag-two sample autocovariance ' + tex('\\hat\\gamma(2)') + '.',
        answer: g2, tolerance: tol4, lecture: 1,
        explanation: tex('\\hat\\gamma(2)=\\frac1' + n + '\\sum_{t=1}^{' + (n - 2) + '}d_td_{t+2}=' + dec(g2)) + '.',
      },
    ],
  }
}

export const genLec1: LQGenerator = { id: 'ts1-lq-lec1', generate: (rng) => build(sample(rng)) }
