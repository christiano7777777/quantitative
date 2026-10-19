// LQ-U: the bootstrap-t interval for a mean (from 19 studentised replicates) and the BCa adjusted levels.
// Lecture 15 (bootstrap intervals: pivotal and BCa).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { x: number[]; ts: number[]; z0: number; a: number }

export function sample(rng: Rng): Params {
  const n = rng.pick([6, 8])
  const x = Array.from({ length: n }, () => rng.int(20, 60))
  for (;;) {
    const ts = Array.from({ length: 19 }, () => rng.int(-300, 320) / 100)
    if (new Set(ts).size === 19) return { x, ts, z0: rng.pick([0.05, 0.1, 0.15, 0.2, -0.1]), a: rng.pick([0.02, 0.04, 0.05, 0.06]) }
  }
}

export function build({ x, ts, z0, a }: Params): LQInstance {
  const n = x.length
  const mean = x.reduce((s, v) => s + v, 0) / n
  const s = Math.sqrt(x.reduce((q, v) => q + (v - mean) ** 2, 0) / (n - 1))
  const se = s / Math.sqrt(n)
  const sorted = [...ts].sort((p, q) => p - q)
  const lo = mean - sorted[18] * se // uses the 95th percentile of t*
  const hi = mean - sorted[0] * se // uses the 5th percentile of t*
  const z = 1.645
  const argU = z0 + (z0 + z) / (1 - a * (z0 + z))
  const argL = z0 + (z0 - z) / (1 - a * (z0 - z))

  return {
    intro: 'A sample of ' + tex('n=' + n) + ' values is ' + tex(x.join(',\\ ')) + '. In each of ' + tex('B=19') + ' bootstrap resamples the studentised statistic ' + tex('t^*_b=(\\bar X^*_b-\\bar x)/(S^*_b/\\sqrt n)') + ' was computed, giving ' + tex(ts.map(dec).join(',\\ ')) + '. For a 90% interval the 5th and 95th percentiles of the ' + tex('t^*_b') + ' are the smallest and the largest of them (the ' + tex('(B+1)p') + '-th smallest value). Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the estimated standard error ' + tex('S/\\sqrt n') + ' of the sample mean (sample standard deviation with divisor ' + tex('n-1') + ').',
        answer: se, tolerance: tol4, lecture: 8,
        explanation: tex('\\bar x=' + dec(mean) + ',\\ S=' + dec(s)) + ', so ' + tex('S/\\sqrt{' + n + '}') + ' = ' + dec(se) + '.',
      },
      {
        prompt: 'The bootstrap-t interval is ' + tex('(\\bar x-t^*_{0.95}\\,S/\\sqrt n,\\ \\bar x-t^*_{0.05}\\,S/\\sqrt n)') + '. Find its lower end.',
        answer: lo, tolerance: tol4, lecture: 8,
        explanation: tex('t^*_{0.95}') + ' is the largest replicate, ' + dec(sorted[18]) + ', so the lower end is ' + tex(dec(mean) + '-' + dec(sorted[18]) + '\\times' + dec(se)) + ' = ' + dec(lo) + '. The percentiles are used in reversed order because of the minus sign.',
      },
      {
        prompt: 'Find the upper end of the bootstrap-t interval.',
        answer: hi, tolerance: tol4, lecture: 8,
        explanation: tex('t^*_{0.05}') + ' is the smallest replicate, ' + dec(sorted[0]) + ', so the upper end is ' + tex(dec(mean) + '-(' + dec(sorted[0]) + ')\\times' + dec(se)) + ' = ' + dec(hi) + '.',
      },
      {
        prompt: 'For a BCa interval let ' + tex('\\hat z_0=' + dec(z0)) + ' (bias) and ' + tex('\\hat a=' + dec(a)) + ' (acceleration), and ' + tex('z_{\\alpha/2}=1.645') + '. The upper limit is the bootstrap percentile at level ' + tex('\\Phi(u)') + ' with ' + tex('u=\\hat z_0+\\dfrac{\\hat z_0+z_{\\alpha/2}}{1-\\hat a(\\hat z_0+z_{\\alpha/2})}') + '. Find ' + tex('u') + '.',
        answer: argU, tolerance: tol4, lecture: 8,
        explanation: tex('\\hat z_0+z_{\\alpha/2}=' + dec(z0 + z)) + ', so ' + tex('u=' + dec(z0) + '+' + dec(z0 + z) + '/(1-' + dec(a) + '\\times' + dec(z0 + z) + ')') + ' = ' + dec(argU) + '. With ' + tex('\\hat z_0=\\hat a=0') + ' this would be just ' + tex('z_{\\alpha/2}=1.645') + ', the ordinary percentile interval.',
      },
      {
        prompt: 'The lower limit is the percentile at level ' + tex('\\Phi(v)') + ' with ' + tex('v=\\hat z_0+\\dfrac{\\hat z_0-z_{\\alpha/2}}{1-\\hat a(\\hat z_0-z_{\\alpha/2})}') + '. Find ' + tex('v') + '.',
        answer: argL, tolerance: tol4, lecture: 8,
        explanation: tex('\\hat z_0-z_{\\alpha/2}=' + dec(z0 - z)) + ', so ' + tex('v=' + dec(z0) + '+(' + dec(z0 - z) + ')/(1-' + dec(a) + '\\times(' + dec(z0 - z) + '))') + ' = ' + dec(argL) + '.',
      },
    ],
  }
}

export const genU: LQGenerator = { id: 'np-lq-u-pivotal', generate: (rng) => build(sample(rng)) }
