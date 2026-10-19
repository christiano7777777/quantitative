// inf lecture 4 (Bayesian intervals, prediction, nuisance parameters): one story. A discrete joint posterior for a parameter of
// interest theta and a nuisance parameter phi, given as a table of counts out of 20: marginals, a smallest credible set for phi,
// the posterior mean of phi, a conditional probability, and the posterior predictive probability of a success.
// Lecture 4.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

/** cells[i][j]: posterior weight (out of 20) of theta = th[i], phi = j. */
export interface Params { cells: number[][]; th: [number, number] }

export function sample(rng: Rng): Params {
  for (;;) {
    // split 20 into six cells, each at least 1, with distinct phi-marginals so that the smallest credible set is unique
    const cuts = rng.sample(Array.from({ length: 19 }, (_, i) => i + 1), 5).sort((a, b) => a - b)
    const w = [cuts[0], cuts[1] - cuts[0], cuts[2] - cuts[1], cuts[3] - cuts[2], cuts[4] - cuts[3], 20 - cuts[4]]
    const cells = [w.slice(0, 3), w.slice(3)]
    const phi = [0, 1, 2].map((j) => cells[0][j] + cells[1][j])
    if (new Set(phi).size === 3 && Math.max(...phi) <= 12) return { cells, th: rng.pick<[number, number]>([[0.2, 0.6], [0.3, 0.7], [0.1, 0.5]]) }
  }
}

export function build({ cells, th }: Params): LQInstance {
  const T = 20
  const pTheta2 = (cells[1][0] + cells[1][1] + cells[1][2]) / T
  const phiW = [0, 1, 2].map((j) => cells[0][j] + cells[1][j])
  const pPhi1 = phiW[1] / T
  // smallest set of phi values with posterior probability at least 0.8: add the largest marginal values until the total reaches 0.8
  const order = [0, 1, 2].sort((x, y) => phiW[y] - phiW[x])
  let acc = 0, size = 0
  for (const j of order) { acc += phiW[j]; size++; if (acc / T >= 0.8) break }
  const meanPhi = (phiW[1] + 2 * phiW[2]) / T
  const cond = cells[0][2] / (cells[0][0] + cells[0][1] + cells[0][2])
  const pred = th[0] * (1 - pTheta2) + th[1] * pTheta2

  return {
    intro: 'A parameter of interest ' + tex('\\theta') + ' takes the values ' + tex(th[0]) + ' and ' + tex(th[1]) + ', and a nuisance parameter ' + tex('\\phi') + ' takes the values ' + tex('0,1,2') + '. After the data are seen, the posterior probabilities ' + tex('P(\\theta,\\phi\\mid x)') + ' are, in twentieths, ' + tex('\\theta=' + th[0] + '\\!:\\ ' + cells[0].join(',\\ ')) + ' and ' + tex('\\theta=' + th[1] + '\\!:\\ ' + cells[1].join(',\\ ')) + ' for ' + tex('\\phi=0,1,2') + ' respectively. A future trial succeeds with probability ' + tex('\\theta') + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the marginal posterior probability ' + tex('P(\\theta=' + th[1] + '\\mid x)') + ' by adding over the nuisance parameter.',
        answer: pTheta2, tolerance: tol4, lecture: 4,
        explanation: tex('(' + cells[1].join('+') + ')/20') + ' = ' + dec(pTheta2) + '. A nuisance parameter is handled by integrating (here summing) it out of the joint posterior.',
      },
      {
        prompt: 'Find the marginal posterior probability ' + tex('P(\\phi=1\\mid x)') + '.',
        answer: pPhi1, tolerance: tol4, lecture: 4,
        explanation: tex('(' + cells[0][1] + '+' + cells[1][1] + ')/20') + ' = ' + dec(pPhi1) + '.',
      },
      {
        prompt: 'A credible set for ' + tex('\\phi') + ' with posterior probability at least ' + tex('0.8') + ' is smallest when it contains the values with the largest marginal posterior probability. How many values of ' + tex('\\phi') + ' does the smallest such set contain? Give a whole number.',
        answer: size, tolerance: { abs: 0.25 }, lecture: 4,
        explanation: 'The marginal probabilities of ' + tex('\\phi=0,1,2') + ' are ' + phiW.map((w2) => w2 + '/20').join(', ') + '. Adding from the largest down: ' + order.map((j) => tex('\\phi=' + j)).join(', ') + ' reaches ' + dec(acc / T) + ' after ' + size + ' value(s).',
      },
      {
        prompt: 'Find the posterior mean of ' + tex('\\phi') + '.',
        answer: meanPhi, tolerance: tol4, lecture: 4,
        explanation: tex('0\\times' + dec(phiW[0] / T) + '+1\\times' + dec(phiW[1] / T) + '+2\\times' + dec(phiW[2] / T)) + ' = ' + dec(meanPhi) + '.',
      },
      {
        prompt: 'Find the conditional posterior probability ' + tex('P(\\phi=2\\mid\\theta=' + th[0] + ',\\ x)') + '.',
        answer: cond, tolerance: tol4, lecture: 4,
        explanation: tex(cells[0][2] + '/(' + cells[0].join('+') + ')') + ' = ' + dec(cond) + '.',
      },
      {
        prompt: 'Find the posterior predictive probability that the next trial succeeds, ' + tex('P(\\text{success}\\mid x)=\\sum_\\theta\\theta\\,P(\\theta\\mid x)') + '.',
        answer: pred, tolerance: tol4, lecture: 4,
        explanation: tex(dec(th[0]) + '\\times' + dec(1 - pTheta2) + '+' + dec(th[1]) + '\\times' + dec(pTheta2)) + ' = ' + dec(pred) + '. The prediction averages over the posterior uncertainty about ' + tex('\\theta') + '.',
      },
    ],
  }
}

export const genLec4: LQGenerator = { id: 'inf-lq-lec4', generate: (rng) => build(sample(rng)) }
