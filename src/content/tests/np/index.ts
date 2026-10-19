// Nonparametric Statistics (HKU STAT3620). 21 lectures, see src/data/topics.json: lectures 1-16 follow the HKU lecture notes
// chapter by chapter, lectures 17-21 are the outline topics the notes have not reached yet.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: twenty-two generators in lq/, each tested against an independent computation (lq/lq.test.ts and lq/slides.test.ts).
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

// Blueprint: every attempt has one long question from each slot.
//   slot 1: one-sample and two-sample methods (lectures 1-7): intro/efficiency L, sign test M, order statistics and cdf intervals N and I, permutation E, Mann-Whitney and Hodges-Lehmann O, scale tests P, Kolmogorov-Smirnov C
//   slot 2: K-sample, paired, block and association methods (lectures 8-13): Kruskal-Wallis Q, multiple comparisons R, signed-rank A, rank-sum and K-sample B, blocks S, rank correlation D
//   slot 3: resampling, smoothing and ranking (lectures 14-21): bootstrap T, U, V, jackknife F, functionals J, density G, regression H, ranking K
const lqSlots = [
  [genL.id, genM.id, genN.id, genI.id, genE.id, genO.id, genP.id, genC.id],
  [genQ.id, genR.id, genA.id, genB.id, genS.id, genD.id],
  [genT.id, genU.id, genV.id, genF.id, genJ.id, genG.id, genH.id, genK.id],
]

const bank: TestBank = {
  mc: mcJson as MCQuestion[],
  lq: [genA, genB, genC, genD, genE, genF, genG, genH, genI, genJ, genK, genL, genM, genN, genO, genP, genQ, genR, genS, genT, genU, genV],
  lqSlots,
}
export default bank
