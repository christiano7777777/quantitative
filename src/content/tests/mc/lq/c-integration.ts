// LQ-C: Monte Carlo integration: estimate, standard error, confidence interval, and the sample size for a target accuracy.
// Lecture 4.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { g: number[]; eps: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const g = Array.from({ length: 5 }, () => rng.int(5, 40) / 10)
    const n = g.length
    const mean = g.reduce((s, v) => s + v, 0) / n
    const s2 = g.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1)
    const eps = rng.int(2, 10) / 100
    const need = (1.96 ** 2 * s2) / (eps * eps)
    const frac = need - Math.floor(need)
    if (s2 > 0.05 && frac > 0.15 && frac < 0.85) return { g, eps }
  }
}

export function build({ g, eps }: Params): LQInstance {
  const n = g.length
  const mean = g.reduce((s, v) => s + v, 0) / n
  const s = Math.sqrt(g.reduce((t, v) => t + (v - mean) ** 2, 0) / (n - 1))
  const se = s / Math.sqrt(n)
  const upper = mean + 1.96 * se
  const need = Math.ceil((1.96 * s / eps) ** 2)
  const list = tex(g.map(dec).join(',\\ '))

  return {
    intro: 'A Monte Carlo estimate of ' + tex('I=\\int_0^1 h(x)\\,dx') + ' uses ' + tex('n=' + n) + ' independent uniforms ' + tex('U_i') + ', with the evaluated values ' + tex('h(U_i)') + ' equal to ' + list + '. Use 1.96 for the 95% normal quantile. Give answers to 4 decimal places except where an integer is asked.',
    parts: [
      {
        prompt: 'Find the Monte Carlo estimate ' + tex('\\hat I=\\frac1n\\sum h(U_i)') + '.',
        answer: mean, tolerance: tol4, lecture: 4,
        explanation: tex('(' + g.map(dec).join('+') + ')/' + n + '=' + dec(mean)) + '.',
      },
      {
        prompt: 'Find the sample standard deviation ' + tex('s') + ' of the values (divisor ' + tex('n-1') + ').',
        answer: s, tolerance: tol4, lecture: 4,
        explanation: tex('s^2=\\frac1{n-1}\\sum(h_i-\\hat I)^2=' + dec(s * s) + ',\\ s=' + dec(s)) + '.',
      },
      {
        prompt: 'Find the estimated standard error of ' + tex('\\hat I') + '.',
        answer: se, tolerance: tol4, lecture: 4,
        explanation: tex('s/\\sqrt n=' + dec(s) + '/\\sqrt{' + n + '}=' + dec(se)) + '.',
      },
      {
        prompt: 'Find the upper end of the approximate 95% confidence interval for ' + tex('I') + '.',
        answer: upper, tolerance: tol4, lecture: 4,
        explanation: tex('\\hat I+1.96\\,\\mathrm{SE}=' + dec(mean) + '+1.96\\times' + dec(se) + '=' + dec(upper)) + '.',
      },
      {
        prompt: 'Treating ' + tex('s') + ' as the true standard deviation, what is the smallest total number of samples ' + tex('n') + ' that makes the 95% half-width at most ' + tex(dec(eps)) + '? (An integer.)',
        answer: need, tolerance: tolInt, lecture: 4,
        explanation: tex('n\\ge(1.96s/\\varepsilon)^2=(1.96\\times' + dec(s) + '/' + dec(eps) + ')^2=' + dec((1.96 * s / eps) ** 2)) + ', rounded up: ' + need + '. The error falls like ' + tex('1/\\sqrt n') + ', so each extra digit costs 100 times more samples.',
      },
    ],
  }
}

export const genC: LQGenerator = { id: 'mc-lq-c-integration', generate: (rng) => build(sample(rng)) }
