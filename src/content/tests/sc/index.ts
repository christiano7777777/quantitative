// Stochastic Calculus. 10 lectures, see src/data/topics.json. This test covers theory and hand computations only (no coding).
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eight generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-bm'
import { genB } from './lq/b-ito-sum'
import { genC } from './lq/c-ito-formula'
import { genD } from './lq/d-gbm'
import { genE } from './lq/e-ou-fk'
import { genF } from './lq/f-girsanov'
import { genG } from './lq/g-bs'
import { genH } from './lq/h-numeraire'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: Brownian motion, path properties, the Ito integral (lectures 1-3)
//   slot 2: Ito's formula, geometric Brownian motion, SDEs, Feynman-Kac (lectures 4-7)
//   slot 3: Girsanov, Black-Scholes, martingale representation and numeraires (lectures 8-10)
const lqSlots = [[genA.id, genB.id], [genC.id, genD.id, genE.id], [genF.id, genG.id, genH.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG, genH], lqSlots }
export default bank
