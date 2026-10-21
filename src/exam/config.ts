// All Big Exam rules live here, like src/config/test.config.ts does for the topic test.
// Which phases are switched on is data, not code: content/exams/exams.config.json (see phases.ts).

import type { Weights } from './types.ts'

/** Weights of the two parts in the combined grade. A topic can override them with `examWeights` in topics.json. */
export const defaultWeights: Weights = { written: 0.7, coding: 0.3 }

/**
 * Grade scale, highest first: a percentage gets the first band whose `min` it reaches. These cut-offs are my own
 * choice, not an official HKU scale; edit them here and every grade in the app follows.
 */
export const gradeScale: readonly { grade: string; min: number }[] = [
  { grade: 'A+', min: 90 }, { grade: 'A', min: 85 }, { grade: 'A-', min: 80 },
  { grade: 'B+', min: 75 }, { grade: 'B', min: 70 }, { grade: 'B-', min: 65 },
  { grade: 'C+', min: 60 }, { grade: 'C', min: 55 }, { grade: 'C-', min: 50 },
  { grade: 'D+', min: 45 }, { grade: 'D', min: 40 },
  { grade: 'F', min: 0 },
]

export const examConfig = {
  /** the grade headline uses the best attempt of each part ('best') or the most recent one ('latest') */
  headline: 'best' as 'best' | 'latest',
  /** share of a coding question's marks earned on the visible tests; the rest comes from the hidden tests */
  codingVisibleShare: 0.5,
  /** default time limit of one test case run, in seconds (a question can set timeLimitSeconds) */
  defaultTimeLimitSeconds: 10,
  /** Pyodide version loaded in the browser (also the one the validator can use with --pyodide) */
  pyodideVersion: '314.0.7',
  /** marks are multiples of this */
  markStep: 0.5,
}

export const percentToGrade = (percent: number): string => {
  const p = Math.max(0, Math.min(100, percent))
  return (gradeScale.find((b) => p + 1e-9 >= b.min) ?? gradeScale[gradeScale.length - 1]).grade
}
