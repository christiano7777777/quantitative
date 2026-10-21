import { examConfig } from '../config.ts'
import { toPercent } from '../grades.ts'
import type { CodeQuestionResult, CodingExam, CodingQuestion, TestOutcome } from '../types.ts'

/** Marks of one question: half from the share of visible tests passed, half from the share of hidden tests passed. */
export function scoreQuestion(q: Pick<CodingQuestion, 'marks'>, visible: boolean[], hidden: boolean[]): number {
  const share = examConfig.codingVisibleShare
  const frac = (xs: boolean[]) => (xs.length ? xs.filter(Boolean).length / xs.length : 0)
  return q.marks * (share * frac(visible) + (1 - share) * frac(hidden))
}

export function scoreAttempt(exam: CodingExam, results: CodeQuestionResult[]) {
  const marks = results.reduce((n, r) => n + r.marks, 0)
  return { marks, max: exam.totalMarks, percent: toPercent(marks, exam.totalMarks) }
}

export const buildResult = (q: CodingQuestion, code: string, visible: TestOutcome[], hidden: TestOutcome[]): CodeQuestionResult => ({
  id: q.id, code, visible, hidden, max: q.marks,
  marks: scoreQuestion(q, visible.map((t) => t.passed), hidden.map((t) => t.passed)),
})
