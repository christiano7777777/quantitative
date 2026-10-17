// Microstructure II. 10 lectures, see src/data/topics.json. This test covers theory and hand computations only (no coding).
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eight generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-kyle'
import { genB } from './lq/b-sequential'
import { genC } from './lq/c-lob'
import { genD } from './lq/d-almgren'
import { genE } from './lq/e-hjb'
import { genF } from './lq/f-quotes'
import { genG } from './lq/g-calibration'
import { genH } from './lq/h-propagator'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: Kyle, Glosten-Milgrom and Hawkes order flow (lectures 1-3)
//   slot 2: limit-order-book queues, Almgren-Chriss and HJB execution (lectures 4-6)
//   slot 3: market making, inventory, impact kernels and calibration (lectures 7-10)
const lqSlots = [[genA.id, genB.id], [genC.id, genD.id, genE.id], [genF.id, genG.id, genH.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG, genH], lqSlots }
export default bank
