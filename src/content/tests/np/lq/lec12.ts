// np lecture 12 (statistical modelling for ranking data): one story. A taste panel ranks four drinks: Kendall distance between two
// panelists, a Plackett-Luce probability, the normalising constant and a probability under a Mallows model for three drinks, and Borda counts.
// Lecture 12.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { panel: string[][]; w: number[]; q: number; target: string }

const items = ['A', 'B', 'C', 'D']

export function sample(rng: Rng): Params {
  const panel = Array.from({ length: 5 }, () => rng.shuffle([...items]))
  const w = rng.sample([1, 2, 3, 4, 5, 6], 4)
  return { panel, w, q: rng.pick([0.4, 0.5, 0.6]), target: rng.pick(['ACB', 'BAC', 'BCA', 'CAB', 'CBA']) }
}

/** Number of pairs of items that the two rankings (best to worst) put in opposite order. */
const kendall = (a: string[], b: string[]) => {
  let d = 0
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (b.indexOf(a[i]) > b.indexOf(a[j])) d++
  return d
}

export function build({ panel, w, q, target }: Params): LQInstance {
  const dist = kendall(panel[0], panel[1])
  const strength = (it: string) => w[items.indexOf(it)]
  const order = panel[0]
  let pl = 1
  for (let i = 0; i < order.length - 1; i++) {
    const rest = order.slice(i).reduce((s, it) => s + strength(it), 0)
    pl *= strength(order[i]) / rest
  }
  const Z = 1 + 2 * q + 2 * q * q + q ** 3
  const dT = kendall(['A', 'B', 'C'], target.split(''))
  const pm = q ** dT / Z
  const borda = items.map((it) => panel.reduce((s, r) => s + (3 - r.indexOf(it)), 0))
  const top = Math.max(...borda)

  return {
    intro: 'A taste panel of five people ranks four drinks ' + tex('A,B,C,D') + ' from best to worst: ' + panel.map((r, i) => 'panelist ' + (i + 1) + ': ' + tex(r.join('>'))).join('; ') + '. Use these rankings to compare ranking models. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'The Kendall distance between two rankings is the number of pairs of drinks they put in opposite order. Find the distance between panelists 1 and 2. Give a whole number.',
        answer: dist, tolerance: tolInt, lecture: 12,
        explanation: 'Compare the ' + tex(6) + ' pairs: panelist 1 has ' + tex(panel[0].join('>')) + ' and panelist 2 has ' + tex(panel[1].join('>')) + '; ' + tex(dist) + ' pairs are ordered differently.',
      },
      {
        prompt: 'In the Plackett-Luce model each drink has a strength ' + tex('w_A,w_B,w_C,w_D=' + w.join(',')) + ', and a ranking arises by choosing the best among those left with probability proportional to strength. Find the probability of panelist 1\'s ranking ' + tex(panel[0].join('>')) + '.',
        answer: pl, tolerance: tol4, lecture: 12,
        explanation: 'Choose first ' + tex(order[0]) + ' among all four, then ' + tex(order[1]) + ' among the remaining three, then ' + tex(order[2]) + ' among the last two: ' + tex(order.slice(0, 3).map((it, i) => strength(it) + '/' + order.slice(i).reduce((s, x2) => s + strength(x2), 0)).join('\\times')) + ' = ' + dec(pl) + '.',
      },
      {
        prompt: 'For the three drinks ' + tex('A,B,C') + ' a Mallows model with centre ' + tex('A>B>C') + ' gives a ranking at Kendall distance ' + tex('d') + ' from the centre probability ' + tex('q^d/Z') + ', with ' + tex('q=' + dec(q)) + '. The six rankings are at distances ' + tex('0,1,1,2,2,3') + '. Find the normalising constant ' + tex('Z') + '.',
        answer: Z, tolerance: tol4, lecture: 12,
        explanation: tex('Z=1+2q+2q^2+q^3=1+' + dec(2 * q) + '+' + dec(2 * q * q) + '+' + dec(q ** 3)) + ' = ' + dec(Z) + '.',
      },
      {
        prompt: 'Find the Mallows probability of the ranking ' + tex(target.split('').join('>')) + ' (its distance from ' + tex('A>B>C') + ' is the number of pairs it reverses).',
        answer: pm, tolerance: tol4, lecture: 12,
        explanation: 'The ranking ' + tex(target.split('').join('>')) + ' reverses ' + tex(dT) + ' pair(s), so its probability is ' + tex(dec(q) + '^{' + dT + '}/' + dec(Z)) + ' = ' + dec(pm) + '.',
      },
      {
        prompt: 'The Borda count gives 3 points to a panelist\'s best drink, 2 to the second, 1 to the third and 0 to the worst, and adds over the panel. Find the Borda total of drink ' + tex('A') + '. Give a whole number.',
        answer: borda[0], tolerance: tolInt, lecture: 12,
        explanation: 'Drink ' + tex('A') + ' scores ' + panel.map((r) => 3 - r.indexOf('A')).join(', ') + ' from the five panelists: ' + tex(borda[0]) + '. The totals of ' + tex('A,B,C,D') + ' are ' + borda.join(', ') + '.',
      },
      {
        prompt: 'Find the Borda total of the winning drink (the largest total). Give a whole number.',
        answer: top, tolerance: tolInt, lecture: 12,
        explanation: 'The totals are ' + borda.join(', ') + ' for ' + tex('A,B,C,D') + '; the largest is ' + tex(top) + ' (the totals add up to ' + tex(5 * 6) + ').',
      },
    ],
  }
}

export const genLec12: LQGenerator = { id: 'np-lq-lec12', generate: (rng) => build(sample(rng)) }
