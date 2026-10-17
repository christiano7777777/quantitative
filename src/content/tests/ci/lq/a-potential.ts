// LQ-A: a full potential-outcomes table for six units: ATE, ATT, the naive difference, selection bias, and the Neyman standard error.
// Lectures 1 (potential outcomes, ATE, selection bias) and 2 (randomised experiments, Neyman estimator).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params { y0: number[]; y1: number[]; treated: number[] } // treated: indices 0..5

export function sample(rng: Rng): Params {
  for (;;) {
    const y0 = Array.from({ length: 6 }, () => rng.int(2, 14))
    const y1 = y0.map((v) => v + rng.int(-2, 8))
    const treated = rng.sample([0, 1, 2, 3, 4, 5], 3).sort((a, b) => a - b)
    const t1 = treated.map((i) => y1[i]), c0 = [0, 1, 2, 3, 4, 5].filter((i) => !treated.includes(i)).map((i) => y0[i])
    const sd = (a: number[]) => { const m = a.reduce((s, v) => s + v, 0) / a.length; return a.reduce((s, v) => s + (v - m) ** 2, 0) }
    if (sd(t1) > 0 || sd(c0) > 0) return { y0, y1, treated }
  }
}

const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length
const svar = (a: number[]) => { const m = mean(a); return a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1) }

export function build({ y0, y1, treated }: Params): LQInstance {
  const idx = [0, 1, 2, 3, 4, 5]
  const control = idx.filter((i) => !treated.includes(i))
  const ate = mean(idx.map((i) => y1[i] - y0[i]))
  const att = mean(treated.map((i) => y1[i] - y0[i]))
  const naive = mean(treated.map((i) => y1[i])) - mean(control.map((i) => y0[i]))
  const bias = naive - att
  const se = Math.sqrt(svar(treated.map((i) => y1[i])) / 3 + svar(control.map((i) => y0[i])) / 3)
  const table = String.raw`\begin{array}{c|cccccc} \text{unit} & 1&2&3&4&5&6 \\ \hline Y(0) & ${y0.join('&')} \\ Y(1) & ${y1.join('&')} \end{array}`

  return {
    intro:
      'An all-knowing table of potential outcomes for six units is $$' + table + '$$ Units ' + treated.map((i) => i + 1).join(', ') + ' were treated and the others were not, so only ' + tex('Y(1)') + ' of the treated and ' + tex('Y(0)') + ' of the controls are observed. Give answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the true average treatment effect over the six units.',
        answer: ate, tolerance: tol3, lecture: 1,
        explanation: 'Individual effects ' + tex(idx.map((i) => y1[i] - y0[i]).join(',')) + ' have mean ' + dec(ate) + '.',
      },
      {
        prompt: 'Find the average effect on the treated (ATT): the mean of ' + tex('Y(1)-Y(0)') + ' over the treated units.',
        answer: att, tolerance: tol3, lecture: 1,
        explanation: 'Treated effects ' + tex(treated.map((i) => y1[i] - y0[i]).join(',')) + ' have mean ' + dec(att) + '.',
      },
      {
        prompt: 'Find the observed difference in means: mean outcome of treated units minus mean outcome of the controls.',
        answer: naive, tolerance: tol3, lecture: 2,
        explanation: tex(dec(mean(treated.map((i) => y1[i]))) + '-' + dec(mean(control.map((i) => y0[i])))) + ' = ' + dec(naive) + '.',
      },
      {
        prompt: 'Find the selection bias of the observed difference as an estimate of the ATT, i.e. the difference minus the ATT. (It equals ' + tex('E[Y(0)\\mid T=1]-E[Y(0)\\mid T=0]') + '.)',
        answer: bias, tolerance: tol3, lecture: 1,
        explanation: tex(dec(naive) + '-' + dec(att)) + ' = ' + dec(bias) + '. Check: mean ' + tex('Y(0)') + ' of the treated is ' + dec(mean(treated.map((i) => y0[i]))) + ' and of the controls ' + dec(mean(control.map((i) => y0[i]))) + '.',
      },
      {
        prompt: 'Find the Neyman standard error ' + tex('\\sqrt{s_1^2/n_1+s_0^2/n_0}') + ' of the difference in means (sample variances with divisor ' + tex('n-1') + ').',
        answer: se, tolerance: tol3, lecture: 2,
        explanation: tex('s_1^2=' + dec(svar(treated.map((i) => y1[i]))) + ',\\ s_0^2=' + dec(svar(control.map((i) => y0[i])))) + ', so the standard error is ' + dec(se) + '.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'ci-lq-a-potential', generate: (rng) => build(sample(rng)) }
