// LQ-H: execution schedules (TWAP, VWAP, POV) and live risk monitoring (value at risk and a drawdown kill-switch buffer).
// Lectures 10 (execution algorithms) and 11 (live trading and monitoring).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol2, tol4 } from '../../../shared/format'

export interface Params { Q: number; slices: number; profile: number[]; bucket: number; rate: number; vol: number; pos: number; sigma: number; peak: number; eq: number; limit: number }

export function sample(rng: Rng): Params {
  const w = Array.from({ length: 3 }, () => rng.int(2, 5)) // volume shares in units of 5%, the last bucket takes the rest
  w.push(20 - w.reduce((a, b) => a + b, 0))
  const peak = rng.int(900, 1200)
  return { Q: rng.pick([10000, 20000, 50000, 120000]), slices: rng.pick([5, 8, 10, 20]), profile: w.map((v) => v / 20), bucket: rng.int(0, 3), rate: rng.pick([0.05, 0.1, 0.2]), vol: rng.pick([2000, 5000, 8000]), pos: rng.pick([1, 2, 5, 10]) * 1000000, sigma: rng.int(5, 25) / 1000, peak, eq: Math.round(peak * (1 - rng.int(3, 12) / 100)), limit: rng.int(15, 25) / 100 }
}

export function build({ Q, slices, profile, bucket, rate, vol, pos, sigma, peak, eq, limit }: Params): LQInstance {
  const twap = Q / slices
  const vwap = Q * profile[bucket]
  const minutes = Q / (rate * vol)
  const var99 = 2.326 * sigma * pos
  const dd = 1 - eq / peak
  const buffer = limit - dd

  return {
    intro: 'An order to buy ' + tex(Q) + ' shares must be worked. Give answers to 4 decimal places except where stated.',
    parts: [
      {
        prompt: 'TWAP splits the order evenly across ' + tex(slices) + ' time slices. How many shares are traded per slice?',
        answer: twap, tolerance: tol4, lecture: 10,
        explanation: tex(Q + '/' + slices + '=' + dec(twap)) + '.',
      },
      {
        prompt: 'VWAP follows the expected volume profile. The day is divided into four buckets with expected volume shares ' + tex(profile.map((v) => dec(v * 100) + '\\%').join(',\\ ')) + '. How many shares should be traded in bucket ' + tex(bucket + 1) + '? Give it to 2 decimal places.',
        answer: vwap, tolerance: tol2, lecture: 10,
        explanation: tex(Q + '\\times' + dec(profile[bucket]) + '=' + dec(vwap)) + '. VWAP trades more when the market is busy.',
      },
      {
        prompt: 'A participation-of-volume (POV) algorithm trades ' + tex(dec(rate * 100) + '\\%') + ' of market volume. The market trades ' + tex(vol) + ' shares per minute. How many minutes does the whole order take? Give it to 4 decimal places.',
        answer: minutes, tolerance: tol4, lecture: 10,
        explanation: tex(Q + '/(' + dec(rate) + '\\times' + vol + ')=' + dec(minutes)) + ' minutes.',
      },
      {
        prompt: 'For live risk monitoring, the portfolio is worth ' + tex(pos) + ' dollars with daily return standard deviation ' + tex(dec(sigma * 100) + '\\%') + '. Using the normal quantile 2.326, find the one-day 99% value at risk in dollars. Give it to 2 decimal places.',
        answer: var99, tolerance: tol2, lecture: 11,
        explanation: tex('2.326\\times' + dec(sigma) + '\\times' + pos + '=' + dec(var99)) + '.',
      },
      {
        prompt: 'The account peaked at ' + tex(peak) + ' and is now at ' + tex(eq) + ' (thousand dollars). A kill switch halts trading at a drawdown of ' + tex(dec(limit * 100) + '\\%') + '. How much more drawdown (as a fraction of the peak) is left before it triggers?',
        answer: buffer, tolerance: tol4, lecture: 11,
        explanation: 'Current drawdown ' + tex('1-' + eq + '/' + peak + '=' + dec(dd)) + '; buffer ' + tex(dec(limit) + '-' + dec(dd) + '=' + dec(buffer)) + '.',
      },
    ],
  }
}

export const genH: LQGenerator = { id: 'algo-lq-h-execution', generate: (rng) => build(sample(rng)) }
