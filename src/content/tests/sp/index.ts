// Stochastic Processes (HKU SDST3603 / CUHK STAT3007). 11 lectures, see src/data/topics.json.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: five generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-dtmc'
import { genB } from './lq/b-ruin'
import { genC } from './lq/c-poisson'
import { genD } from './lq/d-ctmc-queue'
import { genE } from './lq/e-branching'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: discrete-time chains (lectures 1-4)      slot 2: ruin, branching, martingales (5, 10, 11)
//   slot 3: continuous time, queues, renewal (6-9)
const lqSlots = [[genA.id], [genB.id, genE.id], [genC.id, genD.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE], lqSlots }
export default bank
