// Question pools. A question may carry a `slot` (a paper position); questions with the same slot are alternatives. For now a
// paper is always the FIRST question of each slot, so there is one fixed paper. Drawing a random alternative later only
// changes `paperOf`. A question without a slot is its own slot, so files written before pools existed work unchanged.

export interface Poolable { id: string; slot?: number; marks: number }

const key = (q: Poolable) => (q.slot === undefined ? `id:${q.id}` : `slot:${q.slot}`)

/** slots in order of first appearance, each with its alternatives in file order */
export function slotsOf<Q extends Poolable>(questions: Q[]): Q[][] {
  const out = new Map<string, Q[]>()
  for (const q of questions) out.set(key(q), [...(out.get(key(q)) ?? []), q])
  return [...out.values()]
}

/** the questions of the paper: the first alternative of every slot */
export const paperOf = <Q extends Poolable>(questions: Q[]): Q[] => slotsOf(questions).map((alts) => alts[0])

/** the exam as a student sees it: only the paper's questions */
export const selectPaper = <E extends { questions: Poolable[] }>(exam: E): E => ({ ...exam, questions: paperOf(exam.questions) })
