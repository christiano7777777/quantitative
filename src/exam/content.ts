// Loads exam files from content/exams/. Dropping <topic-id>.written.json / <topic-id>.coding.json in that folder is all it
// takes: nothing in the UI names a topic. Files load on demand, so they are not in the main bundle.

import { selectPaper } from './pool'
import type { CodingExam, WrittenExam } from './types'

const written = import.meta.glob<WrittenExam>('/content/exams/*.written.json', { import: 'default' })
const coding = import.meta.glob<CodingExam>('/content/exams/*.coding.json', { import: 'default' })

const idOf = (path: string) => /\/([a-z0-9]+)\.(?:written|coding)\.json$/.exec(path)?.[1] ?? ''
const index = (m: Record<string, () => Promise<unknown>>) => new Map(Object.entries(m).map(([p, load]) => [idOf(p), load]))

const writtenFiles = index(written)
const codingFiles = index(coding)

export const hasWritten = (topicId: string) => writtenFiles.has(topicId)
export const hasCoding = (topicId: string) => codingFiles.has(topicId)

/** every topic that has at least one exam file, for the preview index */
export const topicsWithExamFiles = () => [...new Set([...writtenFiles.keys(), ...codingFiles.keys()])].sort()

/** the paper a student sits: the first question of every slot (a file may hold alternatives; see pool.ts) */
export const loadWritten = async (topicId: string): Promise<WrittenExam | null> => {
  const e = (await writtenFiles.get(topicId)?.()) as WrittenExam | undefined
  return e ? selectPaper(e) : null
}
export const loadCoding = async (topicId: string): Promise<CodingExam | null> => {
  const e = (await codingFiles.get(topicId)?.()) as CodingExam | undefined
  return e ? selectPaper(e) : null
}
