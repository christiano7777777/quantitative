// LQ-B: a time-series test of a one-factor model: beta, alpha, R squared, residual variance and the t statistic of alpha.
// Lecture 3 (time-series tests of factor models).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params { f: number[]; r: number[] } // tenths of a percent

export function stats(f: number[], r: number[]) {
  const n = f.length
  const mf = f.reduce((a, v) => a + v, 0) / n, mr = r.reduce((a, v) => a + v, 0) / n
  let sff = 0, sfr = 0, srr = 0
  for (let i = 0; i < n; i++) { sff += (f[i] - mf) ** 2; sfr += (f[i] - mf) * (r[i] - mr); srr += (r[i] - mr) ** 2 }
  const beta = sfr / sff, alpha = mr - beta * mf
  const rss = srr - beta * sfr
  const s2 = rss / (n - 2)
  const r2 = 1 - rss / srr
  const seAlpha = Math.sqrt(s2 * (1 / n + (mf * mf) / sff))
  return { beta, alpha, r2, s2, t: alpha / seAlpha }
}

export function sample(rng: Rng): Params {
  for (;;) {
    const f = Array.from({ length: 6 }, () => rng.int(-40, 50))
    const b = rng.pick([0.6, 0.9, 1.1, 1.4])
    const r = f.map((v) => Math.round(b * v + rng.int(-25, 25)))
    if (new Set(f).size >= 5) return { f, r }
  }
}

export function build({ f, r }: Params): LQInstance {
  const F = f.map((v) => v / 10), R = r.map((v) => v / 10)
  const o = stats(F, R)

  return {
    intro:
      'Six monthly excess returns (per cent) of the market factor are ' + tex(F.map(dec).join(',')) + ' and of a stock ' + tex(R.map(dec).join(',')) + '. Run the time-series regression ' + tex('r_t=\\alpha+\\beta f_t+\\varepsilon_t') + ' by least squares. Give answers to 3 decimal places; do not round intermediate values.',
    parts: [
      { prompt: 'Find ' + tex('\\hat\\beta') + '.', answer: o.beta, tolerance: tol3, lecture: 3, explanation: tex('\\hat\\beta=S_{fr}/S_{ff}') + ' = ' + dec(o.beta) + '.' },
      { prompt: 'Find ' + tex('\\hat\\alpha') + ' (per cent per month).', answer: o.alpha, tolerance: tol3, lecture: 3, explanation: tex('\\hat\\alpha=\\bar r-\\hat\\beta\\bar f') + ' = ' + dec(o.alpha) + '.' },
      { prompt: 'Find the ' + tex('R^2') + ' of the regression.', answer: o.r2, tolerance: tol3, lecture: 3, explanation: tex('R^2=1-RSS/S_{rr}') + ' = ' + dec(o.r2) + '.' },
      { prompt: 'Find the residual variance estimate ' + tex('s^2=RSS/(T-2)') + '.', answer: o.s2, tolerance: tol3, lecture: 3, explanation: tex('RSS/4') + ' = ' + dec(o.s2) + '.' },
      {
        prompt: 'Find the ' + tex('t') + ' statistic of ' + tex('\\hat\\alpha') + ', using ' + tex('\\operatorname{se}(\\hat\\alpha)=s\\sqrt{1/T+\\bar f^2/S_{ff}}') + '. (A significantly nonzero alpha is evidence against the factor model.)',
        answer: o.t, tolerance: tol3, lecture: 3, explanation: tex('t=\\hat\\alpha/\\operatorname{se}(\\hat\\alpha)') + ' = ' + dec(o.t) + ', compared with ' + tex('t_4') + '.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'pf2-lq-b-timeseries', generate: (rng) => build(sample(rng)) }
