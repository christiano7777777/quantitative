// LQ-G: two iterations of k-means (k = 2) on six one-dimensional points: assignments, centres and within-cluster sums of squares.
// Lecture 10 (clustering).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { x: number[]; c: number[] }

export function sample(rng: Rng): Params {
  for (;;) {
    const x = rng.sample(Array.from({ length: 30 }, (_, i) => i + 1), 6).sort((a, b) => a - b)
    const c = rng.sample(x, 2).sort((a, b) => a - b)
    // no point may be equidistant from two centres at any step
    const t1 = (c[0] + c[1]) / 2
    if (x.some((v) => v === t1) || c[0] === c[1]) continue
    const nc = step(x, c).nc
    if (!x.some((v) => v === (nc[0] + nc[1]) / 2)) return { x, c } // nor at the second iteration
  }
}

export function step(x: number[], c: number[]) {
  const mid = (c[0] + c[1]) / 2
  const g = x.map((v) => (v < mid ? 0 : 1))
  const nc = [0, 1].map((j) => { const m = x.filter((_, i) => g[i] === j); return m.length ? m.reduce((a, v) => a + v, 0) / m.length : c[j] })
  return { g, nc }
}
export const wcss = (x: number[], g: number[], c: number[]) => x.reduce((a, v, i) => a + (v - c[g[i]]) ** 2, 0)

export function build({ x, c }: Params): LQInstance {
  const s1 = step(x, c)
  const n1 = s1.g.filter((v) => v === 0).length
  const w1 = wcss(x, s1.g, s1.nc)
  const s2 = step(x, s1.nc)
  const w2 = wcss(x, s2.g, s2.nc)

  return {
    intro: 'Run Lloyd\'s ' + tex('k') + '-means with ' + tex('k=2') + ' on the points ' + tex(x.join(',')) + ', starting from centres ' + tex(c.join(' and ')) + '. Assign each point to its nearest centre, then recompute the centres as cluster means. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'In the first assignment step, how many points are closer to the lower centre ' + tex(c[0]) + '?',
        answer: n1, tolerance: tolInt, lecture: 10,
        explanation: 'The boundary is the midpoint ' + tex((c[0] + c[1]) / 2) + '; ' + n1 + ' points lie below it.',
      },
      {
        prompt: 'Find the lower centre after the first update.',
        answer: s1.nc[0], tolerance: tol4, lecture: 10,
        explanation: 'Mean of ' + x.filter((_, i) => s1.g[i] === 0).join(', ') + ' = ' + dec(s1.nc[0]) + '.',
      },
      {
        prompt: 'Find the upper centre after the first update.',
        answer: s1.nc[1], tolerance: tol4, lecture: 10,
        explanation: 'Mean of ' + x.filter((_, i) => s1.g[i] === 1).join(', ') + ' = ' + dec(s1.nc[1]) + '.',
      },
      {
        prompt: 'Find the within-cluster sum of squares after the first update (using the new centres and the first assignment).',
        answer: w1, tolerance: tol4, lecture: 10,
        explanation: 'Sum of squared distances to the cluster means: ' + dec(w1) + '.',
      },
      {
        prompt: 'Carry out a second iteration (reassign to the new centres, update again). Find the within-cluster sum of squares after it. (It cannot be larger than before.)',
        answer: w2, tolerance: tol4, lecture: 10,
        explanation: 'New centres ' + tex(s2.nc.map(dec).join(',')) + ' with the second assignment give ' + dec(w2) + (w2 < w1 ? ', lower than ' + dec(w1) + '.' : ' (unchanged: converged).'),
      },
    ],
  }
}

export const genG: LQGenerator = { id: 'ml-lq-g-kmeans', generate: (rng) => build(sample(rng)) }
