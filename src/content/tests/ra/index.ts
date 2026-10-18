// Real Analysis (CityU MA4542 style: measure and Lebesgue integration). 10 lectures, see src/data/topics.json.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eight generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-limits'
import { genB } from './lq/b-sigma'
import { genC } from './lq/c-outer'
import { genD } from './lq/d-simple'
import { genE } from './lq/e-limits'
import { genF } from './lq/f-riemann'
import { genG } from './lq/g-lp'
import { genH } from './lq/h-fubini'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: set limits, sigma-algebras, outer measure, Lebesgue measure (lectures 1-4)
//   slot 2: simple functions, convergence theorems, Lebesgue vs Riemann (5-8)
//   slot 3: L^p norms, product measure and Fubini (9-10)
const lqSlots = [[genA.id, genB.id, genC.id], [genD.id, genE.id, genF.id], [genG.id, genH.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG, genH], lqSlots }
export default bank
