// LQ-H: differential entropies and water-filling over three parallel Gaussian channels.
// Lectures 10 (differential entropy of normal and exponential variables, scaling) and 11 (water-filling).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params { s2: number; lam: number; c: number; N: [number, number, number]; P: number }

export function sample(rng: Rng): Params {
  const n1 = rng.int(1, 3)
  const n2 = n1 + rng.int(1, 3)
  const n3 = n2 + rng.int(1, 4)
  return {
    s2: rng.pick([2, 3, 4, 5, 8]),
    lam: rng.pick([0.5, 2, 3, 4]),
    c: rng.pick([2, 3, 4, 5]),
    N: [n1, n2, n3],
    P: rng.int(2, 12),
  }
}

const lg = Math.log2

/** Water-filling by trying the active sets {1..k} for k = 3, 2, 1 (noise sorted increasingly). */
export function waterfill(N: number[], P: number): { nu: number; powers: number[] } {
  for (let k = N.length; k >= 1; k--) {
    const nu = (P + N.slice(0, k).reduce((s, x) => s + x, 0)) / k
    if (nu >= N[k - 1]) return { nu, powers: N.map((x, i) => (i < k ? nu - x : 0)) }
  }
  throw new Error('no active set')
}

export function build({ s2, lam, c, N, P }: Params): LQInstance {
  const hN = 0.5 * lg(2 * Math.PI * Math.E * s2)
  const hY = lg(Math.E / lam) + lg(c)
  const { nu, powers } = waterfill(N, P)
  const cap = powers.reduce((s, pw, i) => s + 0.5 * lg(1 + pw / N[i]), 0)
  return {
    intro: 'Use logarithms to base 2 (bits). Give each answer to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the differential entropy of ' + tex('X\\sim N(0,' + s2 + ')') + ', that is ' + tex('\\tfrac12\\log_2(2\\pi e\\sigma^2)') + '.',
        answer: hN, tolerance: tol3, lecture: 10,
        explanation: tex('\\frac12\\log_2(2\\pi e\\times' + s2 + ')=\\frac12\\log_2(' + dec(2 * Math.PI * Math.E * s2) + ')=' + dec(hN)) + '.',
      },
      {
        prompt: tex('X') + ' is exponential with rate ' + tex('\\lambda=' + dec(lam)) + ', whose differential entropy is ' + tex('\\log_2(e/\\lambda)') + '. Find the differential entropy of ' + tex('Y=' + c + 'X+7') + '.',
        answer: hY, tolerance: tol3, lecture: 10,
        explanation: tex('h(Y)=h(X)+\\log_2|' + c + '|=\\log_2(e/' + dec(lam) + ')+\\log_2' + c + '=' + dec(lg(Math.E / lam)) + '+' + dec(lg(c)) + '=' + dec(hY)) + '; the shift 7 does not matter.',
      },
      {
        prompt: 'Three independent Gaussian channels have noise variances ' + tex('N_1=' + N[0] + ',\\ N_2=' + N[1] + ',\\ N_3=' + N[2]) + ' and share a total power ' + tex('P=' + P) + '. Find the water level ' + tex('\\nu') + ' of the optimal (water-filling) allocation ' + tex('P_i=(\\nu-N_i)^+') + '.',
        answer: nu, tolerance: tol3, lecture: 11,
        explanation: 'Active channels: ' + powers.filter((x) => x > 0).length + '. ' + tex('\\nu=\\frac{P+\\sum_{\\text{active}}N_i}{\\#\\text{active}}=' + dec(nu)) + '.',
      },
      {
        prompt: 'Find the power ' + tex('P_1') + ' given to the least noisy channel.',
        answer: powers[0], tolerance: tol3, lecture: 11,
        explanation: tex('P_1=\\nu-N_1=' + dec(nu) + '-' + N[0] + '=' + dec(powers[0])) + '. The powers are ' + tex('(' + powers.map(dec).join(',\\ ') + ')') + ', summing to ' + tex(String(P)) + '.',
      },
      {
        prompt: 'Find the total capacity ' + tex('\\sum_i\\frac12\\log_2(1+P_i/N_i)') + ' of the three channels under the water-filling allocation.',
        answer: cap, tolerance: tol3, lecture: 11,
        explanation: tex('\\sum_{\\text{active}}\\frac12\\log_2\\frac{\\nu}{N_i}=' + dec(cap)) + ' bits per use of the three channels together.',
      },
    ],
  }
}

export const genH: LQGenerator = { id: 'it-lq-h-continuous', generate: (rng) => build(sample(rng)) }
