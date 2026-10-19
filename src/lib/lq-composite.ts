import { makeRng } from './rng'
import { findGenerator } from './test-builder'
import type { Lesson, LQGenerator, TestBank } from './types'

type Gens = Pick<TestBank, 'lq' | 'lectureLq'>

/** Indices (0-based) of the parts a generator id keeps: from `base#i,j,k`, or all parts of a plain generator id. */
function keptParts(gens: Gens, id: string): { base: string; keep: number[] } {
  const [base, sel] = id.split('#')
  if (sel !== undefined) return { base, keep: sel.split(',').map(Number) }
  const g = findGenerator(gens, base) as LQGenerator | undefined
  if (!g) throw new Error(`unknown LQ generator ${base}`)
  return { base, keep: g.generate(makeRng('probe')).parts.map((_, i) => i) }
}

/** The same generator keeping only its first `m` kept parts. A prefix is always safe: later parts may rely on earlier ones. */
export function firstParts(gens: Gens, id: string, m: number): string {
  const { base, keep } = keptParts(gens, id)
  return `${base}#${keep.slice(0, m).join(',')}`
}

/** Parts taken from each section of a merged lecture in its quiz question. */
export const QUIZ_PARTS_PER_SECTION = 3

/**
 * The long question of a lecture quiz: one composite question with parts from every section (sample) of the lecture.
 * A lecture with a single sample uses all its parts; a merged lecture takes the first QUIZ_PARTS_PER_SECTION parts of each.
 */
export function quizLqId(gens: Gens, lesson: Lesson): string {
  const one = lesson.samples.length === 1
  return lesson.samples.map((s) => (one ? s.lqId : firstParts(gens, s.lqId, QUIZ_PARTS_PER_SECTION))).join('+')
}

/**
 * Long-question slots for the final test: every slot covers its own range of lectures. A slot offers `variants` composite
 * questions; each takes the first two parts of one section (rotating with the variant) of every lecture in the range, so
 * each final test attempt asks something from every lecture.
 */
export function buildExamSlots(gens: Gens, lessons: Lesson[], ranges: number[][], variants = 3): string[][] {
  return ranges.map((range) =>
    Array.from({ length: variants }, (_, j) =>
      range.map((n) => {
        const samples = lessons[n - 1].samples
        return firstParts(gens, samples[(j + n) % samples.length].lqId, 2)
      }).join('+')),
  )
}
