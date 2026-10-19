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
  /**
   * For a lecture that merges several sections of the course notes: the 1-based section of the lecture this question
   * belongs to. The lecture quiz spreads its MC questions across the sections.
   */
  section?: number
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
  /** extra long-question generators used only by lecture quizzes; never drawn for the topic test */
  lectureLq?: LQGenerator[]
  /**
   * Blueprint of the final test: one list of long-question ids per LQ slot (there must be testConfig.lqCount slots). Each
   * attempt draws one id from each slot. An id may be a composite (`a#0,1+b#0,1`, see findGenerator) that asks parts from
   * several lectures at once, so that every lecture is covered. When present it replaces `lqSlots`.
   */
  examSlots?: string[][]
}

/**
 * A worked sample: the long-question generator `lqId` at the fixed seed `workedSeed`, so it is the same kind of question
 * as the quiz, with different numbers and the full working shown.
 */
export interface LessonSample {
  workedSeed: string
  /** generator id, optionally `id#0,2,3` to keep only those parts (0-based); see findGenerator */
  lqId: string
}

/**
 * One lecture's teaching page. `teach` is a list of paragraphs ($...$ KaTeX; a paragraph starting with "## " is a
 * sub-heading). `samples` has one worked sample per section of the lecture (usually one; a lecture that merges two or
 * three sections of the course notes has one each). The quiz draws its long question from one of the samples' generators.
 */
export interface Lesson {
  teach: string[]
  samples: LessonSample[]
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
