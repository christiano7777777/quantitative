import { lqTotal, mcTotal, passMark, testConfig, totalMarks } from '../config/test.config'
import { checkAnswer } from './parse-answer'
import type { Answers, GradeResult, Paper } from './types'

/** Swap this for a server-backed implementation later; the UI only sees this interface. */
export interface Grader {
  grade(paper: Paper, answers: Answers): GradeResult
}

export const localGrader: Grader = {
  grade(paper, answers) {
    const mc = paper.mc.map((q, i) => {
      const chosen = answers.mc[i] ?? null
      const correct = chosen !== null && q.options[chosen]?.correct === true
      return { correct, marks: correct ? testConfig.mcMarks : 0, chosen }
    })
    const lq = paper.lq.map((q, qi) => {
      const each = testConfig.lqMarks / q.parts.length
      return q.parts.map((p, pi) => {
        const given = answers.lq[qi]?.[pi] ?? ''
        const correct = checkAnswer(given, p.answer, p.tolerance)
        return { correct, marks: correct ? each : 0, max: each, given, expected: p.answer, lecture: p.lecture }
      })
    })
    const mcScore = mc.reduce((s, r) => s + r.marks, 0)
    const lqScore = lq.flat().reduce((s, r) => s + r.marks, 0)
    const total = mcScore + lqScore
    const eps = 1e-9 // LQ marks can be fractions like 10/3
    const failedSectionMin: ('mc' | 'lq')[] = []
    const { mc: mcMin, lq: lqMin } = testConfig.sectionMinFraction
    if (mcMin !== null && mcScore < mcMin * mcTotal() - eps) failedSectionMin.push('mc')
    if (lqMin !== null && lqScore < lqMin * lqTotal() - eps) failedSectionMin.push('lq')
    return {
      mcScore, lqScore, mcMax: mcTotal(), lqMax: lqTotal(), total, max: totalMarks(),
      passed: total >= passMark() - eps && failedSectionMin.length === 0,
      passMark: passMark(), failedSectionMin, mc, lq,
    }
  },
}
