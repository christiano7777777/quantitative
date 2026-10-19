// LQ-Q: a discrete two-parameter posterior: normalising constant, marginal posterior of the parameter of interest,
// a smallest (highest posterior probability) set, the posterior predictive probability and the posterior mean.
// Lecture 7 (Bayesian intervals, predictive distributions and nuisance parameters).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { w: number[][]; level: number } // w[i][j]: weight of (theta1 = i+1, theta2 = j)

export function sample(rng: Rng): Params {
  for (;;) {
    const w = Array.from({ length: 3 }, () => [rng.int(1, 9), rng.int(1, 9)])
    const tot = w.flat().reduce((a, b) => a + b, 0)
    const marg = w.map((r) => (r[0] + r[1]) / tot)
    const level = rng.pick([0.6, 0.7, 0.8])
    // the three marginal probabilities must be distinct so that the smallest set is well defined
    if (new Set(marg.map((m) => m.toFixed(6))).size === 3 && !marg.some((m, i) => marg.some((n, j) => i !== j && Math.abs(m + n - level) < 1e-9))) return { w, level }
  }
}

export function build({ w, level }: Params): LQInstance {
  const tot = w.flat().reduce((a, b) => a + b, 0)
  const marg = w.map((r) => (r[0] + r[1]) / tot)
  const sorted = [...marg].sort((a, b) => b - a)
  let k = 0, acc = 0
  while (acc < level - 1e-12) acc += sorted[k++]
  const pred = marg.reduce((s, m, i) => s + ((i + 1) / 4) * m, 0)
  const meanTheta = marg.reduce((s, m, i) => s + (i + 1) * m, 0)
  const table = '$$\\begin{array}{c|cc}' + ' & \\theta_2=0 & \\theta_2=1 \\\\ \\hline \\theta_1=1 & ' + w[0].join(' & ') + ' \\\\ \\theta_1=2 & ' + w[1].join(' & ') + ' \\\\ \\theta_1=3 & ' + w[2].join(' & ') + '\\end{array}$$'

  return {
    intro: 'The parameter is ' + tex('\\theta=(\\theta_1,\\theta_2)') + ' with ' + tex('\\theta_1\\in\\{1,2,3\\}') + ' of interest and ' + tex('\\theta_2\\in\\{0,1\\}') + ' a nuisance parameter. After observing the data, the products ' + tex('f(x\\mid\\theta)\\pi(\\theta)') + ' are proportional to ' + table + ' Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the sum of the six entries, the normalising constant of the posterior. Give a whole number.',
        answer: tot, tolerance: tolInt, lecture: 7,
        explanation: 'The posterior probability of each cell is its entry divided by the sum ' + tex(tot) + '.',
      },
      {
        prompt: 'Integrate out the nuisance parameter: find the marginal posterior probability ' + tex('P(\\theta_1=2\\mid x)') + '.',
        answer: marg[1], tolerance: tol4, lecture: 7,
        explanation: 'Add the row: ' + tex('(' + w[1][0] + '+' + w[1][1] + ')/' + tot) + ' = ' + dec(marg[1]) + '.',
      },
      {
        prompt: 'What is the smallest number of values of ' + tex('\\theta_1') + ' whose marginal posterior probabilities add to at least ' + tex(dec(level)) + '? (Take the most probable values first.) Give a whole number.',
        answer: k, tolerance: tolInt, lecture: 7,
        explanation: 'The marginal posterior probabilities are ' + marg.map((m, i) => tex('\\theta_1=' + (i + 1) + ':' + dec(m))).join(', ') + '. In decreasing order they are ' + sorted.map(dec).join(', ') + ', and the first ' + k + ' add to ' + dec(sorted.slice(0, k).reduce((a, b) => a + b, 0)) + '.',
      },
      {
        prompt: 'A future observation ' + tex('Y') + ' is Bernoulli with ' + tex('P(Y=1\\mid\\theta)=\\theta_1/4') + '. Find the posterior predictive probability ' + tex('P(Y=1\\mid x)=E[\\theta_1/4\\mid x]') + '.',
        answer: pred, tolerance: tol4, lecture: 7,
        explanation: 'Average ' + tex('\\theta_1/4') + ' over the marginal posterior: ' + tex(marg.map((m, i) => dec(m) + '\\times' + (i + 1) + '/4').join('+')) + ' = ' + dec(pred) + '.',
      },
      {
        prompt: 'Find the posterior mean of ' + tex('\\theta_1') + '.',
        answer: meanTheta, tolerance: tol4, lecture: 7,
        explanation: tex(marg.map((m, i) => (i + 1) + '\\times' + dec(m)).join('+')) + ' = ' + dec(meanTheta) + '.',
      },
    ],
  }
}

export const genQ: LQGenerator = { id: 'inf-lq-q-nuisance', generate: (rng) => build(sample(rng)) }
