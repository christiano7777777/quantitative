// Statistical Inference (HKU SDST3602). 11 lectures, see src/data/topics.json. Theory and hand computation only.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eight generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-poisson'
import { genB } from './lq/b-exponential'
import { genC } from './lq/c-risk'
import { genD } from './lq/d-bayes-minimax'
import { genE } from './lq/e-gamma-poisson'
import { genF } from './lq/f-ump'
import { genG } from './lq/g-conditional'
import { genH } from './lq/h-confidence-bootstrap'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: exponential families, UMVU estimation, information inequality, large-sample theory of the MLE (lectures 1-4)
//   slot 2: decision theory, Bayes and minimax rules, prior and posterior inference (lectures 5-7)
//   slot 3: UMP tests, UMP unbiased and conditional tests, confidence sets, bootstrap (lectures 8-11)
const lqSlots = [[genA.id, genB.id], [genC.id, genD.id, genE.id], [genF.id, genG.id, genH.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG, genH], lqSlots }
export default bank
