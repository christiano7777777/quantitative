// Nonparametric Statistics. 10 lectures, see src/data/topics.json.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eight generators in lq/, each tested against an independent computation in lq/lq.test.ts.
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

// Blueprint: every attempt has one long question from each slot.
//   slot 1: efficiency, sign and signed-rank tests, rank-sum and multi-sample tests (lectures 1-4)
//   slot 2: tests of fit, rank correlation, permutation tests (lectures 5-7)
//   slot 3: jackknife and bootstrap, density estimation, nonparametric regression (lectures 8-10)
const lqSlots = [[genA.id, genB.id], [genC.id, genD.id, genE.id], [genF.id, genG.id, genH.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG, genH], lqSlots }
export default bank
