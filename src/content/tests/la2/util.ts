import type { LQInstance } from '../../../lib/types'

/** Turns a negative zero answer into 0, so that the answer key never prints "-0". */
export const fixZero = (inst: LQInstance): LQInstance => ({ ...inst, parts: inst.parts.map((p) => ({ ...p, answer: p.answer + 0 })) })
