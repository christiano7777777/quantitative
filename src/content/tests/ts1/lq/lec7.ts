// Lecture 7: one six-day delay series; moment, Yule-Walker and conditional AR(1) estimation.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { xs: number[] }

const mean = (xs: number[]) => xs.reduce((a, x) => a + x, 0) / xs.length
const acov = (xs: number[], h: number) => {
  const m = mean(xs)
  let s = 0
  for (let t = 0; t < xs.length - h; t++) s += (xs[t] - m) * (xs[t + h] - m)
  return s / xs.length
}

export function sample(rng: Rng): Params {
  for (;;) {
    const xs = Array.from({ length: 6 }, () => rng.int(8, 18))
    const g0 = acov(xs, 0)
    const phi = acov(xs, 1) / g0
    if (g0 > 2 && Math.abs(phi) > 0.15 && Math.abs(phi) < 0.9) return { xs }
  }
}

export function build({ xs }: Params): LQInstance {
  const m = mean(xs)
  const ds = xs.map((x) => x - m)
  const g0 = acov(xs, 0)
  const g1 = acov(xs, 1)
  const phi = g1 / g0
  const sigma2 = g0 * (1 - phi * phi)
  const resid = xs[5] - (m + phi * (xs[4] - m))
  return {
    intro: 'A logistics team observes a daily delay index on six consecutive days: ' + xs.map((x, i) => tex('x_' + (i + 1) + '=' + x)).join(', ') + '. It fits ' + tex('X_t=\\mu+\\phi(X_{t-1}-\\mu)+Z_t') + ' by the denominator-' + tex('n') + ' sample moments. Give decimal answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Estimate the mean ' + tex('\\mu') + ' by the sample mean.',
        answer: m, tolerance: tol4, lecture: 7,
        explanation: tex('\\hat\\mu=(' + xs.join('+') + ')/6=' + dec(m)) + '.',
      },
      {
        prompt: 'Find the sample variance ' + tex('\\hat\\gamma(0)') + '.',
        answer: g0, tolerance: tol4, lecture: 7,
        explanation: 'The centred observations are ' + ds.map((d) => tex(dec(d))).join(', ') + ', so ' + tex('\\hat\\gamma(0)=\\frac16\\sum d_t^2=' + dec(g0)) + '.',
      },
      {
        prompt: 'Find the sample lag-one autocovariance ' + tex('\\hat\\gamma(1)') + '.',
        answer: g1, tolerance: tol4, lecture: 7,
        explanation: tex('\\hat\\gamma(1)=\\frac16\\sum_{t=1}^{5}(x_t-\\bar x)(x_{t+1}-\\bar x)=' + dec(g1)) + '.',
      },
      {
        prompt: 'Find the method-of-moments/Yule-Walker estimate ' + tex('\\hat\\phi') + '.',
        answer: phi, tolerance: tol4, lecture: 7,
        explanation: tex('\\hat\\phi=\\hat\\rho(1)=\\hat\\gamma(1)/\\hat\\gamma(0)=' + dec(g1) + '/' + dec(g0) + '=' + dec(phi)) + '.',
      },
      {
        prompt: 'Estimate the innovation variance using ' + tex('\\hat\\sigma^2=\\hat\\gamma(0)(1-\\hat\\phi^2)') + '.',
        answer: sigma2, tolerance: tol4, lecture: 7,
        explanation: tex('\\hat\\sigma^2=' + dec(g0) + '(1-' + dec(phi) + '^2)=' + dec(sigma2)) + '.',
      },
      {
        prompt: 'Using the fitted conditional mean, find the one-step residual at day 6.',
        answer: resid, tolerance: tol4, lecture: 7,
        explanation: tex('\\hat z_6=x_6-[\\hat\\mu+\\hat\\phi(x_5-\\hat\\mu)]=' + dec(xs[5]) + '-[' + dec(m) + '+' + dec(phi) + '(' + dec(xs[4]) + '-' + dec(m) + ')]=' + dec(resid)) + '.',
      },
    ],
  }
}

export const genLec7: LQGenerator = { id: 'ts1-lq-lec7', generate: (rng) => build(sample(rng)) }
