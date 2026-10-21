// LaTeX & Research Writing (id latex). 10 lectures, see src/data/topics.json. A typed bank: no MC; every question is a
// typed answer graded by src/lib/blank-grader.ts (see CONTRIBUTING.md, "Typed-answer topics").
// Short questions: blanks/l<N>.ts (at least 10 per lecture). Long questions: one generator per lecture in lq/, each
// tested over many seeds in lq/lec<N>.test.ts.
import type { TestBank } from '../../../lib/types'
import { buildExamSlots } from '../../../lib/lq-composite'
import lessons from '../../lessons/latex'
import { blanksLec1 } from './blanks/l1'
import { blanksLec2 } from './blanks/l2'
import { blanksLec3 } from './blanks/l3'
import { blanksLec4 } from './blanks/l4'
import { blanksLec5 } from './blanks/l5'
import { blanksLec6 } from './blanks/l6'
import { blanksLec7 } from './blanks/l7'
import { blanksLec8 } from './blanks/l8'
import { blanksLec9 } from './blanks/l9'
import { blanksLec10 } from './blanks/l10'
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
  mc: [],
  blanks: [
    ...blanksLec1, ...blanksLec2, ...blanksLec3, ...blanksLec4, ...blanksLec5,
    ...blanksLec6, ...blanksLec7, ...blanksLec8, ...blanksLec9, ...blanksLec10,
  ],
  lq: [genLec1, genLec2, genLec3, genLec4, genLec5, genLec6, genLec7, genLec8, genLec9, genLec10],
}
// Final test: three long questions, one per slot; each slot covers its own range of lectures with composite questions (the
// first two parts of every lecture in the range), so every attempt asks something from every lecture.
bank.examSlots = buildExamSlots(bank, lessons, [[1, 2, 3, 4], [5, 6, 7], [8, 9, 10]])
export default bank
