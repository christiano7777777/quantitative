// Optimization. 10 lectures, see src/data/topics.json. This test covers the theory and the hand computations only (no coding).
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eight generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-graphical'
import { genB } from './lq/b-twophase'
import { genC } from './lq/c-duality'
import { genD } from './lq/d-network'
import { genE } from './lq/e-integer'
import { genF } from './lq/f-quadratic'
import { genG } from './lq/g-kkt'
import { genH } from './lq/h-portfolio'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: LP models, the graphical method, basic feasible solutions, the simplex and two-phase methods (lectures 1-3)
//   slot 2: duality, sensitivity analysis, network flows, integer programming (lectures 4-8)
//   slot 3: convex optimisation, KKT conditions, quadratic programming and portfolios (lectures 9-10)
const lqSlots = [[genA.id, genB.id], [genC.id, genD.id, genE.id], [genF.id, genG.id, genH.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG, genH], lqSlots }
export default bank
