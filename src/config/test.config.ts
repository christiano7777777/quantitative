// All test rules live here. Total marks is derived, never stored.
export const testConfig = {
  mcCount: 20, // MC questions per attempt
  mcMarks: 1, // marks per MC question
  lqCount: 3, // long questions per attempt
  lqMarks: 10, // marks per LQ, split evenly across its sub-questions
  passFraction: 0.8, // pass at 80% of the total
  // optional per-section minimum, as a fraction of that section's marks; null = off
  sectionMinFraction: { mc: null as number | null, lq: null as number | null },
  // used when a sub-question gives no tolerance of its own (absolute, so 2 d.p. answers pass)
  defaultTolerance: { abs: 0.005 },
}

export const mcTotal = () => testConfig.mcCount * testConfig.mcMarks
export const lqTotal = () => testConfig.lqCount * testConfig.lqMarks
export const totalMarks = () => mcTotal() + lqTotal()
export const passMark = () => testConfig.passFraction * totalMarks()

// Lecture quizzes (topics that have lessons in src/content/lessons/): 5 MC from the lecture + 1 long question.
export const lectureConfig = {
  mcCount: 5,
  mcMarks: 1,
  lqCount: 1,
  lqMarks: 10, // the long question's 5 parts share these marks evenly
  passFraction: 0.8, // 12 of 15
}
export const lectureTotal = () => lectureConfig.mcCount * lectureConfig.mcMarks + lectureConfig.lqCount * lectureConfig.lqMarks
export const lecturePassMark = () => lectureConfig.passFraction * lectureTotal()
