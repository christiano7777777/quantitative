// Statistical Inference (HKU SDST3602). 11 lectures, see src/data/topics.json. Theory and hand computation only.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: nine generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
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

// Blueprint: every attempt has one long question from each slot.
//   (lectures follow the HKU STAT3602 course-content order: decision theory 1-3, estimation theory 4-7, hypothesis testing 8-10, bootstrap 11)
//   slot 1: exponential families, UMVU estimation, information inequality, large-sample theory of the MLE (lectures 4-7)
//   slot 2: decision theory, Bayes and minimax rules, prior and posterior inference (lectures 1-3)
//   slot 3: UMP tests, UMP unbiased and conditional tests, asymptotic likelihood ratio, Wald and score tests, confidence sets, bootstrap (lectures 7-11)
const lqSlots = [[genA.id, genB.id], [genC.id, genD.id, genE.id], [genF.id, genG.id, genH.id, genI.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG, genH, genI], lqSlots,
  // used only by the lecture quizzes of lectures 4, 6 and 11 (src/content/lessons/inf), never by the topic test
  lectureLq: [genJ, genK, genL] }
export default bank
