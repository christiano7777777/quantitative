// Research Methods. 11 lectures, see src/data/topics.json.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eight generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-hypotheses'
import { genB } from './lq/b-splits'
import { genC } from './lq/c-backtest'
import { genD } from './lq/d-metrics'
import { genE } from './lq/e-significance'
import { genF } from './lq/f-comparison'
import { genG } from './lq/g-robustness'
import { genH } from './lq/h-reporting'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: hypotheses, leakage, splits, multiple testing (lectures 1-4)
//   slot 2: backtesting costs, performance metrics, significance (lectures 5-7)
//   slot 3: model comparison, robustness, reproducibility and reporting (lectures 8-11)
const lqSlots = [[genA.id, genB.id], [genC.id, genD.id, genE.id], [genF.id, genG.id, genH.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG, genH], lqSlots }
export default bank
