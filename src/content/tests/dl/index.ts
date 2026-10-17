// Deep Learning. 11 lectures, see src/data/topics.json. This test covers theory and hand computations only (no coding).
// MC: mc.json (conceptual, 2 correct wordings + 5 distractors each).
// LQ: eight generators in lq/, each tested against an independent computation in lq/lq.test.ts.
import type { MCQuestion, TestBank } from '../../../lib/types'
import mcJson from './mc.json'
import { genA } from './lq/a-forward'
import { genB } from './lq/b-backprop'
import { genC } from './lq/c-optim'
import { genD } from './lq/d-regnorm'
import { genE } from './lq/e-cnn'
import { genF } from './lq/f-rnn'
import { genG } from './lq/g-attention'
import { genH } from './lq/h-generative'

// Blueprint: every attempt has one long question from each slot.
//   slot 1: MLP forward pass, backpropagation, optimisers (lectures 1-3)
//   slot 2: regularisation, initialisation, convolutional networks, ResNets, recurrent networks (lectures 4-8)
//   slot 3: attention, generative models, training practice (lectures 9-11)
const lqSlots = [[genA.id, genB.id, genC.id], [genD.id, genE.id, genF.id], [genG.id, genH.id]]

const bank: TestBank = { mc: mcJson as MCQuestion[], lq: [genA, genB, genC, genD, genE, genF, genG, genH], lqSlots }
export default bank
