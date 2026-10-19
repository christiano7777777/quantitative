// LQ-K: ranking data: Kendall and Spearman distances, a Mallows probability, a Plackett-Luce probability and a Borda score.
// Lecture 12 (statistical modelling for ranking data).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

const ITEMS = ['A', 'B', 'C', 'D']

/** A ranking lists the items from best to worst, as item indices 0..3. */
export interface Params { pi: number[]; centre: number[]; q: [number, number]; w: number[]; voters: number[][]; item: number }

export function sample(rng: Rng): Params {
  const pi = rng.shuffle([0, 1, 2, 3])
  let centre = rng.shuffle([0, 1, 2, 3])
  while (centre.join() === pi.join()) centre = rng.shuffle([0, 1, 2, 3])
  const voters = [pi, centre, rng.shuffle([0, 1, 2, 3]), rng.shuffle([0, 1, 2, 3]), rng.shuffle([0, 1, 2, 3])]
  return { pi, centre, q: rng.pick([[1, 2], [1, 3], [2, 3]] as [number, number][]), w: Array.from({ length: 4 }, () => rng.int(1, 6)), voters, item: rng.int(0, 3) }
}

const show = (r: number[]) => r.map((i) => ITEMS[i]).join('\\succ ')
const rankOf = (r: number[]) => { const o = [0, 0, 0, 0]; r.forEach((item, pos) => { o[item] = pos + 1 }); return o }

export function build({ pi, centre, q, w, voters, item }: Params): LQInstance {
  const n = 4
  const rp = rankOf(pi), rc = rankOf(centre)
  let dK = 0, dS = 0
  for (let i = 0; i < n; i++) {
    dS += (rp[i] - rc[i]) ** 2
    for (let j = i + 1; j < n; j++) if ((rp[i] - rp[j]) * (rc[i] - rc[j]) < 0) dK++
  }
  const qq = q[0] / q[1]
  let Z = 1
  for (let j = 1; j <= n; j++) { let s = 0; for (let t = 0; t < j; t++) s += qq ** t; Z *= s }
  const pM = qq ** dK / Z
  let pPL = 1, rest = pi.reduce((s, i) => s + w[i], 0)
  for (const i of pi) { pPL *= w[i] / rest; rest -= w[i] }
  const borda = voters.reduce((s, v) => s + (n - rankOf(v)[item]), 0)
  const wTot = w.reduce((s, v) => s + v, 0)

  return {
    intro: 'Four items ' + tex('A,B,C,D') + ' are ranked. Write ' + tex('X\\succ Y') + ' when ' + tex('X') + ' is ranked above (preferred to) ' + tex('Y') + '. Let ' + tex('\\pi=' + show(pi)) + ' and ' + tex('\\pi_0=' + show(centre)) + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the Kendall distance ' + tex('d_K(\\pi,\\pi_0)') + ', the number of pairs of items that the two rankings put in opposite orders. Give a whole number.',
        answer: dK, tolerance: tolInt, lecture: 21,
        explanation: 'Ranks in ' + tex('\\pi') + ' (A,B,C,D): ' + rp.join(',') + '; in ' + tex('\\pi_0') + ': ' + rc.join(',') + '. Of the 6 pairs, ' + dK + ' are in opposite order.',
      },
      {
        prompt: 'Find the Spearman distance ' + tex('d_S(\\pi,\\pi_0)=\\sum_{i}(r_i-r_i^0)^2') + ', where ' + tex('r_i') + ' and ' + tex('r_i^0') + ' are the ranks of item ' + tex('i') + ' (best item has rank 1). Give a whole number.',
        answer: dS, tolerance: tolInt, lecture: 21,
        explanation: 'Rank differences (A,B,C,D): ' + rp.map((r, i) => r - rc[i]).join(',') + ', so the sum of squares is ' + dS + '.',
      },
      {
        prompt: 'Under a Mallows model with centre ' + tex('\\pi_0') + ', ' + tex('P(\\sigma)=q^{d_K(\\sigma,\\pi_0)}/Z') + ' with ' + tex('q=' + q[0] + '/' + q[1]) + ' and normalising constant ' + tex('Z=\\prod_{j=1}^{4}(1+q+\\cdots+q^{j-1})') + '. Find ' + tex('P(\\pi)') + '.',
        answer: pM, tolerance: tol4, lecture: 21,
        explanation: tex('d_K=' + dK) + ' and ' + tex('Z=1\\cdot(1+q)(1+q+q^2)(1+q+q^2+q^3)=' + dec(Z)) + ', so ' + tex('P(\\pi)=q^{' + dK + '}/Z') + ' = ' + dec(pM) + '.',
      },
      {
        prompt: 'In a Plackett-Luce model the items have weights ' + tex('w_A=' + w[0] + ',\\ w_B=' + w[1] + ',\\ w_C=' + w[2] + ',\\ w_D=' + w[3]) + '. The first place goes to item ' + tex('i') + ' with probability proportional to ' + tex('w_i') + ', then the next place is chosen the same way among the remaining items, and so on. Find the probability that the ranking is ' + tex('\\pi') + '.',
        answer: pPL, tolerance: tol4, lecture: 21,
        explanation: 'Product of weight over total weight of the items still unranked: ' + tex(pi.map((i, t) => w[i] + '/' + pi.slice(t).reduce((s, j) => s + w[j], 0)).join('\\cdot')) + ' = ' + dec(pPL) + '. (Total weight ' + wTot + '.)',
      },
      {
        prompt: 'Five voters rank the items. Their rankings (best first) are ' + tex(voters.map(show).join(';\\ ')) + '. Borda gives 3 points to the item ranked first, 2 to the second, 1 to the third and 0 to the last. Find the total Borda score of item ' + tex(ITEMS[item]) + '. Give a whole number.',
        answer: borda, tolerance: tolInt, lecture: 21,
        explanation: 'Points for ' + tex(ITEMS[item]) + ' voter by voter: ' + voters.map((v) => n - rankOf(v)[item]).join(' + ') + ' = ' + borda + '.',
      },
    ],
  }
}

export const genK: LQGenerator = { id: 'np-lq-k-ranking', generate: (rng) => build(sample(rng)) }
