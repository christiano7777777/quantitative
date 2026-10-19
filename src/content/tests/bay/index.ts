// Bayesian Statistics (HKU STAT4610). 15 lectures, see src/data/topics.json: lectures 1-10 follow the HKU lecture notes and
// tutorials (framework, conjugate models, summaries, Monte Carlo, importance sampling, Markov chains, Metropolis-Hastings), lecture 5
// (choosing priors) draws on the outline and past-paper topics, lectures 11-15 are the outline topics the notes have not reached yet.
// This test covers theory and hand computations only (no coding).
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eighteen generators in lq/, each tested against an independent computation (lq/lq.test.ts, lq/lecture.test.ts, lq/slides.test.ts).
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-bayes'
import { genB } from './lq/b-posterior'
import { genC } from './lq/c-evidence'
import { genD } from './lq/d-montecarlo'
import { genE } from './lq/e-mh'
import { genF } from './lq/f-gibbs'
import { genG } from './lq/g-approx'
import { genH } from './lq/h-nonparam'
import { genI } from './lq/i-prior'
import { genJ } from './lq/j-summary'
import { genK } from './lq/k-normal'
import { genL } from './lq/l-conjugate'
import { genM } from './lq/m-jeffreys'
import { genN } from './lq/n-inverse'
import { genO } from './lq/o-is'
import { genP } from './lq/p-markov'
import { genQ } from './lq/q-cavi'
import { genR } from './lq/r-mc'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: the Bayesian framework (lectures 1-5): Bayes' theorem A, normal model K, conjugate models L and B, summaries J, priors I and M
//   slot 2: simulation (lectures 6-11): Monte Carlo R, D, inverse transform N, importance sampling O, Markov chains P, Metropolis-Hastings E, Gibbs and diagnostics F
//   slot 3: evaluation and approximation (lectures 12-15): evidence C, Laplace and variational Bayes G, Q, nonparametric Bayes H
const lqSlots = [
  [genA.id, genK.id, genL.id, genB.id, genJ.id, genI.id, genM.id],
  [genR.id, genD.id, genN.id, genO.id, genP.id, genE.id, genF.id],
  [genC.id, genG.id, genQ.id, genH.id],
]

const bank: TestBank = {
  mc: mcJson as MCQuestion[],
  lq: [genA, genB, genC, genD, genE, genF, genG, genH, genI, genJ, genK, genL, genM, genN, genO, genP, genQ, genR],
  lqSlots,
}
export default bank
