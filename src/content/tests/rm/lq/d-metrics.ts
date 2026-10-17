// LQ-D: performance metrics from eight monthly returns: Sharpe, maximum drawdown, Sortino, information ratio, cumulative return.
// Lecture 6 (performance metrics).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params { r: number[]; b: number[] } // tenths of a percent

export function sample(rng: Rng): Params {
  for (;;) {
    const r = Array.from({ length: 8 }, () => rng.int(-40, 60))
    const b = Array.from({ length: 8 }, () => rng.int(-30, 40))
    if (r.some((v) => v < 0) && r.some((v) => v > 0)) return { r, b }
  }
}

const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length
const sd = (a: number[]) => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)) }

export function build({ r, b }: Params): LQInstance {
  const R = r.map((v) => v / 100), B = b.map((v) => v / 100)
  const sharpe = (mean(R) / sd(R)) * Math.sqrt(12)
  let wealth = 1, peak = 1, mdd = 0
  for (const x of R) { wealth *= 1 + x; peak = Math.max(peak, wealth); mdd = Math.max(mdd, 1 - wealth / peak) }
  const dd = Math.sqrt(R.reduce((s, v) => s + Math.min(v, 0) ** 2, 0) / R.length)
  const sortino = (mean(R) / dd) * Math.sqrt(12)
  const act = R.map((v, i) => v - B[i])
  const ir = (mean(act) / sd(act)) * Math.sqrt(12)
  const cum = wealth - 1
  const pct = (a: number[]) => a.map((v) => dec(v / 10)).join(', ')

  return {
    intro:
      'A strategy returned (per cent per month) ' + pct(r) + ' over eight months, against a benchmark that returned ' + pct(b) + '. Take the risk-free rate as zero. Give answers to 3 decimal places and do not round intermediate values.',
    parts: [
      {
        prompt: 'Find the annualised Sharpe ratio ' + tex('\\sqrt{12}\\,\\bar r/s') + ', with ' + tex('s') + ' the sample standard deviation (divisor 7).',
        answer: sharpe, tolerance: tol3, lecture: 6,
        explanation: tex('\\bar r=' + dec(mean(R)) + ',\\ s=' + dec(sd(R))) + ', so ' + tex('\\sqrt{12}\\cdot' + dec(mean(R)) + '/' + dec(sd(R))) + ' = ' + dec(sharpe) + '.',
      },
      {
        prompt: 'Find the maximum drawdown of cumulative wealth (starting from 1), as a fraction.',
        answer: mdd, tolerance: tol3, lecture: 6,
        explanation: 'Track wealth ' + tex('W_t=\\prod(1+r_s)') + ' and its running peak; the largest ' + tex('1-W_t/\\text{peak}') + ' is ' + dec(mdd) + '.',
      },
      {
        prompt: 'Find the annualised Sortino ratio ' + tex('\\sqrt{12}\\,\\bar r/\\sigma_d') + ', with downside deviation ' + tex('\\sigma_d=\\sqrt{\\frac1n\\sum\\min(r_t,0)^2}') + ' (divisor 8, target zero).',
        answer: sortino, tolerance: tol3, lecture: 6,
        explanation: tex('\\sigma_d=' + dec(dd)) + ', so the ratio is ' + tex('\\sqrt{12}\\cdot' + dec(mean(R)) + '/' + dec(dd)) + ' = ' + dec(sortino) + '.',
      },
      {
        prompt: 'Find the annualised information ratio: ' + tex('\\sqrt{12}') + ' times the mean active return (strategy minus benchmark) divided by the standard deviation of active returns (divisor 7).',
        answer: ir, tolerance: tol3, lecture: 6,
        explanation: 'Active returns have mean ' + dec(mean(act)) + ' and standard deviation ' + dec(sd(act)) + ', so ' + tex('IR=' + dec(ir)) + '.',
      },
      {
        prompt: 'Find the cumulative return over the eight months, ' + tex('\\prod(1+r_t)-1') + ', as a fraction.',
        answer: cum, tolerance: tol3, lecture: 6,
        explanation: 'Final wealth ' + dec(wealth) + ', so the cumulative return is ' + dec(cum) + '.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'rm-lq-d-metrics', generate: (rng) => build(sample(rng)) }
