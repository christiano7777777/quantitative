// LQ-F: rate-distortion functions of simple sources.
// Lecture 8 (distortion measures, R(D) for Bernoulli, uniform m-ary and Gaussian sources, time-sharing and convexity).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params { p: number; D: number; m: number; Dm: number; s2: number; Dg: number; R: number }

export function sample(rng: Rng): Params {
  const p = rng.int(1, 5) / 10
  return {
    p,
    D: rng.int(1, Math.max(1, Math.round(p * 100) - 5)) / 100,
    m: rng.pick([3, 4, 5]),
    Dm: rng.int(5, 40) / 100,
    s2: rng.pick([2, 4, 5, 8, 9]),
    Dg: rng.pick([0.5, 1, 1.5]),
    R: rng.pick([0.5, 1, 1.5, 2, 2.5]),
  }
}

const lg = Math.log2
const h = (x: number) => (x <= 0 || x >= 1 ? 0 : -x * lg(x) - (1 - x) * lg(1 - x))

export function build({ p, D, m, Dm, s2, Dg, R }: Params): LQInstance {
  const rBern = h(p) - h(D)
  const share = h(p) * (1 - D / p)
  const excess = share - rBern
  const rM = lg(m) - h(Dm) - Dm * lg(m - 1)
  const rG = 0.5 * lg(s2 / Dg)
  const dG = s2 * 2 ** (-2 * R)
  return {
    intro: 'Use logarithms to base 2 and let ' + tex('h(t)=-t\\log_2t-(1-t)\\log_2(1-t)') + '. For the discrete sources the distortion is Hamming (' + tex('d(x,\\hat x)=1') + ' if ' + tex('x\\ne\\hat x') + ', else 0) and for the Gaussian source it is squared error. Give each answer to 3 decimal places.',
    parts: [
      {
        prompt: 'A Bernoulli(' + tex(dec(p)) + ') source has ' + tex('R(D)=h(p)-h(D)') + ' for ' + tex('0\\le D\\le p') + '. Find ' + tex('R(' + dec(D) + ')') + ' in bits per symbol.',
        answer: rBern, tolerance: tol3, lecture: 8,
        explanation: tex('h(' + dec(p) + ')-h(' + dec(D) + ')=' + dec(h(p)) + '-' + dec(h(D)) + '=' + dec(rBern)) + '.',
      },
      {
        prompt: 'For the same source, time-share between the lossless code (distortion 0, rate ' + tex('h(p)') + ') and the zero-rate code (distortion ' + tex('p') + ', rate 0) so that the average distortion is ' + tex(dec(D)) + '. By how many bits per symbol does the time-sharing rate exceed ' + tex('R(' + dec(D) + ')') + '?',
        answer: excess, tolerance: tol3, lecture: 8,
        explanation: 'The time-sharing weight on the lossless code is ' + tex('1-D/p=' + dec(1 - D / p)) + ', giving rate ' + tex(dec(share)) + '; subtracting ' + tex('R(D)=' + dec(rBern)) + ' leaves ' + tex(dec(excess)) + ', positive because ' + tex('R') + ' is strictly convex here.',
      },
      {
        prompt: 'A source uniform on ' + tex(String(m)) + ' symbols with Hamming distortion has ' + tex('R(D)=\\log_2 m-h(D)-D\\log_2(m-1)') + ' for ' + tex('0\\le D\\le 1-1/m') + '. Find ' + tex('R(' + dec(Dm) + ')') + '.',
        answer: rM, tolerance: tol3, lecture: 8,
        explanation: tex('\\log_2' + m + '-h(' + dec(Dm) + ')-' + dec(Dm) + '\\log_2' + (m - 1) + '=' + dec(lg(m)) + '-' + dec(h(Dm)) + '-' + dec(Dm * lg(m - 1)) + '=' + dec(rM)) + '.',
      },
      {
        prompt: 'A Gaussian source with variance ' + tex('\\sigma^2=' + s2) + ' and squared-error distortion has ' + tex('R(D)=\\frac12\\log_2\\frac{\\sigma^2}{D}') + ' for ' + tex('0<D\\le\\sigma^2') + '. Find ' + tex('R(' + dec(Dg) + ')') + '.',
        answer: rG, tolerance: tol3, lecture: 8,
        explanation: tex('\\frac12\\log_2\\frac{' + s2 + '}{' + dec(Dg) + '}=' + dec(rG)) + '.',
      },
      {
        prompt: 'For the same Gaussian source, what is the smallest mean squared error achievable at rate ' + tex('R=' + dec(R)) + ' bits per symbol?',
        answer: dG, tolerance: tol3, lecture: 8,
        explanation: 'Invert ' + tex('R(D)') + ': ' + tex('D=\\sigma^22^{-2R}=' + s2 + '\\times2^{-' + dec(2 * R) + '}=' + dec(dG)) + '.',
      },
    ],
  }
}

export const genF: LQGenerator = { id: 'it-lq-f-ratedist', generate: (rng) => build(sample(rng)) }
