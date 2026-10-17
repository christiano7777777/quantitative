// Experimental Design / A/B Testing. 11 lectures, see src/data/topics.json. This test covers theory and hand computations only (no coding).
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eight generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-anova'
import { genB } from './lq/b-factorial'
import { genC } from './lq/c-block'
import { genD } from './lq/d-abtest'
import { genE } from './lq/e-ratio'
import { genF } from './lq/f-sequential'
import { genG } from './lq/g-strata'
import { genH } from './lq/h-spending'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: classical design: replication, one-way ANOVA, factorials, blocking, aliasing (lectures 1-5)
//   slot 2: A/B test design and analysis: hypotheses, units, power, z tests, delta method (lectures 6-8)
//   slot 3: monitoring and pitfalls: alpha spending, always-valid inference, CUPED, stratification, SRM, clusters (lectures 9-11)
const lqSlots = [[genA.id, genB.id, genC.id], [genD.id, genE.id], [genF.id, genG.id, genH.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG, genH], lqSlots }
export default bank
