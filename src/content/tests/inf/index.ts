// Statistical Inference (HKU SDST3602/STAT3602). 18 lectures, see src/data/topics.json: lectures 1-12 follow the HKU lecture notes
// chapter by chapter (decision theory, Bayesian approach, exponential families, sufficiency and completeness), lectures 13-18 are
// the outline topics the notes have not reached yet. Theory and hand computation only.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: twenty generators in lq/, each tested against an independent computation (lq/lq.test.ts, lq/lecture.test.ts, lq/slides.test.ts).
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import lessons from '../../lessons/inf'
import { buildExamSlots } from '../../../lib/lq-composite'
import { genA } from './lq/a-poisson'
import { genB } from './lq/b-exponential'
import { genC } from './lq/c-risk'
import { genD } from './lq/d-bayes-minimax'
import { genE } from './lq/e-gamma-poisson'
import { genF } from './lq/f-ump'
import { genG } from './lq/g-conditional'
import { genH } from './lq/h-confidence-bootstrap'
import { genI } from './lq/i-wilks'
import { genJ } from './lq/j-sufficiency'
import { genK } from './lq/k-information'
import { genL } from './lq/l-bootstrap'
import { genM } from './lq/m-decision'
import { genN } from './lq/n-bayes'
import { genO } from './lq/o-riskset'
import { genP } from './lq/p-bayestest'
import { genQ } from './lq/q-nuisance'
import { genR } from './lq/r-expfam'
import { genS } from './lq/s-natural'
import { genT } from './lq/t-likelihood'

const bank: TestBank = {
  mc: mcJson as MCQuestion[],
  lq: [genA, genB, genC, genD, genE, genF, genG, genH, genI, genJ, genK, genL, genM, genN, genO, genP, genQ, genR, genS, genT],
}
// Final test: three long questions, one per slot; each slot covers its own range of lectures and offers three composite
// questions (first two parts of one section of every lecture in the range), so every attempt asks something from every lecture.
bank.examSlots = buildExamSlots(bank, lessons, [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]])
export default bank
