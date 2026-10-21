import { lectureConfig, lecturePassMark, lectureTotal, lqTotal, mcTotal, passMark, testConfig, totalMarks } from '../config/test.config'
import { gradeBlank } from './blank-grader'
import { checkAnswer } from './parse-answer'
import type { Answers, BlankResult, GradeResult, Paper } from './types'

/** Swap this for a server-backed implementation later; the UI only sees this interface. */
export interface Grader {
  grade(paper: Paper, answers: Answers, rules?: GradeRules): GradeResult
}

/** Marking scheme of one kind of paper. The default is the topic test; `lectureRules` is the lecture quiz. */
export interface GradeRules {
  mcMarks: number
  lqMarks: number
  mcMax: number
  lqMax: number
  passMark: number
  total: number
  sectionMin: { mc: number | null; lq: number | null }
}

export const topicRules: GradeRules = {
  mcMarks: testConfig.mcMarks, lqMarks: testConfig.lqMarks, mcMax: mcTotal(), lqMax: lqTotal(),
  passMark: passMark(), total: totalMarks(), sectionMin: testConfig.sectionMinFraction,
}

export const lectureRules: GradeRules = {
  mcMarks: lectureConfig.mcMarks, lqMarks: lectureConfig.lqMarks,
  mcMax: lectureConfig.mcCount * lectureConfig.mcMarks, lqMax: lectureConfig.lqCount * lectureConfig.lqMarks,
  passMark: lecturePassMark(), total: lectureTotal(), sectionMin: { mc: null, lq: null },
}

export const localGrader: Grader = {
  grade(paper, answers, rules = topicRules) {
    const mc = paper.mc.map((q, i) => {
      const chosen = answers.mc[i] ?? null
      const correct = chosen !== null && q.options[chosen]?.correct === true
      return { correct, marks: correct ? rules.mcMarks : 0, chosen }
    })
    // typed short questions take the place of MC (same marks each); old attempts have no `blanks` answers
    const blanks: BlankResult[] | undefined = paper.blanks?.map((q, i) => {
      const given = answers.blanks?.[i] ?? ''
      const v = gradeBlank(given, q.blank)
      return { correct: v.correct, marks: v.correct ? rules.mcMarks : 0, max: rules.mcMarks, given, mode: q.blank.mode, trap: v.trap?.misconception }
    })
    const lq = paper.lq.map((q, qi) => {
      const each = rules.lqMarks / q.parts.length
      return q.parts.map((p, pi) => {
        const given = answers.lq[qi]?.[pi] ?? ''
        if (p.blank) {
          const v = gradeBlank(given, p.blank)
          return {
            correct: v.correct, marks: v.correct ? each : 0, max: each, given, expected: p.answer, lecture: p.lecture,
            expectedText: p.blank.key, mode: p.blank.mode, trap: v.trap?.misconception,
          }
        }
        const correct = checkAnswer(given, p.answer, p.tolerance)
        return { correct, marks: correct ? each : 0, max: each, given, expected: p.answer, lecture: p.lecture }
      })
    })
    const mcScore = mc.reduce((s, r) => s + r.marks, 0) + (blanks ?? []).reduce((s, r) => s + r.marks, 0)
    const lqScore = lq.flat().reduce((s, r) => s + r.marks, 0)
    const total = mcScore + lqScore
    const eps = 1e-9 // LQ marks can be fractions like 10/3
    const failedSectionMin: ('mc' | 'lq')[] = []
    const { mc: mcMin, lq: lqMin } = rules.sectionMin
    if (mcMin !== null && mcScore < mcMin * rules.mcMax - eps) failedSectionMin.push('mc')
    if (lqMin !== null && lqScore < lqMin * rules.lqMax - eps) failedSectionMin.push('lq')
    return {
      mcScore, lqScore, mcMax: rules.mcMax, lqMax: rules.lqMax, total, max: rules.total,
      passed: total >= rules.passMark - eps && failedSectionMin.length === 0,
      passMark: rules.passMark, failedSectionMin, mc, lq, ...(blanks ? { blanks } : {}),
    }
  },
}
