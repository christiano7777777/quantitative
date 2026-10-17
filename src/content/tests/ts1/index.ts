// Time Series I (ARMA/ARIMA models, estimation and forecasting). 10 lectures, see src/data/topics.json.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eight generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-sample'
import { genB } from './lq/b-ma'
import { genC } from './lq/c-ar'
import { genD } from './lq/d-arma'
import { genE } from './lq/e-forecast'
import { genF } from './lq/f-estimation'
import { genG } from './lq/g-differencing'
import { genH } from './lq/h-seasonal'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: stationarity, sample ACF, linear processes and MA models (lectures 1-3)
//   slot 2: AR and ARMA models, Yule-Walker, ACF/PACF and forecasting (lectures 4-6)
//   slot 3: estimation, differencing and unit roots, seasonal models, diagnostics (lectures 7-10)
const lqSlots = [[genA.id, genB.id], [genC.id, genD.id, genE.id], [genF.id, genG.id, genH.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG, genH], lqSlots }
export default bank
