// LQ-G: turnover and trading costs of a rebalance, net return, break-even cost, and decay of an alpha with a given half-life.
// Lectures 8 (transaction costs and turnover) and 9 (factor decay).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params { oldW: number[]; newW: number[]; cost: number; gross: number; alpha0: number; half: number; years: number }

export function sample(rng: Rng): Params {
  const draw = () => { const c = [rng.int(5, 25), rng.int(5, 25), rng.int(5, 25)]; return [...c, 100 - c[0] - c[1] - c[2]] }
  return { oldW: draw(), newW: draw(), cost: rng.pick([5, 10, 20, 30]), gross: rng.int(30, 120) / 10, alpha0: rng.pick([4, 5, 6, 8]), half: rng.pick([2, 3, 4, 5]), years: rng.pick([1, 2, 3, 6]) }
}

export function build({ oldW, newW, cost, gross, alpha0, half, years }: Params): LQInstance {
  const turn = newW.reduce((s, w, i) => s + Math.abs(w - oldW[i]), 0) / 100
  const costPct = (cost * turn) / 100
  const net = gross - costPct
  const be = (gross / turn) * 100
  const alpha = alpha0 * 0.5 ** (years / half)

  return {
    intro:
      'A portfolio of four assets is rebalanced from weights ' + tex('(' + oldW.join(',') + ')\\%') + ' to ' + tex('(' + newW.join(',') + ')\\%') + '. Trading costs ' + tex(cost) + ' basis points per unit of two-way turnover (turnover is the sum of absolute weight changes). Give answers to 3 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the two-way turnover ' + tex('\\sum_i|w_i^{new}-w_i^{old}|') + ' as a fraction of the portfolio.',
        answer: turn, tolerance: tol3, lecture: 8,
        explanation: tex(oldW.map((w, i) => '|' + newW[i] + '-' + w + '|').join('+') + '=' + turn * 100) + ' per cent, so ' + dec(turn) + '.',
      },
      {
        prompt: 'Find the trading cost of this rebalance as a percentage of portfolio value (1 basis point = 0.01%).',
        answer: costPct, tolerance: tol4, lecture: 8,
        explanation: tex(cost + '\\text{ bp}\\times' + dec(turn)) + ' = ' + dec(costPct) + '% (4 d.p.).',
      },
      {
        prompt: 'The strategy earns a gross return of ' + tex(dec(gross) + '\\%') + ' per period before this rebalance cost. Find the net return (per cent, 4 decimal places).',
        answer: net, tolerance: tol4, lecture: 8,
        explanation: tex(dec(gross) + '-' + dec(costPct)) + ' = ' + dec(net) + '.',
      },
      {
        prompt: 'Find the break-even cost per unit of turnover, in basis points: the cost at which the net return is zero (' + tex('\\text{gross}/\\text{turnover}') + ', 1 d.p.).',
        answer: be, tolerance: { abs: 0.05 }, lecture: 8,
        explanation: tex(dec(gross) + '\\%/' + dec(turn) + '=' + dec(gross / turn) + '\\%=' + dec(be) + '\\text{ bp}') + '.',
      },
      {
        prompt: 'A factor alpha of ' + tex(alpha0 + '\\%') + ' per year decays exponentially with a half-life of ' + tex(half) + ' years. Find the alpha (per cent) remaining after ' + tex(years) + ' years.',
        answer: alpha, tolerance: tol3, lecture: 9,
        explanation: tex(alpha0 + '\\cdot0.5^{' + years + '/' + half + '}') + ' = ' + dec(alpha) + '.',
      },
    ],
  }
}

export const genG: LQGenerator = { id: 'pf2-lq-g-costs', generate: (rng) => build(sample(rng)) }
