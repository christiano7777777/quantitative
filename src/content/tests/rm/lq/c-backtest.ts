// LQ-C: costs and capacity of a daily strategy: total cost, net mean return, annualised net return, break-even cost, capacity.
// Lecture 5 (backtesting: costs, slippage, capacity).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params { gross: number[]; turn: number[]; cost: number; part: number; adv: number } // gross in bp, turnover in %

export function sample(rng: Rng): Params {
  return { gross: Array.from({ length: 5 }, () => rng.int(-10, 25)), turn: Array.from({ length: 5 }, () => rng.int(10, 60)), cost: rng.pick([2, 3, 5, 8]), part: rng.pick([2, 5, 10]), adv: rng.pick([20, 50, 100, 200]) }
}

export function build({ gross, turn, cost, part, adv }: Params): LQInstance {
  const sumT = turn.reduce((a, v) => a + v, 0) / 100
  const totalCost = cost * sumT
  const sumG = gross.reduce((a, v) => a + v, 0)
  const netMean = (sumG - totalCost) / 5
  const annual = (netMean * 252) / 100
  const be = sumG / sumT
  const meanTurn = sumT / 5
  const aum = (part / 100) * adv / meanTurn

  return {
    intro:
      'A daily strategy earns gross returns (basis points) ' + tex(gross.join(',')) + ' over five days, with daily turnover (per cent of the portfolio) ' + tex(turn.join(',')) + '. Each unit of turnover costs ' + tex(cost) + ' basis points. Give answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the total cost over the five days, in basis points (cost per unit turnover times total turnover).',
        answer: totalCost, tolerance: tol3, lecture: 5,
        explanation: tex('\\sum\\text{turnover}=' + dec(sumT) + ',\\ ' + cost + '\\cdot' + dec(sumT)) + ' = ' + dec(totalCost) + ' bp.',
      },
      {
        prompt: 'Find the mean net daily return in basis points.',
        answer: netMean, tolerance: tol3, lecture: 5,
        explanation: tex('(' + sumG + '-' + dec(totalCost) + ')/5') + ' = ' + dec(netMean) + ' bp.',
      },
      {
        prompt: 'Annualise the mean net daily return by multiplying by 252, and express it in per cent (100 bp = 1%).',
        answer: annual, tolerance: tol3, lecture: 5,
        explanation: tex(dec(netMean) + '\\cdot252/100') + ' = ' + dec(annual) + '%.',
      },
      {
        prompt: 'Find the break-even cost per unit of turnover in basis points: the cost that makes total net return zero.',
        answer: be, tolerance: tol3, lecture: 5,
        explanation: tex(sumG + '/' + dec(sumT)) + ' = ' + dec(be) + ' bp' + (be < cost ? ': below the assumed cost, so the strategy loses money net of costs.' : '.'),
      },
      {
        prompt: 'Suppose the strategy may trade at most ' + tex(part + '\\%') + ' of the average daily volume (ADV) of ' + tex(adv) + ' million dollars of its book. With the average daily turnover above, what is the largest portfolio size (in millions of dollars) it can run? (' + tex('\\text{AUM}=\\text{participation}\\times\\text{ADV}/\\text{average turnover}') + ')',
        answer: aum, tolerance: tol3, lecture: 5,
        explanation: tex(dec(part / 100) + '\\cdot' + adv + '/' + dec(meanTurn)) + ' = ' + dec(aum) + ' million dollars.',
      },
    ],
  }
}

export const genC: LQGenerator = { id: 'rm-lq-c-backtest', generate: (rng) => build(sample(rng)) }
