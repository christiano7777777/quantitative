// LQ-A: countable sets, limsup and liminf of intervals, countable additivity and continuity of Lebesgue measure.
// Lectures 1 (real line, set limits) and 4 (Lebesgue measure).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { N: number; p: number; q: number; w: number; m: number; a: number; j: number }

export function sample(rng: Rng): Params {
  const m = rng.int(2, 5)
  return { N: rng.int(5, 12), p: rng.int(2, 7), q: rng.int(0, 7), w: rng.int(2, 6), m, a: rng.int(1, m - 1), j: rng.int(2, 4) }
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

export function build({ N, p, q, w, m, a, j }: Params): LQInstance {
  let farey = 0
  for (let n = 1; n <= N; n++) for (let k = 1; k <= n; k++) if (gcd(k, n) === 1) farey++
  const overlap = Math.max(0, Math.min(p, q + w) - q)
  const limsup = p + w - overlap
  const liminf = overlap
  const total = a / (m - 1)
  const tail = (a * m ** (1 - j)) / (m - 1)
  const sets = tex('A_n=[0,\\,' + p + '+1/n]') + ' for odd ' + tex('n') + ' and ' + tex('A_n=[' + q + '-1/n,\\,' + (q + w) + ']') + ' for even ' + tex('n')

  return {
    intro: 'Let ' + tex('\\lambda') + ' be Lebesgue measure. Integer answers are exact; give the other answers to 4 decimal places.',
    parts: [
      {
        prompt: 'How many distinct rational numbers ' + tex('k/n') + ' with ' + tex('1\\le k\\le n\\le ' + N) + ' are there? (Countable sets can be enumerated; here only finitely many fractions occur, and equal fractions count once.)',
        answer: farey, tolerance: tolInt, lecture: 1,
        explanation: 'Each value in ' + tex('(0,1]') + ' has a unique reduced form ' + tex('k/n') + ' with ' + tex('\\gcd(k,n)=1') + ', so the count is ' + tex('\\sum_{n\\le ' + N + '}\\varphi(n)=' + farey) + '.',
      },
      {
        prompt: 'Consider ' + sets + '. Find ' + tex('\\lambda(\\limsup A_n)') + ', where ' + tex('\\limsup A_n') + ' is the set of points lying in infinitely many ' + tex('A_n') + '.',
        answer: limsup, tolerance: tol4, lecture: 1,
        explanation: 'The odd sets decrease to ' + tex('[0,' + p + ']') + ' and the even sets to ' + tex('[' + q + ',' + (q + w) + ']') + '. A point is in infinitely many ' + tex('A_n') + ' exactly when it lies in one of these limits, so ' + tex('\\limsup A_n=[0,' + p + ']\\cup[' + q + ',' + (q + w) + ']') + ' with measure ' + tex(dec(limsup)) + '.',
      },
      {
        prompt: 'For the same sets, find ' + tex('\\lambda(\\liminf A_n)') + ', where ' + tex('\\liminf A_n') + ' is the set of points lying in all but finitely many ' + tex('A_n') + '.',
        answer: liminf, tolerance: tol4, lecture: 1,
        explanation: 'A point is in all but finitely many ' + tex('A_n') + ' exactly when it lies in both limits, so ' + tex('\\liminf A_n=[0,' + p + ']\\cap[' + q + ',' + (q + w) + ']') + ', of measure ' + tex(dec(liminf)) + '.',
      },
      {
        prompt: 'The intervals ' + tex('I_k=[k,\\,k+' + a + '\\cdot' + m + '^{-k})') + ', ' + tex('k=1,2,\\dots') + ', are pairwise disjoint. Find ' + tex('\\lambda\\big(\\bigcup_{k\\ge1}I_k\\big)') + '.',
        answer: total, tolerance: tol4, lecture: 4,
        explanation: 'By countable additivity the measure is ' + tex('\\sum_{k\\ge1}' + a + '\\cdot' + m + '^{-k}=' + a + '\\cdot\\frac{1/' + m + '}{1-1/' + m + '}=\\frac{' + a + '}{' + (m - 1) + '}=' + dec(total)) + '.',
      },
      {
        prompt: 'Let ' + tex('E_j=\\bigcup_{k\\ge j}I_k') + ' be the tail union of the same intervals. Find ' + tex('\\lambda(E_{' + j + '})') + '. (These sets decrease to the empty set, so ' + tex('\\lambda(E_j)\\to0') + ' by continuity from above.)',
        answer: tail, tolerance: tol4, lecture: 4,
        explanation: tex('\\lambda(E_{' + j + '})=\\sum_{k\\ge' + j + '}' + a + '\\cdot' + m + '^{-k}=\\frac{' + a + '\\cdot' + m + '^{' + (1 - j) + '}}{' + (m - 1) + '}=' + dec(tail)) + '.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'ra-lq-a-limits', generate: (rng) => build(sample(rng)) }
