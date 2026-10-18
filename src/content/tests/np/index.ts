// Nonparametric Statistics (HKU STAT3620). 12 lectures, see src/data/topics.json.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eleven generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
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

// Blueprint: every attempt has one long question from each slot.
//   (lectures follow the HKU STAT3620 topic order: order statistics 1, goodness-of-fit 2, rank tests 3-4, designed experiments 5, permutation 6, trend and association 7, jackknife and bootstrap 8, regression 9, ranking data 10, functionals 11, kernel estimation 12)
//   slot 1: order statistics and efficiency, sign and signed-rank tests, two-sample rank tests, designed experiments: generators I, A, B
//   slot 2: goodness-of-fit, association and trend, permutation tests, functionals, plug-in and DKW: generators C, D, E, J
//   slot 3: jackknife and bootstrap, kernel density estimation, nonparametric regression, ranking data: generators F, G, H, K
const lqSlots = [[genA.id, genB.id, genI.id], [genC.id, genD.id, genE.id, genJ.id], [genF.id, genG.id, genH.id, genK.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG, genH, genI, genJ, genK], lqSlots }
export default bank
