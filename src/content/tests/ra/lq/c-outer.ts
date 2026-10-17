// LQ-C: outer measure of sets built from rationals and intervals, a fat Cantor set, scaling of Lebesgue measure, and covers by intervals.
// Lectures 3 (outer measure) and 4 (Lebesgue measure).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { b1: number; c1: number; b2: number; c2: number; c: number; n: number; s: number; sh: number; eps: number; r: number }

export function sample(rng: Rng): Params {
  const b1 = rng.int(0, 5), b2 = rng.int(0, 6)
  return {
    b1, c1: b1 + rng.int(2, 6), b2, c2: b2 + rng.int(1, 5),
    c: rng.pick([0.4, 0.6, 0.8, 1, 1.2]), n: rng.int(2, 4), s: rng.int(2, 5), sh: rng.int(-5, 5),
    eps: rng.pick([0.1, 0.2, 0.3, 0.5, 0.6]), r: rng.pick([1 / 2, 1 / 3, 1 / 4, 2 / 3]),
  }
}

const frac = (r: number) => ({ 0.5: '\\tfrac12', 0.25: '\\tfrac14' } as Record<number, string>)[r] ?? (Math.abs(r - 1 / 3) < 1e-9 ? '\\tfrac13' : '\\tfrac23')

export function build({ b1, c1, b2, c2, c, n, s, sh, eps, r }: Params): LQInstance {
  const lo = Math.max(b1, b2), hi = Math.min(c1, c2)
  const overlap = Math.max(0, hi - lo)
  const outer = c1 - b1 + (c2 - b2) - overlap
  const fat = 1 - c / 2
  const stage = 1 - (c / 2) * (1 - 2 ** -n)
  const scaled = s * fat
  // total length of a cover with I_k of length eps * r^k (k >= 1) is eps r/(1-r); ask for a target total
  const target = eps
  const epsNeeded = (target * (1 - r)) / r

  return {
    intro: 'Let ' + tex('\\lambda^*') + ' be Lebesgue outer measure and ' + tex('\\lambda') + ' Lebesgue measure. Give every answer to 4 decimal places.',
    parts: [
      {
        prompt: 'Let ' + tex('E=\\big([' + b1 + ',' + c1 + ']\\setminus\\mathbb Q\\big)\\cup[' + b2 + ',' + c2 + ']\\cup\\big(\\mathbb Q\\cap[0,20]\\big)') + '. Find ' + tex('\\lambda^*(E)') + '.',
        answer: outer, tolerance: tol4, lecture: 3,
        explanation: 'The countable set ' + tex('\\mathbb Q\\cap[0,20]') + ' has outer measure 0 and can be dropped (subadditivity), and removing the rationals from ' + tex('[' + b1 + ',' + c1 + ']') + ' changes nothing in measure. What remains is the union of the two intervals, of length ' + tex((c1 - b1) + '+' + (c2 - b2) + '-' + overlap + '=' + outer) + '.',
      },
      {
        prompt: 'Construct a closed set ' + tex('K\\subset[0,1]') + ' in stages. At stage ' + tex('k=1,2,\\dots') + ' remove from the remaining closed intervals ' + tex('2^{k-1}') + ' open middle intervals, each of length ' + tex(dec(c) + '\\cdot4^{-k}') + ' (the removed gaps are disjoint and every remaining interval is longer than its gap). Find ' + tex('\\lambda(K)') + '.',
        answer: fat, tolerance: tol4, lecture: 4,
        explanation: 'The removed open set has measure ' + tex('\\sum_{k\\ge1}2^{k-1}\\cdot' + dec(c) + '\\cdot4^{-k}=' + dec(c) + '\\cdot\\frac12=' + dec(c / 2)) + ', so ' + tex('\\lambda(K)=1-' + dec(c / 2) + '=' + dec(fat)) + ' (by countable additivity of the removed gaps).',
      },
      {
        prompt: 'Let ' + tex('K_' + n) + ' be the set left after the first ' + tex(String(n)) + ' stages of the same construction. Find ' + tex('\\lambda(K_' + n + ')') + '.',
        answer: stage, tolerance: tol4, lecture: 4,
        explanation: 'Stages ' + tex('1,\\dots,' + n) + ' remove ' + tex(dec(c) + '\\sum_{k=1}^{' + n + '}2^{k-1}4^{-k}=' + dec(c / 2) + '(1-2^{-' + n + '})=' + dec((c / 2) * (1 - 2 ** -n))) + ', leaving ' + tex(dec(stage)) + '. These sets decrease to ' + tex('K') + ', and ' + tex('\\lambda(K_n)\\downarrow\\lambda(K)') + '.',
      },
      {
        prompt: 'Find ' + tex('\\lambda(' + s + 'K+' + sh + ')') + ' for the set ' + tex('K') + ' above, where ' + tex(s + 'K+' + sh + '=\\{' + s + 'x+' + sh + ':x\\in K\\}') + '.',
        answer: scaled, tolerance: tol4, lecture: 4,
        explanation: 'Lebesgue measure is translation invariant and satisfies ' + tex('\\lambda(aE)=|a|\\lambda(E)') + ', so the answer is ' + tex(s + '\\times' + dec(fat) + '=' + dec(scaled)) + '.',
      },
      {
        prompt: 'The rationals in ' + tex('[0,1]') + ' are listed as ' + tex('q_1,q_2,\\dots') + ', and ' + tex('q_k') + ' is covered by an open interval ' + tex('I_k') + ' of length ' + tex('\\varepsilon\\,r^k') + ', where ' + tex('r=' + frac(r)) + ' and ' + tex('k\\ge1') + '. What must ' + tex('\\varepsilon') + ' be for the total length of the cover to equal ' + tex(dec(target)) + '?',
        answer: epsNeeded, tolerance: tol4, lecture: 3,
        explanation: 'The total length is ' + tex('\\sum_{k\\ge1}\\varepsilon r^k=\\varepsilon\\frac{r}{1-r}') + ', so ' + tex('\\varepsilon=' + dec(target) + '\\cdot\\frac{1-r}{r}=' + dec(epsNeeded)) + '. Such covers show that ' + tex('\\lambda^*(\\mathbb Q\\cap[0,1])=0') + '.',
      },
    ],
  }
}

export const genC: LQGenerator = { id: 'ra-lq-c-outer', generate: (rng) => build(sample(rng)) }
