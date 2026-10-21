import { useLayoutEffect, useRef } from 'react'
import { MAX_ANSWER } from '../lib/blank-grader'

const SYMBOLS = ['\\', '{', '}', '$', '^', '_', '&']

/**
 * The answer box of a typed question. Every box has the same size, no placeholder and a numbered label only, so nothing
 * on the page hints at the answer or its length. Tab inserts two spaces; press Esc first to move on with Tab.
 */
export function BlankInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const caret = useRef<number | null>(null)
  const leaving = useRef(false)

  useLayoutEffect(() => {
    if (caret.current !== null && ref.current) {
      ref.current.setSelectionRange(caret.current, caret.current)
      caret.current = null
    }
  })

  const insert = (t: string) => {
    const el = ref.current
    const a = el?.selectionStart ?? value.length
    const b = el?.selectionEnd ?? value.length
    const next = value.slice(0, a) + t + value.slice(b)
    if (next.length > MAX_ANSWER) return
    caret.current = a + t.length
    onChange(next)
    el?.focus()
  }

  return (
    <span className="blank">
      <textarea
        ref={ref} className="blank-in" rows={2} wrap="off" maxLength={MAX_ANSWER}
        spellCheck={false} autoCorrect="off" autoCapitalize="off" autoComplete="off"
        aria-label={label} value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { leaving.current = true; return }
          if (e.key === 'Tab' && !e.shiftKey && !leaving.current) { e.preventDefault(); insert('  '); return }
          leaving.current = false
        }}
      />
      <span className="sym-row" aria-hidden="true">
        {SYMBOLS.map((s) => (
          <button key={s} type="button" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={() => insert(s)}>{s}</button>
        ))}
      </span>
    </span>
  )
}
