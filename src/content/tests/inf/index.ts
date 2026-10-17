// Statistical Inference (HKU STAT3600 / HKUST MATH4423 style). 11 lectures, see src/data/topics.json.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: six generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-uniform'
import { genB } from './lq/b-exponential'
import { genD } from './lq/d-binomial'
import { genE } from './lq/e-twosample'
import { genF } from './lq/f-chisq'
import { genG } from './lq/g-poisson'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: estimation: sampling distributions, moments, MLE, MSE, sufficiency, information (lectures 1-6)
//   slot 2: confidence intervals, error rates, power, t and F tests (lectures 7, 8, 10)
//   slot 3: likelihood ratio and Neyman-Pearson tests, chi-square tests (lectures 9, 11, with 3 and 8)
const lqSlots = [[genA.id, genB.id], [genD.id, genE.id], [genF.id, genG.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genD, genE, genF, genG], lqSlots }
export default bank
