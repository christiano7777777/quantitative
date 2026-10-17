// Time Series II (volatility, multivariate and state-space models). 10 lectures, see src/data/topics.json.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eight generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-returns'
import { genB } from './lq/b-garch'
import { genD } from './lq/d-realised'
import { genE } from './lq/e-var'
import { genF } from './lq/f-cointegration'
import { genG } from './lq/g-kalman'
import { genH } from './lq/h-regime'
import { genI } from './lq/i-spectral'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: volatility models: stylised facts, ARCH, GARCH, extensions (lectures 1-4)
//   slot 2: realised volatility and multivariate series: VAR, cointegration (lectures 5-7)
//   slot 3: state space, regime switching and spectral analysis (lectures 8-10)
const lqSlots = [[genA.id, genB.id], [genD.id, genE.id, genF.id], [genG.id, genH.id, genI.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genD, genE, genF, genG, genH, genI], lqSlots }
export default bank
