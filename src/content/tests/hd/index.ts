// High-dimensional Statistics. 10 lectures, see src/data/topics.json.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eight generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-concentration'
import { genB } from './lq/b-bounds'
import { genC } from './lq/c-matrices'
import { genD } from './lq/d-spiked'
import { genE } from './lq/e-sparse'
import { genF } from './lq/f-recovery'
import { genG } from './lq/g-testing'
import { genH } from './lq/h-graphical'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: high-dimensional geometry, sub-Gaussian variables, concentration (lectures 1-3)
//   slot 2: covariance estimation, random matrices, spiked PCA, sparse regression (lectures 2, 4-7)
//   slot 3: sparse recovery, multiple testing, graphical models (lectures 8-10)
const lqSlots = [[genA.id, genB.id], [genC.id, genD.id, genE.id], [genF.id, genG.id, genH.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG, genH], lqSlots }
export default bank
