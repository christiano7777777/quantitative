// Bayesian Statistics (HKU STAT4610). 15 lectures, see src/data/topics.json: lectures 1-10 follow the HKU lecture notes and
// tutorials (framework, conjugate models, summaries, Monte Carlo, importance sampling, Markov chains, Metropolis-Hastings), lecture 5
// (choosing priors) draws on the outline and past-paper topics, lectures 11-15 are the outline topics the notes have not reached yet.
// This test covers theory and hand computations only (no coding).
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eighteen generators in lq/, each tested against an independent computation (lq/lq.test.ts, lq/lecture.test.ts, lq/slides.test.ts).
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genS } from './lq/s-normalpost'
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
  lq: [genS, genLec2, genLec3, genLec4, genLec5, genLec6, genLec7, genLec8, genLec9, genLec10],
}
// Final test: 20 MC (per-lecture quota, so every lecture is asked) and three long questions, one per slot. Each long question is the
// single-story question of one lecture, drawn from the lectures of its slot; different slots cover different lectures.
bank.lqSlots = [
  ['bay-lq-s-normalpost', 'bay-lq-lec2', 'bay-lq-lec3', 'bay-lq-lec4'],
  ['bay-lq-lec5', 'bay-lq-lec6', 'bay-lq-lec7'],
  ['bay-lq-lec8', 'bay-lq-lec9', 'bay-lq-lec10'],
]
export default bank
