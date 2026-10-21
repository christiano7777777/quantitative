// Pure grade arithmetic for the Big Exam: percentages, the per-part and combined grade, best/latest selection.

import { defaultWeights, examConfig, percentToGrade } from './config.ts'
import type { CodingAttempt, Weights, WrittenAttempt } from './types.ts'

/** marks for display: at most 2 decimals, no trailing zeros */
export const fmtMarks = (x: number) => String(Number(x.toFixed(2)))

export const toPercent = (marks: number, max: number) => (max > 0 ? (100 * marks) / max : 0)

/** The topic's weights, or the default 70/30. Throws on negative or all-zero weights; scales them to sum to 1. */
export function weightsOf(override?: Weights): Weights {
  const w = override ?? defaultWeights
  if (!(w.written >= 0) || !(w.coding >= 0) || w.written + w.coding <= 0) throw new Error('exam weights must be >= 0 and not both 0')
  const s = w.written + w.coding
  return { written: w.written / s, coding: w.coding / s }
}

export interface PartSummary { percent: number; grade: string; marks: number; max: number; attemptId: string }

/** An attempt counts once it has marks: a written attempt must be marked, a coding attempt is marked on submit. */
const finished = (a: WrittenAttempt | CodingAttempt) => a.percent !== undefined && !Number.isNaN(a.percent)

/** Best (highest percentage; ties go to the later attempt) or latest finished attempt. */
export function pick<A extends WrittenAttempt | CodingAttempt>(attempts: A[], how: 'best' | 'latest' = examConfig.headline): A | null {
  const done = attempts.filter(finished)
  if (!done.length) return null
  if (how === 'latest') return done.reduce((a, b) => (a.submittedAt > b.submittedAt ? a : b))
  return done.reduce((a, b) => (b.percent! >= a.percent! ? b : a))
}

export const summarisePart = (a: WrittenAttempt | CodingAttempt | null): PartSummary | null =>
  a && finished(a) ? { percent: a.percent!, grade: percentToGrade(a.percent!), marks: a.marks!, max: a.max, attemptId: a.id } : null

export interface ExamSummary {
  written: PartSummary | null
  coding: PartSummary | null
  /** needs both parts, unless a part has weight 0 (then it is not needed) */
  total: { percent: number; grade: string } | null
  weights: Weights
}

export function summarise(
  written: WrittenAttempt[], coding: CodingAttempt[], weights?: Weights, how: 'best' | 'latest' = examConfig.headline,
): ExamSummary {
  const w = weightsOf(weights)
  const ws = summarisePart(pick(written, how)), cs = summarisePart(pick(coding, how))
  const needW = w.written > 0, needC = w.coding > 0
  let total: ExamSummary['total'] = null
  if ((!needW || ws) && (!needC || cs)) {
    const percent = (needW ? w.written * ws!.percent : 0) + (needC ? w.coding * cs!.percent : 0)
    total = { percent, grade: percentToGrade(percent) }
  }
  return { written: ws, coding: cs, total, weights: w }
}

/** The label shown on the topic page and the tree: the grade once the big exam is complete, else "Pass" if the topic test is passed. */
export const statusLabel = (s: ExamSummary, testPassed: boolean): string | null => (s.total ? s.total.grade : testPassed ? 'Pass' : null)
