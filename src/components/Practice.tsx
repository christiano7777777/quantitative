import katex from 'katex'
import { useState } from 'react'
import { gradeBlank, stripMathDelimiters } from '../lib/blank-grader'
import type { LessonPractice } from '../lib/types'
import { BlankInput } from './BlankInput'
import { Picture } from './BlankPrompt'
import { Rich } from './Rich'

/**
 * A practice box in a lesson: a live preview of what the student types, a check and a "show answer". Lessons only: a
 * graded paper never shows a preview, because the preview would let the student compare with the picture.
 */
export function Practice({ item, n }: { item: LessonPractice; n: number }) {
  const [text, setText] = useState('')
  const [verdict, setVerdict] = useState<ReturnType<typeof gradeBlank> | null>(null)
  const [shown, setShown] = useState(false)
  const preview = text.trim()
    ? katex.renderToString(stripMathDelimiters(text.trim()), { output: 'html', displayMode: true, throwOnError: false, strict: 'ignore', trust: false, maxExpand: 200, maxSize: 10, macros: { ...(item.blank.macros ?? {}) } })
    : ''
  return (
    <div className="practice">
      <p><Rich text={item.prompt} /></p>
      <Picture tex={item.blank.key} macros={item.blank.macros} />
      <BlankInput label={`Practice ${n} answer`} value={text} onChange={(v) => { setText(v); setVerdict(null) }} />
      <div className="preview" aria-live="polite">
        <span className="muted small">Preview:</span>
        {preview ? <span dangerouslySetInnerHTML={{ __html: preview }} /> : <span className="muted small"> (type above)</span>}
      </div>
      <p>
        <button type="button" onClick={() => setVerdict(gradeBlank(text, item.blank))}>Check</button>{' '}
        <button type="button" onClick={() => setShown((s) => !s)}>{shown ? 'Hide answer' : 'Show answer'}</button>{' '}
        {verdict && (verdict.correct
          ? <b className="ok">✓ right</b>
          : <b className="bad">✗ not yet{verdict.trap ? `: ${verdict.trap.misconception}` : ''}</b>)}
      </p>
      {shown && <pre className="code">{item.blank.key}</pre>}
    </div>
  )
}
