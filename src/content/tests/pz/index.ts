// Probability Puzzles. 10 lectures, see src/data/topics.json.
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eight generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-counting'
import { genB } from './lq/b-dice-cards'
import { genC } from './lq/c-ruin'
import { genD } from './lq/d-order'
import { genE } from './lq/e-markov'
import { genF } from './lq/f-linearity'
import { genG } from './lq/g-bayes'
import { genH } from './lq/h-mixed'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: counting, recursion, dice, coins, cards and urns (lectures 1-4)
//   slot 2: random walks, order statistics and geometric probability, Markov chain puzzles (lectures 5-7)
//   slot 3: linearity of expectation, Bayes and information puzzles, a mixed timed set (lectures 8-10)
const lqSlots = [[genA.id, genB.id], [genC.id, genD.id, genE.id], [genF.id, genG.id, genH.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG, genH], lqSlots }
export default bank
