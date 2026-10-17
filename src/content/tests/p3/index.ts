// Probability III (HKU MATH3603 / HKUST MAFS5020 style, measure-theoretic). 11 lectures, see src/data/topics.json.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: five generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-finite'
import { genB } from './lq/b-limits'
import { genC } from './lq/c-modes'
import { genD } from './lq/d-clt'
import { genE } from './lq/e-urn'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: finite spaces, simple random variables, limit interchange (lectures 1-4)
//   slot 2: Borel-Cantelli, modes, laws of large numbers, characteristic functions (5-8)
//   slot 3: CLT, conditional expectation, martingales (9-11; both generators touch all three)
const lqSlots = [[genA.id], [genB.id, genC.id], [genD.id, genE.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE], lqSlots }
export default bank
