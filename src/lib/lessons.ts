import { lectureConfig } from '../config/test.config'
import type { ProgressStore } from './progress'
import { makeRng } from './rng'
import { findGenerator } from './test-builder'
import type { Lesson, LQInstance, PaperSpec, TestBank } from './types'

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
const lessonRevision: Record<string, number> = { np: 2, inf: 2 }

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

/** 5 MC of the lecture (unseen first on retakes) and the lesson's long-question generator. */
export function selectLecturePaper(
  bank: TestBank, lesson: Lesson, lecture: number, seed: string, seenMcIds: ReadonlySet<string> = new Set(),
): PaperSpec {
  const rng = makeRng(seed).fork('select')
  const pool = rng.shuffle(bank.mc.filter((q) => q.lecture === lecture))
  const ordered = [...pool.filter((q) => !seenMcIds.has(q.id)), ...pool.filter((q) => seenMcIds.has(q.id))]
  return { seed, mcIds: rng.shuffle(ordered.slice(0, lectureConfig.mcCount).map((q) => q.id)), lqIds: [lesson.lqId] }
}

/** The fully worked sample question: the lesson's generator at its fixed seed. */
export function workedExample(bank: TestBank, lesson: Lesson): LQInstance {
  const g = findGenerator(bank, lesson.lqId)
  if (!g) throw new Error(`unknown LQ generator ${lesson.lqId}`)
  return g.generate(makeRng(lesson.workedSeed).fork('worked'))
}
