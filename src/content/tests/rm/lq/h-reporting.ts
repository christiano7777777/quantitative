// LQ-H: critiquing a reported result: t statistic against the selection benchmark, a seeded pseudo-random stream, a confidence interval.
// Lectures 4 (selection among many trials), 10 (reproducibility: seeds), 11 (communicating results).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tolInt } from '../../../shared/format'

export interface Params { sr: number; years: number; N: number; a: number; c: number; m: number; seed: number; mean: number; s: number; n: number }

export function sample(rng: Rng): Params {
  return {
    sr: rng.pick([1, 1.2, 1.5, 1.8]), years: rng.pick([3, 4, 5, 6]), N: rng.pick([10, 50, 100, 500, 1000]),
    a: rng.pick([3, 5, 7, 9]), c: rng.pick([1, 3, 5, 7]), m: rng.pick([16, 32, 64]), seed: 0,
    mean: rng.int(5, 20) / 10, s: rng.pick([2, 3, 4, 5]), n: rng.pick([36, 60, 100, 144]),
  }
}

/** x_{k+1} = (a x_k + c) mod m, started at the seed, returns x_k */
export const lcg = (a: number, c: number, m: number, seed: number, k: number) => { let x = seed; for (let i = 0; i < k; i++) x = (a * x + c) % m; return x }

export function build(p: Params): LQInstance {
  const { sr, years, N, a, c, m, mean, s, n } = p
  const seed = (p.seed || 0) + 1 + (a + c) % (m - 1)
  const t = sr * Math.sqrt(years)
  const bench = Math.sqrt(2 * Math.log(N))
  const x3 = lcg(a, c, m, seed, 3)
  const hw = (1.96 * s) / Math.sqrt(n)

  return {
    intro: 'A paper reports its best strategy, chosen from ' + tex(N) + ' variants tested, with an annualised Sharpe ratio of ' + tex(dec(sr)) + ' over ' + tex(years) + ' years. Give answers to 3 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the approximate ' + tex('t') + ' statistic of the reported strategy, ' + tex('SR\\sqrt{T}') + '.',
        answer: t, tolerance: tol3, lecture: 4,
        explanation: tex(dec(sr) + '\\sqrt{' + years + '}') + ' = ' + dec(t) + '.',
      },
      {
        prompt: 'The expected best ' + tex('t') + ' among ' + tex(N) + ' strategies with no skill is at most about ' + tex('\\sqrt{2\\ln N}') + '. Find this benchmark.',
        answer: bench, tolerance: tol3, lecture: 4,
        explanation: tex('\\sqrt{2\\ln' + N + '}') + ' = ' + dec(bench) + '.',
      },
      {
        prompt: 'Find the excess ' + tex('t-\\sqrt{2\\ln N}') + '. If it is negative, the reported result is no better than what the search alone would produce by luck.',
        answer: t - bench, tolerance: tol3, lecture: 11,
        explanation: tex(dec(t) + '-' + dec(bench)) + ' = ' + dec(t - bench) + '.',
      },
      {
        prompt: 'The simulation in the paper uses a linear congruential generator ' + tex('x_{k+1}=(' + a + 'x_k+' + c + ')\\bmod ' + m) + ' with recorded seed ' + tex('x_0=' + seed) + '. Anyone who knows the seed can regenerate the stream. Find ' + tex('x_3') + '.',
        answer: x3, tolerance: tolInt, lecture: 10,
        explanation: 'Iterate: ' + [1, 2, 3].map((k) => tex('x_' + k + '=' + lcg(a, c, m, seed, k))).join(', ') + '.',
      },
      {
        prompt: 'The paper also reports a mean monthly return of ' + tex(dec(mean) + '\\%') + ' with sample standard deviation ' + tex(s + '\\%') + ' over ' + tex(n) + ' months. Find the half-width ' + tex('1.96\\,s/\\sqrt n') + ' of its 95% confidence interval (3 decimal places).',
        answer: hw, tolerance: tol3, lecture: 11,
        explanation: tex('1.96\\cdot' + s + '/\\sqrt{' + n + '}') + ' = ' + dec(hw) + ', so the interval is ' + tex(dec(mean) + '\\pm' + dec(hw)) + '.',
      },
    ],
  }
}

export const genH: LQGenerator = { id: 'rm-lq-h-reporting', generate: (rng) => build(sample(rng)) }
