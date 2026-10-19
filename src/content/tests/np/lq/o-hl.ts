// LQ-O: Mann-Whitney U, its normal approximation, the Hodges-Lehmann shift estimate and an interval end from pairwise differences.
// Lecture 5 (Mann-Whitney test, Hodges-Lehmann estimate).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { x: number[]; y: number[]; k: number }

export function sample(rng: Rng): Params {
  const m = rng.pick([4, 5]), n = rng.pick([4, 5])
  const pool = rng.sample(Array.from({ length: 40 }, (_, i) => i + 1), m + n)
  const x = pool.slice(0, m).map((v) => v + 4) // shift X upward a little so U is usually above its mean
  const y = pool.slice(m)
  const all = [...x, ...y]
  if (new Set(all).size < all.length) return sample(rng)
  return { x, y, k: rng.int(3, 5) }
}

export function build({ x, y, k }: Params): LQInstance {
  const m = x.length, n = y.length
  let U = 0
  for (const a of x) for (const b of y) if (a > b) U++
  const z = (U - (m * n) / 2) / Math.sqrt((m * n * (m + n + 1)) / 12)
  const diffs: number[] = []
  for (const a of x) for (const b of y) diffs.push(a - b)
  diffs.sort((p, q) => p - q)
  const N = diffs.length
  const hl = N % 2 ? diffs[(N - 1) / 2] : (diffs[N / 2 - 1] + diffs[N / 2]) / 2
  const dk = diffs[k - 1]
  const prob = U / (m * n)

  return {
    intro: 'Sample 1 is ' + tex('X:\\ ' + x.join(',\\ ')) + ' (' + tex('m=' + m) + ') and sample 2 is ' + tex('Y:\\ ' + y.join(',\\ ')) + ' (' + tex('n=' + n) + '). All values are distinct. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the Mann-Whitney statistic ' + tex('U_1') + ', the number of pairs ' + tex('(i,j)') + ' with ' + tex('X_i>Y_j') + '. Give a whole number.',
        answer: U, tolerance: tolInt, lecture: 2,
        explanation: 'Count, for each ' + tex('X_i') + ', the ' + tex('Y') + ' values below it: ' + x.map((a) => a + ':' + y.filter((b) => a > b).length).join(', ') + '. The total is ' + tex('U_1=' + U) + '.',
      },
      {
        prompt: 'Find the normal approximation ' + tex('z=(U_1-mn/2)/\\sqrt{mn(m+n+1)/12}') + '.',
        answer: z, tolerance: tol4, lecture: 2,
        explanation: tex('mn/2=' + dec((m * n) / 2)) + ' and ' + tex('\\sqrt{' + m * n + '\\times' + (m + n + 1) + '/12}=' + dec(Math.sqrt((m * n * (m + n + 1)) / 12))) + ', so ' + tex('z=(' + U + '-' + dec((m * n) / 2) + ')/' + dec(Math.sqrt((m * n * (m + n + 1)) / 12))) + ' = ' + dec(z) + '.',
      },
      {
        prompt: 'The Hodges-Lehmann estimate of the shift ' + tex('\\Delta') + ' (' + tex('X') + ' relative to ' + tex('Y') + ') is the median of the ' + tex('mn=' + m * n) + ' differences ' + tex('X_i-Y_j') + '. Find it.',
        answer: hl, tolerance: tol4, lecture: 2,
        explanation: 'The sorted differences are ' + diffs.join(', ') + '. Their median (' + (N % 2 ? 'the middle one' : 'the average of the two middle ones') + ') is ' + dec(hl) + '.',
      },
      {
        prompt: 'A confidence interval for ' + tex('\\Delta') + ' runs from the ' + tex('k') + '-th smallest to the ' + tex('k') + '-th largest of the ' + tex('mn') + ' differences. With ' + tex('k=' + k) + ', find the lower end ' + tex('D_{(' + k + ')}') + '.',
        answer: dk, tolerance: tol4, lecture: 2,
        explanation: 'In the sorted list of differences the ' + tex(k) + '-th smallest is ' + dk + '. The upper end is the ' + tex(k) + '-th largest, ' + diffs[N - k] + '.',
      },
      {
        prompt: 'Find the estimate ' + tex('U_1/(mn)') + ' of ' + tex('P(X>Y)') + '.',
        answer: prob, tolerance: tol4, lecture: 2,
        explanation: tex(U + '/' + m * n) + ' = ' + dec(prob) + '. A value of ' + dec(0.5) + ' would mean neither sample tends to be larger.',
      },
    ],
  }
}

export const genO: LQGenerator = { id: 'np-lq-o-hl', generate: (rng) => build(sample(rng)) }
