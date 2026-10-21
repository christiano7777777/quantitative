// Helpers for typed-answer content (the latex topic). See src/lib/blank-grader.ts for how answers are compared.
import { BLANK_MARK } from '../../lib/blank-grader'
import type { Blank, BlankView, LQPart } from '../../lib/types'

/** Where the answer box goes in a template: `'\\begin{tabular}{' + BOX + '}'`. */
export const BOX = BLANK_MARK

/** A long-question part with a typed answer. `answer` is NaN so that numeric marking can never accept it. */
export function typed(p: { prompt: string; lecture: number; explanation: string; blank: Blank; view: BlankView }): LQPart {
  return { prompt: p.prompt, answer: NaN, lecture: p.lecture, explanation: p.explanation, blank: p.blank, view: p.view }
}
