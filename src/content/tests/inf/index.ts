// Statistical Inference (HKU SDST3602/STAT3602). 18 lectures, see src/data/topics.json: lectures 1-12 follow the HKU lecture notes
// chapter by chapter (decision theory, Bayesian approach, exponential families, sufficiency and completeness), lectures 13-18 are
// the outline topics the notes have not reached yet. Theory and hand computation only.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: twenty generators in lq/, each tested against an independent computation (lq/lq.test.ts, lq/lecture.test.ts, lq/slides.test.ts).
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
import { genM } from './lq/m-decision'
import { genN } from './lq/n-bayes'
import { genO } from './lq/o-riskset'
import { genP } from './lq/p-bayestest'
import { genQ } from './lq/q-nuisance'
import { genR } from './lq/r-expfam'
import { genS } from './lq/s-natural'
import { genT } from './lq/t-likelihood'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: decision theory and the Bayesian approach (lectures 1-7): risk and rules C, M, Bayes rules and risk sets N, D, O, posterior inference E, P, Q
//   slot 2: exponential families, sufficiency, completeness, information and the MLE (lectures 8-14): R, S, J, T, A, K, B
//   slot 3: tests, confidence sets and the bootstrap (lectures 15-18): F, G, H, I, L
const lqSlots = [
  [genC.id, genM.id, genN.id, genD.id, genO.id, genE.id, genP.id, genQ.id],
  [genR.id, genS.id, genJ.id, genT.id, genA.id, genK.id, genB.id],
  [genF.id, genG.id, genH.id, genI.id, genL.id],
]

const bank: TestBank = {
  mc: mcJson as MCQuestion[],
  lq: [genA, genB, genC, genD, genE, genF, genG, genH, genI, genJ, genK, genL, genM, genN, genO, genP, genQ, genR, genS, genT],
  lqSlots,
}
export default bank
