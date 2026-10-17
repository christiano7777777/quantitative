// LQ-G: reading a parameter-sensitivity table and subperiod results: peak, mean, plateau width, drop at neighbours, stability across halves.
// Lecture 9 (robustness and sensitivity).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tolInt } from '../../../shared/format'

export interface Params { grid: number[]; sr: number[]; sub: number[] } // lookbacks, Sharpe ratios in hundredths, four subperiod Sharpe ratios in hundredths

export function sample(rng: Rng): Params {
  const base = rng.int(60, 140)
  const sr = [0, 1, 2, 3, 4].map((i) => Math.max(-20, Math.round(base - 30 * Math.abs(i - rng.pick([1, 2, 3])) + rng.int(-20, 20))))
  return { grid: [10, 20, 40, 80, 160], sr, sub: Array.from({ length: 4 }, () => rng.int(-60, 150)) }
}

export function build({ grid, sr, sub }: Params): LQInstance {
  const S = sr.map((v) => v / 100), U = sub.map((v) => v / 100)
  const peak = Math.max(...S)
  const mean = S.reduce((a, v) => a + v, 0) / S.length
  const within = S.filter((v) => v >= 0.7 * peak).length
  const ip = S.indexOf(peak)
  const nb = [ip - 1, ip + 1].filter((i) => i >= 0 && i < S.length).map((i) => S[i])
  const drop = 1 - nb.reduce((a, v) => a + v, 0) / nb.length / peak
  const pos = U.filter((v) => v > 0).length

  return {
    intro:
      'A momentum strategy was run for lookback windows ' + tex(grid.join(',')) + ' days, giving annualised Sharpe ratios ' + tex(S.map(dec).join(',')) + ' (in that order). It was also run over four consecutive subperiods with Sharpe ratios ' + tex(U.map(dec).join(',')) + '. Give answers to 3 decimal places unless told otherwise.',
    parts: [
      { prompt: 'Find the peak Sharpe ratio across the lookbacks.', answer: peak, tolerance: tol3, lecture: 9, explanation: 'The largest value in the table is ' + dec(peak) + ' (lookback ' + grid[ip] + ').' },
      { prompt: 'Find the mean Sharpe ratio across the five lookbacks.', answer: mean, tolerance: tol3, lecture: 9, explanation: tex('(' + S.map(dec).join('+') + ')/5') + ' = ' + dec(mean) + '.' },
      { prompt: 'How many of the five lookbacks have a Sharpe ratio of at least 70% of the peak? (A wide plateau suggests robustness.)', answer: within, tolerance: tolInt, lecture: 9, explanation: 'The threshold is ' + dec(0.7 * peak) + '; ' + within + ' of the values reach it.' },
      { prompt: 'Find the average relative drop from the peak to its neighbouring lookbacks, ' + tex('1-\\text{mean(neighbours)}/\\text{peak}') + '. A large drop means a sharp, fragile peak.', answer: drop, tolerance: tol3, lecture: 9, explanation: 'Neighbours of lookback ' + grid[ip] + ' have Sharpe ' + nb.map(dec).join(' and ') + ', so the drop is ' + dec(drop) + '.' },
      { prompt: 'In how many of the four subperiods is the Sharpe ratio positive?', answer: pos, tolerance: tolInt, lecture: 9, explanation: 'Positive values: ' + U.filter((v) => v > 0).map(dec).join(', ') + ' (' + pos + ' of 4).' },
    ],
  }
}

export const genG: LQGenerator = { id: 'rm-lq-g-robustness', generate: (rng) => build(sample(rng)) }
