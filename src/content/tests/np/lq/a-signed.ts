// LQ-A: sign test and Wilcoxon signed-rank test on eight paired differences, and the sample size price of using ranks.
// Lectures 1 (why nonparametric: efficiency) and 2 (sign and signed-rank tests).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { d: number[]; nt: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const mags = rng.sample([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 8)
    const d = mags.map((m) => (rng.next() < 0.7 ? m : -m))
    const pos = d.filter((v) => v > 0).length
    if (pos >= 3 && pos <= 7) return { d: rng.shuffle(d), nt: rng.pick([50, 80, 100, 200]) }
  }
}

export function build({ d, nt }: Params): LQInstance {
  const n = d.length
  const pos = d.filter((v) => v > 0).length
  const k = Math.min(pos, n - pos)
  let tail = 0
  for (let j = 0; j <= k; j++) { let c = 1; for (let i = 1; i <= j; i++) c = (c * (n - j + i)) / i; tail += c / 2 ** n }
  const pSign = Math.min(1, 2 * tail)
  const order = [...d].sort((a, b) => Math.abs(a) - Math.abs(b))
  const wPlus = order.reduce((s, v, i) => s + (v > 0 ? i + 1 : 0), 0)
  const mean = (n * (n + 1)) / 4, sd = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24)
  const z = (wPlus - mean) / sd
  const nW = Math.ceil((nt * Math.PI) / 3)

  return {
    intro: 'Eight paired differences (after minus before) are ' + tex(d.join(', ')) + '. None is zero and no two have the same absolute value. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'How many of the differences are positive?',
        answer: pos, tolerance: tolInt, lecture: 10,
        explanation: 'Positive values: ' + d.filter((v) => v > 0).join(', ') + ' (' + pos + ' of 8).',
      },
      {
        prompt: 'Find the exact two-sided p-value of the sign test: ' + tex('2P(\\mathrm{Bin}(8,\\tfrac12)\\le\\min(\\#{+},\\#{-}))') + ' (capped at 1).',
        answer: pSign, tolerance: tol4, lecture: 10,
        explanation: 'The smaller count is ' + k + ', ' + tex('P(\\mathrm{Bin}(8,0.5)\\le' + k + ')=' + dec(tail)) + ', so ' + tex('p=' + dec(pSign)) + '.',
      },
      {
        prompt: 'Find the Wilcoxon signed-rank statistic ' + tex('W^+') + ': the sum of the ranks of the absolute differences belonging to the positive differences.',
        answer: wPlus, tolerance: tolInt, lecture: 10,
        explanation: 'Ordering by absolute value gives ranks 1 to 8; the positive differences have ranks ' + order.map((v, i) => (v > 0 ? i + 1 : 0)).filter((r) => r > 0).join(', ') + ', which sum to ' + wPlus + '.',
      },
      {
        prompt: 'Find the normal approximation ' + tex('z=(W^+-n(n+1)/4)/\\sqrt{n(n+1)(2n+1)/24}') + ' (no continuity correction).',
        answer: z, tolerance: tol4, lecture: 10,
        explanation: 'Mean ' + dec(mean) + ', standard deviation ' + dec(sd) + ', so ' + tex('z=(' + wPlus + '-' + dec(mean) + ')/' + dec(sd)) + ' = ' + dec(z) + '.',
      },
      {
        prompt: 'The Wilcoxon test has asymptotic relative efficiency ' + tex('3/\\pi') + ' against the ' + tex('t') + ' test for normal data. If the ' + tex('t') + ' test needs ' + tex(nt) + ' observations for a given power, how many does the Wilcoxon test need (' + tex('n_t\\cdot\\pi/3') + ', rounded up)?',
        answer: nW, tolerance: tolInt, lecture: 1,
        explanation: tex(nt + '\\cdot\\pi/3=' + dec(nt * Math.PI / 3)) + ', rounded up to ' + nW + ': only about 5% more data are needed.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'np-lq-a-signed', generate: (rng) => build(sample(rng)) }
