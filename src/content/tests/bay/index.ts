// Bayesian Statistics (HKU STAT4610). 15 lectures, see src/data/topics.json: lectures 1-10 follow the HKU lecture notes and
// tutorials (framework, conjugate models, summaries, Monte Carlo, importance sampling, Markov chains, Metropolis-Hastings), lecture 5
// (choosing priors) draws on the outline and past-paper topics, lectures 11-15 are the outline topics the notes have not reached yet.
// This test covers theory and hand computations only (no coding).
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eighteen generators in lq/, each tested against an independent computation (lq/lq.test.ts, lq/lecture.test.ts, lq/slides.test.ts).
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import lessons from '../../lessons/bay'
import { buildExamSlots } from '../../../lib/lq-composite'
import { genA } from './lq/a-bayes'
import { genB } from './lq/b-posterior'
import { genC } from './lq/c-evidence'
import { genD } from './lq/d-montecarlo'
import { genE } from './lq/e-mh'
import { genF } from './lq/f-gibbs'
import { genG } from './lq/g-approx'
import { genH } from './lq/h-nonparam'
import { genI } from './lq/i-prior'
import { genJ } from './lq/j-summary'
import { genK } from './lq/k-normal'
import { genL } from './lq/l-conjugate'
import { genM } from './lq/m-jeffreys'
import { genN } from './lq/n-inverse'
import { genO } from './lq/o-is'
import { genP } from './lq/p-markov'
import { genQ } from './lq/q-cavi'
import { genR } from './lq/r-mc'

const bank: TestBank = {
  mc: mcJson as MCQuestion[],
  lq: [genA, genB, genC, genD, genE, genF, genG, genH, genI, genJ, genK, genL, genM, genN, genO, genP, genQ, genR],
}
// Final test: three long questions, one per slot; each slot covers its own range of lectures and offers three composite
// questions (first two parts of one section of every lecture in the range), so every attempt asks something from every lecture.
bank.examSlots = buildExamSlots(bank, lessons, [[1, 2, 3, 4], [5, 6, 7], [8, 9, 10]])
export default bank
