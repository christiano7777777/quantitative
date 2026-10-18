// Bayesian Statistics. 12 lectures, see src/data/topics.json. This test covers theory and hand computations only (no coding).
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eight generators in lq/, each tested against an independent computation in lq/lq.test.ts.
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

// Blueprint: every attempt has one long question from each slot. (Lecture 3 is the choice of prior and lecture 4 posterior summaries, following the HKU STAT4610 order.)
//   slot 1: Bayesian framework, conjugate models, summaries and priors (lectures 1-4)
//   slot 2: model evaluation, Monte Carlo, importance sampling, Metropolis-Hastings (lectures 5-8)
//   slot 3: Gibbs sampling and diagnostics, Laplace and variational approximations, nonparametric Bayes (lectures 9-12)
const lqSlots = [[genA.id, genB.id], [genC.id, genD.id, genE.id], [genF.id, genG.id, genH.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG, genH], lqSlots }
export default bank
