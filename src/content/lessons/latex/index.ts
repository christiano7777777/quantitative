// LaTeX & Research Writing (id latex): one verbatim lesson per lecture, in the order of src/data/topics.json.
import type { Lesson } from '../../../lib/types'
import { lessonLec1 } from './l1'
import { lessonLec2 } from './l2'
import { lessonLec3 } from './l3'
import { lessonLec4 } from './l4'
import { lessonLec5 } from './l5'
import { lessonLec6 } from './l6'
import { lessonLec7 } from './l7'
import { lessonLec8 } from './l8'
import { lessonLec9 } from './l9'
import { lessonLec10 } from './l10'

const lessons: Lesson[] = [lessonLec1, lessonLec2, lessonLec3, lessonLec4, lessonLec5, lessonLec6, lessonLec7, lessonLec8, lessonLec9, lessonLec10]
export default lessons
