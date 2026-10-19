import { lectureConfig } from '../config/test.config'
import type { ProgressStore } from './progress'
import { makeRng } from './rng'
import { quizLqId } from './lq-composite'
import { findGenerator, pickStratified } from './test-builder'
import type { Lesson, LessonSample, LQInstance, PaperSpec, TestBank } from './types'

// Every folder src/content/lessons/<topicId>/index.ts with a default-exported Lesson[] (one entry per lecture, in
// order) gives that topic lecture pages and lecture quizzes. Topics without one go straight to the topic test.
const modules = import.meta.glob<{ default: Lesson[] }>('../content/lessons/*/index.ts', { eager: true })

export const lessons: Record<string, Lesson[]> = {}
for (const [path, mod] of Object.entries(modules)) {
  const id = /lessons\/([^/]+)\/index\.ts$/.exec(path)?.[1]
  if (id) lessons[id] = mod.default
}

export const hasLessons = (topicId: string) => topicId in lessons

/**
 * Revision of a topic's lecture structure. Bump it when the lectures of a topic are re-split or reordered, so that quiz
 * progress saved for the old lectures is ignored instead of being applied to different lectures. Topic passes are separate.
 */
const lessonRevision: Record<string, number> = { np: 4, inf: 4, bay: 4 }

/** Progress key of a lecture quiz inside the ProgressStore (never a topic id: it contains '#'). */
export const lectureKey = (topicId: string, n: number) => {
  const rev = lessonRevision[topicId] ?? 1
  return rev === 1 ? `${topicId}#L${n}` : `${topicId}#r${rev}L${n}`
}

export const lecturePassed = (store: ProgressStore, topicId: string, n: number) => store.isPassed(lectureKey(topicId, n))

/** Lecture 1 is open once the topic is; lecture n needs lecture n-1 passed. Dev mode opens all. */
export const lectureUnlocked = (store: ProgressStore, topicId: string, n: number, dev: boolean) =>
  dev || n === 1 || lecturePassed(store, topicId, n - 1)

/** True when the topic has no lessons, or every lecture quiz is passed. Dev mode opens the test. */
export function lessonsDone(store: ProgressStore, topicId: string, dev: boolean): boolean {
  const ls = lessons[topicId]
  if (!ls || dev) return true
  return ls.every((_, i) => lecturePassed(store, topicId, i + 1))
}

/**
 * The quiz: 5 MC spread over the sections of the lecture (unseen first on retakes) and one long question with parts from
 * every section of the lecture (see quizLqId).
 */
export function selectLecturePaper(
  bank: TestBank, lesson: Lesson, lecture: number, seed: string, seenMcIds: ReadonlySet<string> = new Set(),
): PaperSpec {
  const rng = makeRng(seed).fork('select')
  const picked = pickStratified(bank.mc.filter((q) => q.lecture === lecture), lectureConfig.mcCount, seenMcIds, rng)
  return { seed, mcIds: rng.shuffle(picked.map((q) => q.id)), lqIds: [quizLqId(bank, lesson)] }
}

/** One fully worked sample question: the sample's generator at its fixed seed. */
export function workedExample(bank: TestBank, sample: LessonSample): LQInstance {
  const g = findGenerator(bank, sample.lqId)
  if (!g) throw new Error(`unknown LQ generator ${sample.lqId}`)
  return g.generate(makeRng(sample.workedSeed).fork('worked'))
}
