// Learning Theory. 10 lectures, see src/data/topics.json. This test covers theory and hand computations only (no coding).
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eight generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-finite'
import { genB } from './lq/b-pac'
import { genC } from './lq/c-complexity'
import { genD } from './lq/d-bounds'
import { genE } from './lq/e-exact'
import { genF } from './lq/f-online'
import { genG } from './lq/g-learning'
import { genH } from './lq/h-rates'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: PAC sample complexity, uniform convergence, VC dimension and growth functions (lectures 1-3)
//   slot 2: Rademacher complexity, margin bounds, SVM geometry and boosting (lectures 4-6)
//   slot 3: online learning, stability, convex learning and modern theory (lectures 7-10)
const lqSlots = [[genA.id, genB.id], [genC.id, genD.id, genE.id], [genF.id, genG.id, genH.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG, genH], lqSlots }
export default bank
