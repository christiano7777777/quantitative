// Monte Carlo Methods. 11 lectures, see src/data/topics.json. This test covers theory and hand computations only (no coding).
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: seven generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-lcg'
import { genB } from './lq/b-special'
import { genC } from './lq/c-integration'
import { genD } from './lq/d-variance'
import { genE } from './lq/e-sde'
import { genF } from './lq/f-gibbs'
import { genG } from './lq/g-bootstrap'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: random numbers, inverse transform, rejection, special methods (lectures 1-3)
//   slot 2: Monte Carlo integration, variance reduction, SDE schemes, Metropolis-Hastings (lectures 4-8)
//   slot 3: Gibbs sampling, diagnostics, bootstrap (lectures 9-11)
const lqSlots = [[genA.id, genB.id], [genC.id, genD.id, genE.id], [genF.id, genG.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG], lqSlots }
export default bank
