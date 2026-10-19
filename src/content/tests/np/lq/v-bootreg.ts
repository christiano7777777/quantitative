// LQ-V: bootstrap for regression (paired and residual), a bootstrap p-value, and the sample maximum where the bootstrap fails.
// Lecture 16 (bootstrap for regression, hypothesis testing and failures).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { x: number[]; y: number[]; pick: number[]; stat: number; reps: number[]; nmax: number }

export function sample(rng: Rng): Params {
  const n = 5
  for (;;) {
    const x = rng.shuffle([1, 2, 3, 4, 5, 6]).slice(0, n)
    const y = x.map((v) => Math.round(v * 1.5 + 2 + rng.int(-3, 3)))
    const pick = Array.from({ length: n }, () => rng.int(0, n - 1))
    if (new Set(pick).size >= 3 && new Set(pick.map((i) => x[i])).size >= 2) {
      const reps = Array.from({ length: 19 }, () => rng.int(-250, 250) / 100)
      if (new Set(reps).size === 19) return { x, y, pick, stat: rng.int(80, 210) / 100, reps, nmax: rng.pick([4, 5, 6]) }
    }
  }
}

export function slope(x: number[], y: number[]): number {
  const n = x.length
  const mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n
  return x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0) / x.reduce((s, v) => s + (v - mx) ** 2, 0)
}

export function build({ x, y, pick, stat, reps, nmax }: Params): LQInstance {
  const n = x.length
  const b1 = slope(x, y)
  const mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n
  const b0 = my - b1 * mx
  const res = y.map((v, i) => v - (b0 + b1 * x[i]))
  const bp = slope(pick.map((i) => x[i]), pick.map((i) => y[i]))
  const cnt = reps.filter((r) => r >= stat).length
  const pval = (1 + cnt) / (reps.length + 1)
  const pm = 1 - (1 - 1 / nmax) ** nmax

  return {
    intro: 'Five observations ' + tex('(x_i,y_i)') + ' are ' + tex(x.map((v, i) => '(' + v + ',' + y[i] + ')').join(',\\ ')) + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the least squares slope ' + tex('\\hat\\beta_1=\\sum(x_i-\\bar x)(y_i-\\bar y)/\\sum(x_i-\\bar x)^2') + '.',
        answer: b1, tolerance: tol4, lecture: 16,
        explanation: tex('\\bar x=' + dec(mx) + ',\\ \\bar y=' + dec(my)) + ', so ' + tex('\\hat\\beta_1=' + dec(x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0)) + '/' + dec(x.reduce((s, v) => s + (v - mx) ** 2, 0))) + ' = ' + dec(b1) + '.',
      },
      {
        prompt: 'In the residual bootstrap one resamples the residuals ' + tex('e_i=y_i-\\hat\\beta_0-\\hat\\beta_1x_i') + ' (with ' + tex('\\hat\\beta_0=\\bar y-\\hat\\beta_1\\bar x') + '). Find the residual ' + tex('e_1') + ' of the first observation.',
        answer: res[0], tolerance: tol4, lecture: 16,
        explanation: tex('\\hat\\beta_0=' + dec(b0)) + ', so ' + tex('e_1=' + y[0] + '-(' + dec(b0) + '+' + dec(b1) + '\\times' + x[0] + ')') + ' = ' + dec(res[0]) + '.',
      },
      {
        prompt: 'In the paired bootstrap whole pairs are resampled. A resample picks observations number ' + tex(pick.map((i) => i + 1).join(',\\ ')) + ' (in the order listed above, counting from 1). Find the least squares slope of this resample.',
        answer: bp, tolerance: tol4, lecture: 16,
        explanation: 'The resampled pairs are ' + tex(pick.map((i) => '(' + x[i] + ',' + y[i] + ')').join(',\\ ')) + '. Their slope is ' + dec(bp) + ', which differs from ' + dec(b1) + ' because some pairs appear twice and others not at all.',
      },
      {
        prompt: 'A bootstrap test gave the observed statistic ' + tex('t_{\\text{obs}}=' + dec(stat)) + ' and ' + tex('B=19') + ' statistics from resamples drawn under ' + tex('H_0') + ': ' + tex(reps.map(dec).join(',\\ ')) + '. Find the one-sided p-value ' + tex('(1+\\#\\{t^*_b\\ge t_{\\text{obs}}\\})/(B+1)') + '.',
        answer: pval, tolerance: tol4, lecture: 16,
        explanation: cnt + ' of the ' + tex('19') + ' values are at least ' + dec(stat) + ', so ' + tex('p=(1+' + cnt + ')/20') + ' = ' + dec(pval) + '.',
      },
      {
        prompt: 'The bootstrap fails for the sample maximum. In a resample of size ' + tex(nmax) + ' from ' + tex(nmax) + ' distinct values, find the probability that the resample contains the original sample maximum, ' + tex('1-(1-1/n)^n') + '.',
        answer: pm, tolerance: tol4, lecture: 16,
        explanation: tex('1-(1-1/' + nmax + ')^{' + nmax + '}') + ' = ' + dec(pm) + '. The bootstrap distribution of the maximum puts this much mass exactly at the observed maximum, while the true distribution of the maximum of a continuous sample has no atoms.',
      },
    ],
  }
}

export const genV: LQGenerator = { id: 'np-lq-v-bootreg', generate: (rng) => build(sample(rng)) }
