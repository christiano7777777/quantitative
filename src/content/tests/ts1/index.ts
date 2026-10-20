// Time Series I (ARMA/ARIMA models, estimation and forecasting). 10 lectures, see src/data/topics.json.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eight generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import lessons from '../../lessons/ts1'
import { buildExamSlots } from '../../../lib/lq-composite'
import { genA } from './lq/a-sample'
import { genB } from './lq/b-ma'
import { genC } from './lq/c-ar'
import { genD } from './lq/d-arma'
import { genE } from './lq/e-forecast'
import { genF } from './lq/f-estimation'
import { genG } from './lq/g-differencing'
import { genH } from './lq/h-seasonal'
import { genLec1 } from './lq/lec1'
import { genLec2 } from './lq/lec2'
import { genLec3 } from './lq/lec3'
import { genLec4 } from './lq/lec4'
import { genLec5 } from './lq/lec5'
import { genLec6 } from './lq/lec6'
import { genLec7 } from './lq/lec7'
import { genLec8 } from './lq/lec8'
import { genLec9 } from './lq/lec9'
import { genLec10 } from './lq/lec10'

const bank: TestBank = {
  mc: mcJson as MCQuestion[],
  lq: [genA, genB, genC, genD, genE, genF, genG, genH, genLec1, genLec2, genLec3, genLec4, genLec5, genLec6, genLec7, genLec8, genLec9, genLec10],
}
// Final test: three long questions, one per slot; each slot covers its own range of lectures and offers three composite
// questions (first two parts of one section of every lecture in the range), so every attempt asks something from every lecture.
bank.examSlots = buildExamSlots(bank, lessons, [[1, 2, 3, 4], [5, 6, 7], [8, 9, 10]])
export default bank
