// Information Theory. 11 lectures, see src/data/topics.json. This test covers theory and hand computations only (no coding).
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eight generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-joint'
import { genB } from './lq/b-xor'
import { genC } from './lq/c-huffman'
import { genD } from './lq/d-typical'
import { genE } from './lq/e-channel'
import { genF } from './lq/f-ratedist'
import { genG } from './lq/g-ba'
import { genH } from './lq/h-continuous'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: entropy, information measures, the I-measure, Huffman codes (lectures 1-4)
//   slot 2: typicality, channel capacity, joint typicality counting, rate-distortion (lectures 5-8)
//   slot 3: Blahut-Arimoto, differential entropy, water-filling (lectures 9-11)
const lqSlots = [[genA.id, genB.id, genC.id], [genD.id, genE.id, genF.id], [genG.id, genH.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG, genH], lqSlots }
export default bank
