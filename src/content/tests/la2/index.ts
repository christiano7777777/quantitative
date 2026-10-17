// Linear Algebra II. 10 lectures, see src/data/topics.json.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eight generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-spaces'
import { genB } from './lq/b-eigen'
import { genC } from './lq/c-diag'
import { genD } from './lq/d-inner'
import { genE } from './lq/e-lsq'
import { genF } from './lq/f-adjoint'
import { genG } from './lq/g-spectral'
import { genH } from './lq/h-svd'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: polynomial spaces and change of basis, eigenvalues, diagonalisation (lectures 1-4)
//   slot 2: inner products, projection and least squares, adjoints and normal operators (lectures 5-7)
//   slot 3: spectral theorem and quadratic forms, SVD and PCA (lectures 8-10)
const lqSlots = [[genA.id, genB.id, genC.id], [genD.id, genE.id, genF.id], [genG.id, genH.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG, genH], lqSlots }
export default bank
