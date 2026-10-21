import { modeLabel } from '../lib/blank-grader'
import type { Blank } from '../lib/types'
import { fmt } from '../pages/Topic'
import { Picture } from './BlankPrompt'

/** Results page: the student's code beside the key, how it was compared, and the trap it fell into, if any. */
export function TypedReview({ given, blank, correct, marks, max, trap }: {
  given: string; blank: Blank; correct: boolean; marks: number; max: number; trap?: string
}) {
  const g = given.trim()
  return (
    <div className="review">
      <div className="side">
        <div>
          <span className="small muted">Your answer</span>
          <pre className="code">{g || '(blank)'}</pre>
          {blank.mode === 'render' && g && <Picture tex={g.replace(/^\$+|\$+$/g, '')} macros={blank.macros} />}
        </div>
        <div>
          <span className="small muted">Correct answer</span>
          <pre className="code">{blank.key}</pre>
          {blank.mode === 'render' && <Picture tex={blank.key} macros={blank.macros} />}
        </div>
      </div>
      <p className="small">
        <b>{correct ? `✓ ${fmt(marks)}/${fmt(max)}` : `✗ 0/${fmt(max)}`}</b>{' '}
        <span className="muted">Graded by: {modeLabel[blank.mode]}.</span>
        {blank.accept && blank.accept.length > 0 && <> Also accepted: {blank.accept.map((a, i) => <code key={i} className="ic">{a}</code>)}</>}
      </p>
      {trap && <p className="small"><em>This is the trap: {trap}</em></p>}
    </div>
  )
}
