// LQ-D: Monte Carlo error and sample size, inverse transform sampling, and a self-normalised importance sampling estimate with its effective sample size.
// Lectures 6 (Monte Carlo basics) and 7 (importance sampling).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4, tolInt } from '../../../shared/format'

export interface Params { sd: number; n: number; eps: number; lam: number; u: number; p: number[]; q: number[]; f: number[] } // p,q in tenths (densities), f ints

export function sample(rng: Rng): Params {
  for (;;) {
    const sd = rng.pick([2, 3, 5, 10]), eps = rng.pick([0.05, 0.1, 0.2, 0.5])
    const need = ((1.96 * sd) / eps) ** 2
    if (Math.abs(need - Math.round(need)) > 0.01) return { sd, n: rng.pick([100, 400, 1000, 2500]), eps, lam: rng.pick([0.5, 1, 2]), u: rng.int(5, 95) / 100, p: Array.from({ length: 4 }, () => rng.int(2, 30)), q: Array.from({ length: 4 }, () => rng.int(2, 30)), f: Array.from({ length: 4 }, () => rng.int(1, 9)) }
  }
}

export function build({ sd, n, eps, lam, u, p, q, f }: Params): LQInstance {
  const se = sd / Math.sqrt(n)
  const need = Math.ceil(((1.96 * sd) / eps) ** 2)
  const x = -Math.log(u) / lam
  const w = p.map((v, i) => v / q[i])
  const sw = w.reduce((a, v) => a + v, 0)
  const est = w.reduce((a, v, i) => a + v * f[i], 0) / sw
  const ess = (sw * sw) / w.reduce((a, v) => a + v * v, 0)

  return {
    intro: 'Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'A Monte Carlo estimate averages ' + tex(n) + ' independent draws of a quantity with standard deviation ' + tex(sd) + '. Find its standard error ' + tex('\\sigma/\\sqrt n') + '.',
        answer: se, tolerance: tol4, lecture: 4,
        explanation: tex(sd + '/\\sqrt{' + n + '}') + ' = ' + dec(se) + '.',
      },
      {
        prompt: 'How many independent draws are needed so that the 95% error margin ' + tex('1.96\\sigma/\\sqrt n') + ' is at most ' + tex(dec(eps)) + ' (with ' + tex('\\sigma=' + sd) + ')? Give a whole number.',
        answer: need, tolerance: tolInt, lecture: 4,
        explanation: tex('n\\ge(1.96\\cdot' + sd + '/' + dec(eps) + ')^2=' + dec(((1.96 * sd) / eps) ** 2)) + ', rounded up to ' + need + '.',
      },
      {
        prompt: 'Use inverse transform sampling to turn the uniform draw ' + tex('u=' + dec(u)) + ' into an exponential draw with rate ' + tex('\\lambda=' + dec(lam)) + ', using ' + tex('x=-\\ln(u)/\\lambda') + '.',
        answer: x, tolerance: tol4, lecture: 4,
        explanation: tex('-\\ln(' + dec(u) + ')/' + dec(lam)) + ' = ' + dec(x) + '.',
      },
      {
        prompt: 'Four draws from a proposal density ' + tex('q') + ' have target density values ' + tex('p=' + p.map((v) => dec(v / 10)).join(',')) + ', proposal values ' + tex('q=' + q.map((v) => dec(v / 10)).join(',')) + ' and function values ' + tex('f=' + f.join(',')) + '. Find the self-normalised importance sampling estimate ' + tex('\\sum w_if_i/\\sum w_i') + ' with ' + tex('w_i=p_i/q_i') + '.',
        answer: est, tolerance: tol4, lecture: 5,
        explanation: 'Weights ' + tex(w.map(dec).join(',')) + ' sum to ' + dec(sw) + '; the weighted mean of ' + tex('f') + ' is ' + dec(est) + '.',
      },
      {
        prompt: 'Find the effective sample size of these four weights, ' + tex('(\\sum w_i)^2/\\sum w_i^2') + ' (it equals 4 only if the weights are equal).',
        answer: ess, tolerance: tol3, lecture: 5,
        explanation: tex('(' + dec(sw) + ')^2/' + dec(w.reduce((a, v) => a + v * v, 0))) + ' = ' + dec(ess) + '.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'bay-lq-d-montecarlo', generate: (rng) => build(sample(rng)) }
