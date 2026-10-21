// Big Exam content and attempt types. The JSON schemas in content/exams/schema/ describe the same shapes.

export type PartType = 'calculation' | 'derivation' | 'proof' | 'explanation' | 'other'

export interface SchemeStep { step: string; marks: number }

export interface WrittenPart {
  id: string
  text: string // Markdown + LaTeX
  marks: number
  type?: PartType
  markingScheme: SchemeStep[]
  modelAnswer: string // Markdown + LaTeX
}

export interface WrittenQuestion {
  id: string
  title: string
  text: string // Markdown + LaTeX; the shared setup of the question
  marks: number
  parts: WrittenPart[]
}

export interface WrittenExam {
  schemaVersion: 1
  topicId: string
  placeholder?: boolean
  title: string
  durationMinutes: number
  totalMarks: number
  instructions: string
  preamble?: string // LaTeX macros (\newcommand lines) available in question text and in the student's answer
  questions: WrittenQuestion[]
}

// ---- coding ----

export type Compare =
  | { type: 'exact' }
  | { type: 'numeric'; abs?: number; rel?: number }
  | { type: 'quantiles'; probs: number[]; abs?: number; rel?: number; length?: number }
  | { type: 'summary'; stats: SummaryStat[]; abs?: number; rel?: number; length?: number }

export type SummaryStat = 'mean' | 'sd' | 'var' | 'median' | 'min' | 'max'

/** `"$FROM_REFERENCE"` in `expected` asks `validate-exams --fill-expected` to compute it. */
export const FROM_REFERENCE = '$FROM_REFERENCE'

export interface CodingTest {
  id: string
  description?: string
  /** keyword arguments of the main function; `{"$ndarray": [...]}` becomes a numpy array */
  input: Record<string, unknown>
  seed: number
  compare: Compare
  expected: unknown
}

export interface FunctionSpec { name: string; main?: boolean; description: string }

export interface CodingQuestion {
  id: string
  title: string
  text: string
  marks: number
  docs: string
  difficultyNotes?: string
  helperCode: string
  skeleton: string
  functions: FunctionSpec[]
  rngArg?: string
  timeLimitSeconds?: number
  referenceSolution: string
  oracleSolution?: string
  visibleTests: CodingTest[]
  hiddenTests: CodingTest[]
}

export interface CodingExam {
  schemaVersion: 1
  topicId: string
  placeholder?: boolean
  title: string
  totalMarks: number
  instructions: string
  questions: CodingQuestion[]
}

// ---- marking a written exam ----

export interface PartMark { id: string; marks: number; feedback: string }
export interface QuestionMark { id: string; parts: PartMark[]; feedback?: string }
export interface WrittenMarking { questions: QuestionMark[]; overall?: string }

// ---- attempts (stored in localStorage) ----

export type Part = 'written' | 'coding'

export interface WrittenAttempt {
  id: string
  startedAt: string
  submittedAt: string
  answers: Record<string, string> // "<questionId>.<partId>" -> LaTeX
  /** set once the marks are imported or the API has marked it */
  marking?: WrittenMarking
  markedAt?: string
  markedBy?: 'import' | 'api'
  marks?: number
  max: number
  percent?: number
  grade?: string
}

export interface TestOutcome {
  id: string
  passed: boolean
  message: string
  hidden: boolean
}

export interface CodeQuestionResult {
  id: string
  code: string
  visible: TestOutcome[]
  hidden: TestOutcome[]
  marks: number
  max: number
}

export interface CodingAttempt {
  id: string
  startedAt: string
  submittedAt: string
  results: CodeQuestionResult[]
  marks: number
  max: number
  percent: number
  grade: string
}

export interface Weights { written: number; coding: number }
