// Reinforcement Learning. 11 lectures, see src/data/topics.json. This test covers theory and hand computations only (no coding).
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eight generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-bandit'
import { genB } from './lq/b-mdp'
import { genC } from './lq/c-montecarlo'
import { genD } from './lq/d-td'
import { genE } from './lq/e-traces'
import { genF } from './lq/f-approx'
import { genG } from './lq/g-policygradient'
import { genH } from './lq/h-ppo-finance'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: bandits, MDPs, Bellman equations and dynamic programming (lectures 1-3)
//   slot 2: Monte Carlo, temporal-difference learning, n-step methods and eligibility traces (lectures 4-6)
//   slot 3: function approximation, DQN, policy gradients, PPO/SAC and finance (lectures 7-11)
const lqSlots = [[genA.id, genB.id], [genC.id, genD.id, genE.id], [genF.id, genG.id, genH.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG, genH], lqSlots }
export default bank
