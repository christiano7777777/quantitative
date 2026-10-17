// LQ-D: Gini impurity, entropy, impurity decrease and information gain for a split of a classification node.
// Lecture 6 (decision trees).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { l: number[]; r: number[] } // class counts [class0, class1] in the left and right child

export function sample(rng: Rng): Params {
  for (;;) {
    const l = [rng.int(2, 25), rng.int(0, 25)], r = [rng.int(0, 25), rng.int(2, 25)]
    if (l[0] + l[1] > 0 && r[0] + r[1] > 0 && l[0] / (l[0] + l[1]) !== r[0] / (r[0] + r[1])) return { l, r }
  }
}

const gini = (c: number[]) => { const n = c[0] + c[1]; return 1 - (c[0] / n) ** 2 - (c[1] / n) ** 2 }
const ent = (c: number[]) => { const n = c[0] + c[1]; return -c.reduce((a, v) => a + (v > 0 ? (v / n) * Math.log2(v / n) : 0), 0) }

export function build({ l, r }: Params): LQInstance {
  const p = [l[0] + r[0], l[1] + r[1]]
  const nl = l[0] + l[1], nr = r[0] + r[1], n = nl + nr
  const gp = gini(p), gc = (nl / n) * gini(l) + (nr / n) * gini(r)
  const ep = ent(p), ec = (nl / n) * ent(l) + (nr / n) * ent(r)

  return {
    intro: 'A node holds ' + tex(n) + ' observations: ' + tex(p[0]) + ' of class 0 and ' + tex(p[1]) + ' of class 1. A split sends ' + tex(l[0]) + ' of class 0 and ' + tex(l[1]) + ' of class 1 to the left child, and ' + tex(r[0]) + ' of class 0 and ' + tex(r[1]) + ' of class 1 to the right child. Give answers to 4 decimal places (entropy with logarithms to base 2).',
    parts: [
      {
        prompt: 'Find the Gini impurity ' + tex('1-\\sum_kp_k^2') + ' of the parent node.',
        answer: gp, tolerance: tol4, lecture: 6,
        explanation: tex('1-(' + p[0] + '/' + n + ')^2-(' + p[1] + '/' + n + ')^2') + ' = ' + dec(gp) + '.',
      },
      {
        prompt: 'Find the weighted average Gini impurity of the two children, ' + tex('\\frac{n_L}{n}G_L+\\frac{n_R}{n}G_R') + '.',
        answer: gc, tolerance: tol4, lecture: 6,
        explanation: tex('G_L=' + dec(gini(l)) + ',\\ G_R=' + dec(gini(r))) + ', so the weighted average is ' + dec(gc) + '.',
      },
      {
        prompt: 'Find the Gini decrease from the split, parent minus weighted children.',
        answer: gp - gc, tolerance: tol4, lecture: 6,
        explanation: tex(dec(gp) + '-' + dec(gc)) + ' = ' + dec(gp - gc) + '.',
      },
      {
        prompt: 'Find the entropy ' + tex('-\\sum_kp_k\\log_2p_k') + ' of the parent node.',
        answer: ep, tolerance: tol4, lecture: 6,
        explanation: tex('-(' + dec(p[0] / n) + '\\log_2' + dec(p[0] / n) + '+' + dec(p[1] / n) + '\\log_2' + dec(p[1] / n) + ')') + ' = ' + dec(ep) + '.',
      },
      {
        prompt: 'Find the information gain from the split: parent entropy minus the weighted average entropy of the children.',
        answer: ep - ec, tolerance: tol4, lecture: 6,
        explanation: 'Children entropies ' + tex(dec(ent(l)) + ',' + dec(ent(r))) + ' have weighted average ' + dec(ec) + '; the gain is ' + dec(ep - ec) + '.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'ml-lq-d-trees', generate: (rng) => build(sample(rng)) }
