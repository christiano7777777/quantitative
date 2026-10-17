// LQ-G: differencing and the Dickey-Fuller regression of a random walk with drift (lecture 8), seasonal differencing (lecture 9).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params { x: number[] }

export function sample(rng: Rng): Params {
  for (;;) {
    const d = rng.pick([1, 2, 3])
    const x = [rng.int(5, 15)]
    for (let t = 1; t < 8; t++) x.push(x[t - 1] + d + rng.int(-3, 3))
    const diffs = x.slice(1).map((v, i) => v - x[i])
    if (Math.min(...x) >= 1 && new Set(diffs).size >= 4) return { x }
  }
}

export function build({ x }: Params): LQInstance {
  const dx = x.slice(1).map((v, i) => v - x[i])
  const drift = (x[7] - x[0]) / 7
  const d2 = x[7] - 2 * x[6] + x[5]
  let sxy = 0, sxx = 0
  for (let t = 1; t < 8; t++) { sxy += dx[t - 1] * x[t - 1]; sxx += x[t - 1] * x[t - 1] }
  const gam = sxy / sxx
  let rss = 0
  for (let t = 1; t < 8; t++) rss += (dx[t - 1] - gam * x[t - 1]) ** 2
  const se = Math.sqrt(rss / 6 / sxx)
  const tstat = gam / se
  const sd = x[7] - x[6] - x[3] + x[2]
  return {
    intro: 'A series of eight observations is ' + x.join(', ') + ' (in time order, ' + tex('x_1,\\dots,x_8') + '). Let ' + tex('\\nabla x_t=x_t-x_{t-1}') + ' and ' + tex('\\nabla_4x_t=x_t-x_{t-4}') + '. Give answers to 3 decimal places unless stated.',
    parts: [
      {
        prompt: 'Treat the series as a random walk with drift, ' + tex('\\nabla x_t=\\delta+e_t') + '. Estimate the drift ' + tex('\\delta') + ' by the mean of the seven first differences.',
        answer: drift, tolerance: tol3, lecture: 8,
        explanation: 'The differences are ' + dx.join(', ') + '; the mean telescopes to ' + tex('(x_8-x_1)/7=' + (x[7] - x[0]) + '/7') + ' = ' + dec(drift) + '.',
      },
      {
        prompt: 'Find the second difference ' + tex('\\nabla^2x_8=\\nabla x_8-\\nabla x_7') + '.',
        answer: d2, tolerance: tol3, lecture: 8,
        explanation: tex('\\nabla^2x_8=x_8-2x_7+x_6=' + x[7] + '-2\\cdot' + x[6] + '+' + x[5]) + ' = ' + d2 + '.',
      },
      {
        prompt: 'In the Dickey-Fuller regression without constant, ' + tex('\\nabla x_t=\\gamma x_{t-1}+e_t') + ' for ' + tex('t=2,\\dots,8') + ', find the least squares estimate ' + tex('\\hat\\gamma') + ' to 4 decimal places.',
        answer: gam, tolerance: tol4, lecture: 8,
        explanation: tex('\\hat\\gamma=\\sum\\nabla x_tx_{t-1}/\\sum x_{t-1}^2=' + sxy + '/' + sxx) + ' = ' + dec(gam) + '.',
      },
      {
        prompt: 'Find the Dickey-Fuller test statistic ' + tex('\\hat\\gamma/\\mathrm{se}(\\hat\\gamma)') + ', where ' + tex('\\mathrm{se}^2=s^2/\\sum x_{t-1}^2') + ' and ' + tex('s^2=\\mathrm{RSS}/(7-1)') + '. (It is compared with Dickey-Fuller critical values, not with a t table; the 5% value is about ' + tex('-1.95') + '.)',
        answer: tstat, tolerance: tol3, lecture: 8,
        explanation: tex('\\mathrm{RSS}=' + dec(rss) + ',\\ s^2=' + dec(rss / 6) + ',\\ \\mathrm{se}=' + dec(se)) + ', so the statistic is ' + dec(tstat) + (tstat > -1.95 ? ', above ' : ', below ') + tex('-1.95') + ': the unit root is ' + (tstat > -1.95 ? 'not rejected.' : 'rejected.'),
      },
      {
        prompt: 'Apply seasonal differencing with period 4 and then ordinary differencing, ' + tex('\\nabla\\nabla_4x_8') + '.',
        answer: sd, tolerance: tol3, lecture: 9,
        explanation: tex('\\nabla\\nabla_4x_t=x_t-x_{t-1}-x_{t-4}+x_{t-5}') + ', so at ' + tex('t=8') + ' it equals ' + tex(x[7] + '-' + x[6] + '-' + x[3] + '+' + x[2]) + ' = ' + sd + '.',
      },
    ],
  }
}

export const genG: LQGenerator = { id: 'ts1-lq-g-differencing', generate: (rng) => build(sample(rng)) }
