// Machine Learning. 11 lectures, see src/data/topics.json. This test covers the theory and the hand computations only (no coding).
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eight generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-linear'
import { genB } from './lq/b-selection'
import { genC } from './lq/c-svm'
import { genD } from './lq/d-trees'
import { genE } from './lq/e-ensemble'
import { genF } from './lq/f-pca'
import { genG } from './lq/g-kmeans'
import { genH } from './lq/h-metrics'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: generalisation, linear and logistic models, model selection, k-NN and kernels (lectures 1-4)
//   slot 2: SVMs, trees, ensembles and generative models (lectures 5-8)
//   slot 3: dimensionality reduction, clustering and evaluation (lectures 9-11)
const lqSlots = [[genA.id, genB.id], [genC.id, genD.id, genE.id], [genF.id, genG.id, genH.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG, genH], lqSlots }
export default bank
