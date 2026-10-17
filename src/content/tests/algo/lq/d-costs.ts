// LQ-D: survivorship bias in a backtest and the effect of transaction costs and market impact on net returns.
// Lectures 5 (backtesting engine, biases) and 6 (transaction costs and slippage).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol2, tol4 } from '../../../shared/format'

export interface Params { surv: number[]; dead: number[]; gross: number; turnover: number; cost: number; y: number; sigma: number; part: number }

export function sample(rng: Rng): Params {
  return {
    surv: Array.from({ length: 8 }, () => rng.int(0, 250) / 10), dead: [rng.int(-80, -30), rng.int(-80, -30)],
    gross: rng.int(60, 200) / 10, turnover: rng.pick([6, 12, 24, 50]), cost: rng.pick([5, 10, 15, 20, 30]), y: rng.int(5, 15) / 10, sigma: rng.int(10, 30) / 10, part: rng.pick([1, 4, 9, 16, 25]),
  }
}

export function build({ surv, dead, gross, turnover, cost, y, sigma, part }: Params): LQInstance {
  const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length
  const biased = mean(surv)
  const truth = mean([...surv, ...dead])
  const net = gross - (turnover * cost) / 100
  const impact = y * sigma * Math.sqrt(part / 100)

  return {
    intro: 'A backtest universe had ten stocks over the year; two were delisted. The eight survivors returned ' + tex(surv.map(dec).join(',\\ ')) + ' (percent) and the two delisted stocks returned ' + tex(dead[0] + '\\%') + ' and ' + tex(dead[1] + '\\%') + '. Give answers to 4 decimal places except where stated.',
    parts: [
      {
        prompt: 'A backtest that only uses today\'s constituents sees just the survivors. Find the average return it reports, in percent.',
        answer: biased, tolerance: tol4, lecture: 5,
        explanation: 'Mean of the eight survivors: ' + tex(dec(biased) + '\\%') + '.',
      },
      {
        prompt: 'Find the true average return of all ten stocks that were investable, in percent.',
        answer: truth, tolerance: tol4, lecture: 5,
        explanation: tex('(' + dec(biased * 8) + '+' + (dead[0] + dead[1]) + ')/10=' + dec(truth) + '\\%') + '.',
      },
      {
        prompt: 'By how many percentage points does survivorship bias overstate the average return?',
        answer: biased - truth, tolerance: tol4, lecture: 5,
        explanation: tex(dec(biased) + '-' + dec(truth) + '=' + dec(biased - truth)) + '. A point-in-time universe including delisted names removes it.',
      },
      {
        prompt: 'A strategy earns ' + tex(dec(gross) + '\\%') + ' gross per year and trades ' + tex(turnover) + ' times its capital (one-way turnover) at a cost of ' + tex(cost) + ' basis points per unit traded. Find the net annual return in percent (' + tex('100\\text{ bp}=1\\%') + '). Give it to 2 decimal places.',
        answer: net, tolerance: tol2, lecture: 6,
        explanation: 'Cost drag ' + tex(turnover + '\\times' + cost + '\\text{ bp}=' + dec((turnover * cost) / 100) + '\\%') + ', so net ' + tex(dec(gross) + '-' + dec((turnover * cost) / 100) + '=' + dec(net) + '\\%') + '.',
      },
      {
        prompt: 'Square-root market impact is ' + tex('Y\\sigma\\sqrt{Q/V}') + '. With ' + tex('Y=' + dec(y)) + ', daily volatility ' + tex('\\sigma=' + dec(sigma) + '\\%') + ' and an order equal to ' + tex(part + '\\%') + ' of daily volume, find the expected impact in percent. Give it to 4 decimal places.',
        answer: impact, tolerance: tol4, lecture: 6,
        explanation: tex(dec(y) + '\\times' + dec(sigma) + '\\%\\times\\sqrt{' + dec(part / 100) + '}=' + dec(impact) + '\\%') + '. Impact grows with the square root of size, so doubling an order does not double its cost per share.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'algo-lq-d-costs', generate: (rng) => build(sample(rng)) }
