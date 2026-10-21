// Which topics show the Big Exam. Switching on phase 2 is a data change: edit enabledPhases in content/exams/exams.config.json.

import config from '../../content/exams/exams.config.json'
import type { Topic } from '../lib/types'
import { hasCoding, hasWritten } from './content'
import { weightsOf } from './grades'

export const enabledPhases: number[] = config.enabledPhases

export const examEnabled = (t: Topic, phases: readonly number[] = enabledPhases): boolean =>
  t.examPhase !== undefined && t.examPhase !== null && phases.includes(t.examPhase)

export const topicWeights = (t: Topic) => weightsOf(t.examWeights)

/** a topic with coding weight 0 (e.g. no meaningful coding part) is examined in writing only */
export const needsCoding = (t: Topic) => topicWeights(t).coding > 0
export const needsWritten = (t: Topic) => topicWeights(t).written > 0

export const contentReady = (t: Topic) => (!needsWritten(t) || hasWritten(t.id)) && (!needsCoding(t) || hasCoding(t.id))
