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
//   slot 1: order statistics and efficiency (1), sign and signed-rank tests (2), two-sample rank tests (3), designed experiments (4): generators I, A, B
//   slot 2: goodness-of-fit (5), association and trend (6), permutation tests (7), functionals, plug-in and DKW (8): generators C, D, E, J
//   slot 3: jackknife and bootstrap (9), kernel density estimation (10), nonparametric regression (11), ranking data (12): generators F, G, H, K
const lqSlots = [[genA.id, genB.id, genI.id], [genC.id, genD.id, genE.id, genJ.id], [genF.id, genG.id, genH.id, genK.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG, genH, genI, genJ, genK], lqSlots }
export default bank
