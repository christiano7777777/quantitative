// Nonparametric Statistics (HKU STAT3620). 21 lectures, see src/data/topics.json: lectures 1-16 follow the HKU lecture notes
// chapter by chapter, lectures 17-21 are the outline topics the notes have not reached yet.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: twenty-two generators in lq/, each tested against an independent computation (lq/lq.test.ts and lq/slides.test.ts).
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genW } from './lq/w-signci'
import { genLec2 } from './lq/lec2'
import { genLec3 } from './lq/lec3'
import { genLec4 } from './lq/lec4'
import { genLec5 } from './lq/lec5'
import { genLec6 } from './lq/lec6'
import { genLec7 } from './lq/lec7'
import { genLec8 } from './lq/lec8'
import { genLec9 } from './lq/lec9'
import { genLec10 } from './lq/lec10'
import { genLec11 } from './lq/lec11'
import { genLec12 } from './lq/lec12'

const bank: TestBank = {
  mc: mcJson as MCQuestion[],
  lq: [genW, genLec2, genLec3, genLec4, genLec5, genLec6, genLec7, genLec8, genLec9, genLec10, genLec11, genLec12],
}
// Final test: 20 MC (per-lecture quota, so every lecture is asked) and three long questions, one per slot. Each long question is the
// single-story question of one lecture, drawn from the lectures of its slot; different slots cover different lectures.
bank.lqSlots = [
  ['np-lq-w-signci', 'np-lq-lec2', 'np-lq-lec3', 'np-lq-lec4'],
  ['np-lq-lec5', 'np-lq-lec6', 'np-lq-lec7', 'np-lq-lec8'],
  ['np-lq-lec9', 'np-lq-lec10', 'np-lq-lec11', 'np-lq-lec12'],
]
export default bank
