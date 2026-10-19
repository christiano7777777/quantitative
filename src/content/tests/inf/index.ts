// Statistical Inference (HKU SDST3602/STAT3602). 18 lectures, see src/data/topics.json: lectures 1-12 follow the HKU lecture notes
// chapter by chapter (decision theory, Bayesian approach, exponential families, sufficiency and completeness), lectures 13-18 are
// the outline topics the notes have not reached yet. Theory and hand computation only.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: twenty generators in lq/, each tested against an independent computation (lq/lq.test.ts, lq/lecture.test.ts, lq/slides.test.ts).
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genU } from './lq/u-decision'
import { genV } from './lq/v-bayesrisk'
import { genLec3 } from './lq/lec3'
import { genLec4 } from './lq/lec4'
import { genLec5 } from './lq/lec5'
import { genLec6 } from './lq/lec6'
import { genLec7 } from './lq/lec7'
import { genLec8 } from './lq/lec8'
import { genLec9 } from './lq/lec9'
import { genLec10 } from './lq/lec10'
import { genLec11 } from './lq/lec11'

const bank: TestBank = {
  mc: mcJson as MCQuestion[],
  lq: [genU, genV, genLec3, genLec4, genLec5, genLec6, genLec7, genLec8, genLec9, genLec10, genLec11],
}
// Final test: 20 MC (per-lecture quota, so every lecture is asked) and three long questions, one per slot. Each long question is the
// single-story question of one lecture, drawn from the lectures of its slot; different slots cover different lectures.
bank.lqSlots = [
  ['inf-lq-u-decision', 'inf-lq-v-bayesrisk', 'inf-lq-lec3', 'inf-lq-lec4'],
  ['inf-lq-lec5', 'inf-lq-lec6', 'inf-lq-lec7', 'inf-lq-lec8'],
  ['inf-lq-lec9', 'inf-lq-lec10', 'inf-lq-lec11'],
]
export default bank
