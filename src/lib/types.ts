import type { Rng } from './rng'

export interface Lecture {
  title: string
  theory: string
  computation: string
  coding?: string // unused until later stages
}

export interface Topic {
  id: string
  label: string
  domain: string
  prerequisites: string[]
  courses: string
  starred: boolean
  summary: string
  outcomes: string[]
  note: string
  proofsNote: string // unused in Stage 1
  lectures: Lecture[]
}

export interface Career {
  id: string
  label: string
  required: string[]
  bonus: string[]
}

// ---- question banks (see CONTRIBUTING.md) ----

/** Conceptual MC. Each attempt shows 1 of `correct` and 3 of `distractors`, shuffled. */
export interface MCQuestion {
  id: string
  lecture: number // 1-based index into the topic's lectures
  stem: string // text with $...$ KaTeX
  correct: string[] // exactly 2 paraphrases of the same true statement
  distractors: { text: string; misconception: string }[] // exactly 5
  explanation: string
}

export interface Tolerance {
  abs?: number
  rel?: number
}

export interface LQPart {
  prompt: string
  answer: number // computed by the generator from the same numbers shown in the question
  tolerance?: Tolerance // falls back to testConfig.defaultTolerance
  lecture: number
  explanation: string
}

export interface LQInstance {
  intro: string
  parts: LQPart[]
}

export interface LQGenerator {
  id: string
  generate(rng: Rng): LQInstance
}

export interface TestBank {
  mc: MCQuestion[]
  lq: LQGenerator[]
  /**
   * Blueprint for the long questions: one inner list of generator ids per LQ slot. Each attempt draws one
   * generator from each slot, so every attempt spans the same parts of the syllabus. Must have exactly
   * testConfig.lqCount slots. If omitted, generators are drawn uniformly (no coverage guarantee).
   */
  lqSlots?: string[][]
}

// ---- a concrete attempt ----

/** Everything needed to rebuild the exact paper later. */
export interface PaperSpec {
  seed: string
  mcIds: string[]
  lqIds: string[]
}

export interface PaperOption {
  text: string
  correct: boolean
  misconception?: string // set on distractors, shown on the results page
}

export interface PaperMC {
  id: string
  lecture: number
  stem: string
  options: PaperOption[] // 4, shuffled
  explanation: string
}

export interface PaperLQ {
  id: string
  intro: string
  parts: LQPart[]
}

export interface Paper {
  spec: PaperSpec
  mc: PaperMC[]
  lq: PaperLQ[]
}

export interface Answers {
  mc: (number | null)[] // chosen option index per MC question
  lq: string[][] // typed text per LQ part
}

export interface PartResult {
  correct: boolean
  marks: number
  max: number
  given: string
  expected: number
  lecture: number
}

export interface GradeResult {
  mcScore: number
  lqScore: number
  mcMax: number
  lqMax: number
  total: number
  max: number
  passed: boolean
  passMark: number
  failedSectionMin: ('mc' | 'lq')[]
  mc: { correct: boolean; marks: number; chosen: number | null }[]
  lq: PartResult[][]
}
