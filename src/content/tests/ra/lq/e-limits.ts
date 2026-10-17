// LQ-E: limits of integrals: dominated and monotone convergence, and Fatou's lemma for an alternating sequence of indicators.
// Lecture 7 (convergence theorems).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { a: number[]; r: number[]; b: number[]; al: number; be: number; p: number; q: number }

export function sample(rng: Rng): Params {
  return {
    a: rng.pick([[-1, 1], [-1, 2], [1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [-2, 1]]),
    r: rng.pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4]]),
    b: rng.pick([[1, 2], [1, 1], [2, 1], [3, 2], [3, 1]]),
    al: rng.int(2, 6), be: rng.int(2, 6), p: rng.int(4, 8), q: rng.int(2, 6),
  }
}

export function build({ a, r, b, al, be, p, q }: Params): LQInstance {
  const av = a[0] / a[1], rv = r[0] / r[1], bv = b[0] / b[1]
  const dct = 1 / (1 - av)
  const mct = -Math.log(1 - rv) / rv
  const sine = 1 / (bv * bv)
  const overlap = Math.max(0, p - q)
  const lim1 = Math.min(al, be) * overlap
  const lim2 = Math.min(al * p, be * (10 - q))
  const aTex = a[1] === 1 ? String(a[0]) : (a[0] < 0 ? '-' : '') + '\\frac{' + Math.abs(a[0]) + '}{' + a[1] + '}'
  const rTex = '\\frac{' + r[0] + '}{' + r[1] + '}'
  const bTex = b[1] === 1 ? String(b[0]) : '\\frac{' + b[0] + '}{' + b[1] + '}'

  return {
    intro: 'Give every answer to 4 decimal places. In each part the limit is justified by one of the convergence theorems; the sequences in the last two parts live on ' + tex('[0,10]') + ' with Lebesgue measure.',
    parts: [
      {
        prompt: 'Find ' + tex('\\lim_{n\\to\\infty}\\int_0^n\\big(1-\\tfrac xn\\big)^ne^{' + aTex + 'x}\\,dx') + '. (Hint: ' + tex('0\\le(1-x/n)^n\\le e^{-x}') + ' on ' + tex('[0,n]') + '.)',
        answer: dct, tolerance: tol4, lecture: 7,
        explanation: 'Extend the integrand by 0 beyond ' + tex('n') + '. It converges pointwise to ' + tex('e^{-x}e^{' + aTex + 'x}') + ' and is dominated by the integrable function ' + tex('e^{-' + dec(1 - av) + 'x}') + ', so dominated convergence gives ' + tex('\\int_0^\\infty e^{-' + dec(1 - av) + 'x}dx=\\frac1{' + dec(1 - av) + '}=' + dec(dct)) + '.',
      },
      {
        prompt: 'Expand ' + tex('\\frac1{1-' + rTex + 'x}=\\sum_{k\\ge0}' + rTex + '^kx^k') + ' (nonnegative terms). Use monotone convergence to find ' + tex('\\int_0^1\\frac{dx}{1-' + rTex + 'x}') + '.',
        answer: mct, tolerance: tol4, lecture: 7,
        explanation: 'Term by term, ' + tex('\\sum_{k\\ge0}\\frac{' + rTex + '^k}{k+1}') + '; in closed form the integral is ' + tex('-\\frac{\\ln(1-r)}{r}=-\\frac{\\ln(' + dec(1 - rv) + ')}{' + dec(rv) + '}=' + dec(mct)) + '.',
      },
      {
        prompt: 'Find ' + tex('\\lim_{n\\to\\infty}\\int_0^\\infty n\\sin\\!\\big(\\tfrac xn\\big)e^{-' + bTex + 'x}\\,dx') + '. (Hint: ' + tex('|n\\sin(x/n)|\\le x') + '.)',
        answer: sine, tolerance: tol4, lecture: 7,
        explanation: 'The integrand converges pointwise to ' + tex('xe^{-' + bTex + 'x}') + ' and is dominated by the integrable function ' + tex('xe^{-' + bTex + 'x}') + '. Hence the limit is ' + tex('\\int_0^\\infty xe^{-' + bTex + 'x}dx=\\frac1{' + bTex + '^2}=' + dec(sine)) + '.',
      },
      {
        prompt: 'On ' + tex('[0,10]') + ' let ' + tex('f_n=' + al + '\\cdot1_{[0,' + p + ']}') + ' for odd ' + tex('n') + ' and ' + tex('f_n=' + be + '\\cdot1_{[' + q + ',10]}') + ' for even ' + tex('n') + '. Find ' + tex('\\int\\liminf_{n}f_n\\,d\\lambda') + '.',
        answer: lim1, tolerance: tol4, lecture: 7,
        explanation: 'At each point the sequence alternates between its two values, so ' + tex('\\liminf f_n=\\min(' + al + '1_{[0,' + p + ']},' + be + '1_{[' + q + ',10]})') + ': it equals ' + tex(String(Math.min(al, be))) + ' on ' + tex('[0,' + p + ']\\cap[' + q + ',10]') + ' (length ' + tex(String(overlap)) + ') and 0 elsewhere. The integral is ' + tex(dec(lim1)) + '.',
      },
      {
        prompt: 'For the same sequence find ' + tex('\\liminf_{n}\\int f_n\\,d\\lambda') + ', and compare with the previous answer (Fatou: ' + tex('\\int\\liminf f_n\\le\\liminf\\int f_n') + ').',
        answer: lim2, tolerance: tol4, lecture: 7,
        explanation: tex('\\int f_n') + ' alternates between ' + tex(al + '\\cdot' + p + '=' + al * p) + ' and ' + tex(be + '\\cdot' + (10 - q) + '=' + be * (10 - q)) + ', so the liminf is the smaller one, ' + tex(String(lim2)) + ', which is at least ' + tex(dec(lim1)) + ' as Fatou requires.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'ra-lq-e-limits', generate: (rng) => build(sample(rng)) }
