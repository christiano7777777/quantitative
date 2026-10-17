// Algorithmic Trading. 11 lectures, see src/data/topics.json. This test covers theory and hand computations only (no coding).
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eight generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-signals'
import { genB } from './lq/b-pairs'
import { genC } from './lq/c-crosssection'
import { genD } from './lq/d-costs'
import { genE } from './lq/e-performance'
import { genF } from './lq/f-overfit'
import { genG } from './lq/g-sizing'
import { genH } from './lq/h-execution'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: strategy lifecycle, signals, statistical arbitrage, cross-sectional strategies (lectures 1-4)
//   slot 2: backtest biases, costs, performance evaluation, overfitting control (lectures 5-8)
//   slot 3: position sizing, execution algorithms, live monitoring (lectures 9-11)
const lqSlots = [[genA.id, genB.id, genC.id], [genD.id, genE.id, genF.id], [genG.id, genH.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG, genH], lqSlots }
export default bank
