// LQ-G: L^p norms of simple functions: the p-norm, the essential supremum, Holder, Minkowski and a Chebyshev bound.
// Lecture 9 (L^p spaces).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { m: number[]; a: number[]; b: number[]; p: number; t: number }

export function sample(rng: Rng): Params {
  const nz = () => rng.pick([-4, -3, -2, -1, 1, 2, 3, 4])
  return { m: [rng.int(1, 4), rng.int(1, 4), rng.int(1, 4)], a: [nz(), nz(), nz()], b: [nz(), nz(), nz()], p: rng.pick([2, 3, 4]), t: rng.int(2, 3) }
}

export function build({ m, a, b, p, t }: Params): LQInstance {
  const q = p / (p - 1)
  const qTex = p === 2 ? '2' : '\\tfrac{' + p + '}{' + (p - 1) + '}'
  const sum = (xs: number[], g: (x: number, i: number) => number) => xs.reduce((s, x, i) => s + g(x, i), 0)
  const fp = sum(a, (x, i) => m[i] * Math.abs(x) ** p)
  const normF = fp ** (1 / p)
  const normG = sum(b, (x, i) => m[i] * Math.abs(x) ** q) ** (1 / q)
  const ess = Math.max(...a.map(Math.abs))
  const prod = sum(a, (x, i) => m[i] * Math.abs(x * b[i]))
  const holder = normF * sum(b, (x, i) => m[i] * Math.abs(x) ** q) ** (1 / q) - prod
  const normS = sum(a, (x, i) => m[i] * Math.abs(x + b[i]) ** p) ** (1 / p)
  const cheb = fp / t ** p
  const sets = tex('E_1=[0,' + m[0] + ')') + ', ' + tex('E_2=[' + m[0] + ',' + (m[0] + m[1]) + ')') + ', ' + tex('E_3=[' + (m[0] + m[1]) + ',' + (m[0] + m[1] + m[2]) + ')')

  return {
    intro: 'Work on ' + tex('\\mathbb R') + ' with Lebesgue measure, with ' + sets + '. Let ' + tex('f=' + a[0] + '\\cdot1_{E_1}+(' + a[1] + ')1_{E_2}+(' + a[2] + ')1_{E_3}') + ' except that ' + tex('f(x)=100') + ' at every rational ' + tex('x') + ', and ' + tex('g=' + b[0] + '\\cdot1_{E_1}+(' + b[1] + ')1_{E_2}+(' + b[2] + ')1_{E_3}') + ' (both are 0 outside the sets). Use ' + tex('p=' + p) + ' and its conjugate exponent ' + tex('q=' + qTex) + '. Give every answer to 4 decimal places.',
    parts: [
      {
        prompt: 'Find ' + tex('\\|f\\|_{' + p + '}=\\big(\\int|f|^{' + p + '}d\\lambda\\big)^{1/' + p + '}') + '.',
        answer: normF, tolerance: tol4, lecture: 9,
        explanation: 'The rationals are null, so ' + tex('\\int|f|^{' + p + '}=\\sum_im_i|a_i|^{' + p + '}=' + dec(fp)) + ' and the norm is ' + tex(dec(fp) + '^{1/' + p + '}=' + dec(normF)) + '.',
      },
      {
        prompt: 'Find the essential supremum ' + tex('\\|f\\|_\\infty') + '.',
        answer: ess, tolerance: tol4, lecture: 9,
        explanation: 'The value 100 is taken only on the null set of rationals, so it is ignored: ' + tex('\\|f\\|_\\infty=\\max_i|a_i|=' + ess) + '.',
      },
      {
        prompt: 'Holder\'s inequality says ' + tex('\\int|fg|\\le\\|f\\|_{' + p + '}\\|g\\|_{' + qTex + '}') + '. Find the gap ' + tex('\\|f\\|_{' + p + '}\\|g\\|_{q}-\\int|fg|\\,d\\lambda') + '.',
        answer: holder, tolerance: tol4, lecture: 9,
        explanation: tex('\\|g\\|_q=\\big(\\sum m_i|b_i|^q\\big)^{1/q}=' + dec(normG)) + ', so ' + tex('\\|f\\|_p\\|g\\|_q=' + dec(normF * normG)) + ' while ' + tex('\\int|fg|=\\sum_im_i|a_ib_i|=' + dec(prod)) + '. The gap is ' + tex(dec(holder)) + ' and is nonnegative.',
      },
      {
        prompt: 'Find ' + tex('\\|f+g\\|_{' + p + '}') + '. (Minkowski: it is at most ' + tex('\\|f\\|_{' + p + '}+\\|g\\|_{' + p + '}') + '.)',
        answer: normS, tolerance: tol4, lecture: 9,
        explanation: tex('f+g') + ' equals ' + tex('a_i+b_i') + ' on ' + tex('E_i') + ' (almost everywhere), so ' + tex('\\|f+g\\|_p=\\big(\\sum m_i|a_i+b_i|^p\\big)^{1/p}=' + dec(normS)) + '.',
      },
      {
        prompt: 'Apply Markov\'s inequality to ' + tex('|f|^{' + p + '}') + ' to get the bound ' + tex('\\lambda(\\{|f|\\ge' + t + '\\})\\le\\|f\\|_{' + p + '}^{' + p + '}/' + t + '^{' + p + '}') + '. Find the value of this bound.',
        answer: cheb, tolerance: tol4, lecture: 9,
        explanation: tex('\\|f\\|_p^p=' + dec(fp)) + ', so the bound is ' + tex(dec(fp) + '/' + t ** p + '=' + dec(cheb)) + '. (It exceeds the true measure ' + tex('\\lambda(\\{|f|\\ge' + t + '\\})') + ' in general.)',
      },
    ],
  }
}

export const genG: LQGenerator = { id: 'ra-lq-g-lp', generate: (rng) => build(sample(rng)) }
