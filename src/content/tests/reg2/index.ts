// Regression II (GLMs, penalised regression, splines, mixed models, robust regression). 11 lectures, see src/data/topics.json.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: seven generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-logistic'
import { genB } from './lq/b-poisson'
import { genD } from './lq/d-ridge'
import { genE } from './lq/e-lasso'
import { genF } from './lq/f-spline'
import { genG } from './lq/g-mixed'
import { genH } from './lq/h-huber'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: GLMs: exponential family, logistic, inference, counts, multinomial and ordinal (lectures 1-5)
//   slot 2: penalised regression: ridge, lasso, elastic net, tuning (lectures 6-8)
//   slot 3: splines, mixed-effects and robust regression (lectures 9-11, one generator each)
const lqSlots = [[genA.id, genB.id], [genD.id, genE.id], [genF.id, genG.id, genH.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genD, genE, genF, genG, genH], lqSlots }
export default bank
