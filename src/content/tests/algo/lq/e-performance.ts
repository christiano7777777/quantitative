// LQ-E: performance evaluation from a short return history: Sharpe ratio, compounded return, maximum drawdown, Calmar ratio and turnover.
// Lecture 7.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { r: number[]; w0: number[]; w1: number[] }

export function sample(rng: Rng): Params {
  const split = (): number[] => { const a = rng.int(10, 60), b = rng.int(10, 100 - a - 10); return [a, b, 100 - a - b] }
  for (;;) {
    const r = Array.from({ length: 6 }, () => rng.int(-40, 60) / 10)
    const eq = r.reduce((e, v) => [...e, e[e.length - 1] * (1 + v / 100)], [1])
    if (new Set(r).size > 2 && r.some((v) => v < 0) && eq.slice(1).some((v, i) => v < Math.max(...eq.slice(0, i + 1)))) return { r, w0: split(), w1: split() }
  }
}

export function build({ r, w0, w1 }: Params): LQInstance {
  const n = r.length
  const mean = r.reduce((s, v) => s + v, 0) / n
  const sd = Math.sqrt(r.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1))
  const sharpe = (mean / sd) * Math.sqrt(12)
  const eq = [1]
  for (const v of r) eq.push(eq[eq.length - 1] * (1 + v / 100))
  const total = eq[n] - 1
  let peak = 1, mdd = 0
  for (const e of eq) { peak = Math.max(peak, e); mdd = Math.max(mdd, 1 - e / peak) }
  const calmar = (mean * 12) / 100 / mdd
  const turn = w0.reduce((s, v, i) => s + Math.abs(v - w1[i]), 0) / 2 / 100

  return {
    intro: 'A strategy\'s monthly returns (percent) over six months are ' + tex(r.map(dec).join(',\\ ')) + '. The risk-free rate is zero. Give answers to 4 decimal places (fractions, not percentages, for the last three).',
    parts: [
      {
        prompt: 'Find the annualised Sharpe ratio ' + tex('\\dfrac{\\bar r}{s}\\sqrt{12}') + ' using the sample standard deviation (divisor ' + tex('n-1') + ').',
        answer: sharpe, tolerance: tol4, lecture: 7,
        explanation: tex('\\bar r=' + dec(mean) + ',\\ s=' + dec(sd) + ',\\ (' + dec(mean) + '/' + dec(sd) + ')\\sqrt{12}=' + dec(sharpe)) + '.',
      },
      {
        prompt: 'Find the total compounded return over the six months, as a fraction.',
        answer: total, tolerance: tol4, lecture: 7,
        explanation: tex('\\prod(1+r_t)-1=' + dec(eq[n]) + '-1=' + dec(total)) + '.',
      },
      {
        prompt: 'Find the maximum drawdown (the largest fall from a running peak of the compounded equity curve, starting from 1), as a fraction.',
        answer: mdd, tolerance: tol4, lecture: 7,
        explanation: 'Equity path ' + tex(eq.map(dec).join(',\\ ')) + '; the largest peak-to-trough fall is ' + tex(dec(mdd)) + '.',
      },
      {
        prompt: 'Find the Calmar ratio: the arithmetic annualised return ' + tex('12\\bar r') + ' (as a fraction) divided by the maximum drawdown.',
        answer: calmar, tolerance: tol4, lecture: 7,
        explanation: tex(dec(mean * 12 / 100) + '/' + dec(mdd) + '=' + dec(calmar)) + '.',
      },
      {
        prompt: 'The three-asset portfolio rebalances from weights ' + tex('(' + w0.join(',') + ')\\%') + ' to ' + tex('(' + w1.join(',') + ')\\%') + '. Find the one-way turnover ' + tex('\\tfrac12\\sum|\\Delta w_i|') + ' as a fraction.',
        answer: turn, tolerance: tol4, lecture: 7,
        explanation: tex('\\tfrac12(' + w0.map((v, i) => '|' + (w1[i] - v) + '|').join('+') + ')/100=' + dec(turn)) + '.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'algo-lq-e-performance', generate: (rng) => build(sample(rng)) }
