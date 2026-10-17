// Probability II (HKU SDST2602). 11 lectures, see src/data/topics.json.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: seven generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-uniform'
import { genB } from './lq/b-exponential'
import { genD } from './lq/d-binomial'
import { genE } from './lq/e-twosample'
import { genF } from './lq/f-chisq'
import { genG } from './lq/g-poisson'
import { genH } from './lq/h-clt'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: sampling, large-sample theory and estimation: moments, MLE, MSE, Chebyshev, sufficiency (lectures 1-6; every generator here has a lecture 2 part)
//   slot 2: confidence intervals, error rates, power, t and F tests (lectures 7, 8, 10)
//   slot 3: likelihood ratio and Neyman-Pearson tests, chi-square tests (lectures 9, 11, with 4 and 8)
const lqSlots = [[genA.id, genB.id, genH.id], [genD.id, genE.id], [genF.id, genG.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genD, genE, genF, genG, genH], lqSlots }
export default bank
