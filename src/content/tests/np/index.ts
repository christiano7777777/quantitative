// Nonparametric Statistics (HKU STAT3620). 21 lectures, see src/data/topics.json: lectures 1-16 follow the HKU lecture notes
// chapter by chapter, lectures 17-21 are the outline topics the notes have not reached yet.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: twenty-two generators in lq/, each tested against an independent computation (lq/lq.test.ts and lq/slides.test.ts).
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import lessons from '../../lessons/np'
import { buildExamSlots } from '../../../lib/lq-composite'
import { genA } from './lq/a-signed'
import { genB } from './lq/b-ranksum'
import { genC } from './lq/c-ks'
import { genD } from './lq/d-rankcorr'
import { genE } from './lq/e-permutation'
import { genF } from './lq/f-jackknife'
import { genG } from './lq/g-kde'
import { genH } from './lq/h-regression'
import { genI } from './lq/i-orderstat'
import { genJ } from './lq/j-functional'
import { genK } from './lq/k-ranking'
import { genL } from './lq/l-intro'
import { genM } from './lq/m-sign'
import { genN } from './lq/n-cicdf'
import { genO } from './lq/o-hl'
import { genP } from './lq/p-scale'
import { genQ } from './lq/q-kw'
import { genR } from './lq/r-mult'
import { genS } from './lq/s-block'
import { genT } from './lq/t-bootci'
import { genU } from './lq/u-pivotal'
import { genV } from './lq/v-bootreg'

const bank: TestBank = {
  mc: mcJson as MCQuestion[],
  lq: [genA, genB, genC, genD, genE, genF, genG, genH, genI, genJ, genK, genL, genM, genN, genO, genP, genQ, genR, genS, genT, genU, genV],
}
// Final test: three long questions, one per slot; each slot covers its own range of lectures and offers three composite
// questions (first two parts of one section of every lecture in the range), so every attempt asks something from every lecture.
bank.examSlots = buildExamSlots(bank, lessons, [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]])
export default bank
