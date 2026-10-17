// LQ-A: replication and a one-way ANOVA table by hand, ending with Fisher's LSD threshold.
// Lectures 1 (replication) and 2 (one-way ANOVA, multiple comparisons).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol2, tol3, tolInt } from '../../../shared/format'

export interface Params { k: number; n: number; y: number[][]; sigma2: number; s: number }

/** 97.5% points of the t distribution for the error degrees of freedom that occur (k in {3,4}, n in {4,5}). */
export const T_CRIT: Record<number, number> = { 9: 2.262, 12: 2.179, 16: 2.12 }

export function sample(rng: Rng): Params {
  const k = rng.pick([3, 4])
  const n = rng.pick([4, 5])
  const base = rng.int(15, 30)
  const y = Array.from({ length: k }, () => {
    const off = rng.int(-4, 6)
    return Array.from({ length: n }, () => base + off + rng.int(-4, 4))
  })
  return { k, n, y, sigma2: rng.int(4, 16), s: rng.pick([1, 1.5, 2]) }
}

export function build({ k, n, y, sigma2, s }: Params): LQInstance {
  const N = k * n
  const sum = (v: number[]) => v.reduce((a, b) => a + b, 0)
  const means = y.map((r) => sum(r) / n)
  const grand = sum(y.flat()) / N
  const ssb = n * sum(means.map((m) => (m - grand) ** 2))
  const sse = sum(y.map((r, i) => sum(r.map((v) => (v - means[i]) ** 2))))
  const msb = ssb / (k - 1)
  const mse = sse / (N - k)
  const F = msb / mse
  const df = N - k
  const t = T_CRIT[df]
  const lsd = t * Math.sqrt((2 * mse) / n)
  const nReq = Math.ceil((2 * sigma2) / (s * s) - 1e-9)

  const rows = y.map((r, i) => 'group ' + (i + 1) + ': ' + r.join(', ')).join('; ')
  return {
    intro:
      'A completely randomised experiment assigns ' + tex(N) + ' experimental units to ' + tex(k) + ' treatments, ' + tex(n) + ' units each. The responses are: ' + rows + '. Do not round intermediate values; give answers to 2 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Before running the experiment, a pilot suggests the error variance is ' + tex('\\sigma^2=' + sigma2) + ' per unit. How many units per treatment are needed so that the standard error of the difference of two treatment means, ' + tex('\\sqrt{2\\sigma^2/n}') + ', is at most ' + tex(dec(s)) + '? Round up to a whole number.',
        answer: nReq, tolerance: tolInt, lecture: 1,
        explanation: tex('2\\sigma^2/n\\le ' + dec(s * s)) + ' gives ' + tex('n\\ge ' + dec((2 * sigma2) / (s * s))) + ', so ' + tex('n=' + nReq) + ' units per treatment. Replication means independent experimental units, not repeated readings.',
      },
      {
        prompt: 'Find the between-treatments sum of squares ' + tex('SS_B=n\\sum_i(\\bar y_{i\\cdot}-\\bar y_{\\cdot\\cdot})^2') + ' for the data above.',
        answer: ssb, tolerance: tol2, lecture: 2,
        explanation: 'Group means ' + tex(means.map(dec).join(',')) + ', grand mean ' + tex(dec(grand)) + '. Then ' + tex('SS_B=' + dec(ssb)) + ' on ' + tex(k - 1) + ' degrees of freedom.',
      },
      {
        prompt: 'Find the within-treatments (error) sum of squares ' + tex('SS_W=\\sum_{i,j}(y_{ij}-\\bar y_{i\\cdot})^2') + '.',
        answer: sse, tolerance: tol2, lecture: 2,
        explanation: 'Sum the squared deviations from each group mean: ' + tex('SS_W=' + dec(sse)) + ' on ' + tex(N - k) + ' degrees of freedom, so ' + tex('MS_W=' + dec(mse)) + '.',
      },
      {
        prompt: 'Find the ' + tex('F') + ' statistic ' + tex('F=MS_B/MS_W') + ' (3 decimal places). Do not round the mean squares.',
        answer: F, tolerance: tol3, lecture: 2,
        explanation: tex('MS_B=' + dec(msb) + ',\\ MS_W=' + dec(mse) + ',\\ F=' + dec(F)) + ' on ' + tex(k - 1) + ' and ' + tex(N - k) + ' degrees of freedom.',
      },
      {
        prompt: 'Fisher\'s least significant difference at the 5% level is ' + tex('t_{0.975,\\,' + df + '}\\sqrt{2MS_W/n}') + ' with ' + tex('t_{0.975,\\,' + df + '}=' + dec(t)) + '. Two treatment means differ significantly if they are further apart than this. Find it (3 decimal places).',
        answer: lsd, tolerance: tol3, lecture: 2,
        explanation: tex(dec(t) + '\\sqrt{2\\times' + dec(mse) + '/' + n + '}=' + dec(lsd)) + '. With many pairs the unadjusted LSD raises the familywise error rate; Tukey or Bonferroni widen it.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'exp-lq-a-anova', generate: (rng) => build(sample(rng)) }
