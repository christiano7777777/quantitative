// Causal Inference. 10 lectures, see src/data/topics.json.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eight generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-potential'
import { genB } from './lq/b-adjust'
import { genC } from './lq/c-ipw'
import { genD } from './lq/d-iv'
import { genE } from './lq/e-rd'
import { genF } from './lq/f-did'
import { genG } from './lq/g-synth'
import { genH } from './lq/h-sensitivity'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: potential outcomes, experiments, confounding, adjustment and matching (lectures 1-4)
//   slot 2: propensity scores, instrumental variables, regression discontinuity (lectures 5-7)
//   slot 3: difference-in-differences, synthetic control and panel methods, sensitivity and heterogeneity (lectures 8-10)
const lqSlots = [[genA.id, genB.id], [genC.id, genD.id, genE.id], [genF.id, genG.id, genH.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG, genH], lqSlots }
export default bank
