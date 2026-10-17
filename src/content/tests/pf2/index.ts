// Portfolio & Asset Pricing II. 10 lectures, see src/data/topics.json.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eight generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-factors'
import { genB } from './lq/b-timeseries'
import { genC } from './lq/c-sdf'
import { genD } from './lq/d-covariance'
import { genE } from './lq/e-bl'
import { genF } from './lq/f-riskparity'
import { genG } from './lq/g-costs'
import { genH } from './lq/h-brinson'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: factor models, Fama-French factors, time-series and cross-sectional tests (lectures 1-3)
//   slot 2: SDF pricing, covariance estimation, Black-Litterman (lectures 4-6)
//   slot 3: risk parity, costs and decay, performance attribution (lectures 7-10)
const lqSlots = [[genA.id, genB.id], [genC.id, genD.id, genE.id], [genF.id, genG.id, genH.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG, genH], lqSlots }
export default bank
