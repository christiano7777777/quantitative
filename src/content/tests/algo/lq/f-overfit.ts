// LQ-F: overfitting control: annualised Sharpe from monthly figures, its t-statistic, a Bonferroni multiple-testing adjustment and walk-forward window counts.
// Lecture 8.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { mean: number; sd: number; years: number; p: number; trials: number; total: number; train: number; test: number; step: number }

export function sample(rng: Rng): Params {
  const train = rng.pick([36, 48, 60]), test = rng.pick([6, 12]), step = rng.pick([6, 12])
  return { mean: rng.int(3, 15) / 10, sd: rng.int(20, 50) / 10, years: rng.int(3, 15), p: rng.int(1, 40) / 1000, trials: rng.pick([5, 10, 20, 50]), total: train + test + step * rng.int(2, 8) + rng.int(0, step - 1), train, test, step }
}

export function build({ mean, sd, years, p, trials, total, train, test, step }: Params): LQInstance {
  const sr = (mean / sd) * Math.sqrt(12)
  const t = sr * Math.sqrt(years)
  const adj = Math.min(1, trials * p)
  const windows = Math.floor((total - train - test) / step) + 1
  const need = 2 / Math.sqrt(years)

  return {
    intro: 'A backtest has monthly mean return ' + tex(dec(mean) + '\\%') + ' and monthly standard deviation ' + tex(dec(sd) + '\\%') + ' over ' + tex(years) + ' years. Give answers to 4 decimal places except the integer.',
    parts: [
      {
        prompt: 'Find the annualised Sharpe ratio (zero risk-free rate), ' + tex('\\dfrac{\\text{mean}}{\\text{sd}}\\sqrt{12}') + '.',
        answer: sr, tolerance: tol4, lecture: 8,
        explanation: tex('(' + dec(mean) + '/' + dec(sd) + ')\\sqrt{12}=' + dec(sr)) + '.',
      },
      {
        prompt: 'The t-statistic of the mean return is approximately ' + tex('\\mathrm{SR}_{\\text{ann}}\\sqrt{\\text{years}}') + '. Find it.',
        answer: t, tolerance: tol4, lecture: 8,
        explanation: tex(dec(sr) + '\\times\\sqrt{' + years + '}=' + dec(t)) + '.',
      },
      {
        prompt: 'You tried ' + tex(trials) + ' strategy variants and the best has a single-test p-value of ' + tex(dec(p)) + '. Find the Bonferroni-adjusted p-value ' + tex('\\min(1,\\,N p)') + '.',
        answer: adj, tolerance: tol4, lecture: 8,
        explanation: tex('\\min(1,' + trials + '\\times' + dec(p) + ')=' + dec(adj)) + '. Reporting only the best of many trials without this adjustment overstates significance.',
      },
      {
        prompt: 'A walk-forward test uses a training window of ' + tex(train) + ' months, then tests on the next ' + tex(test) + ' months, and rolls forward by ' + tex(step) + ' months each time. With ' + tex(total) + ' months of data, how many complete train-test windows fit? (An integer.)',
        answer: windows, tolerance: tolInt, lecture: 8,
        explanation: tex('\\lfloor(' + total + '-' + train + '-' + test + ')/' + step + '\\rfloor+1=' + windows) + '.',
      },
      {
        prompt: 'Over ' + tex(years) + ' years, what annualised Sharpe ratio is needed for a t-statistic of 2, ' + tex('2/\\sqrt{\\text{years}}') + '?',
        answer: need, tolerance: tol4, lecture: 8,
        explanation: tex('2/\\sqrt{' + years + '}=' + dec(need)) + '. Short histories need very high Sharpe ratios to be distinguishable from luck.',
      },
    ],
  }
}

export const genF: LQGenerator = { id: 'algo-lq-f-overfit', generate: (rng) => build(sample(rng)) }
