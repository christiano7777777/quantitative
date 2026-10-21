import { basicSetup, EditorView } from 'codemirror'
import { python } from '@codemirror/lang-python'
import { EditorState } from '@codemirror/state'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { useEffect, useRef } from 'react'

// colours come from the app's CSS variables, so the editor follows light and dark mode
const theme = EditorView.theme({
  '&': { color: 'var(--fg)', backgroundColor: 'var(--panel)', fontSize: '.88rem', border: '1px solid var(--line)', borderRadius: '6px' },
  '&.cm-focused': { outline: '2px solid var(--accent)' },
  '.cm-scroller': { fontFamily: 'var(--mono)', minHeight: '16em', maxHeight: '36em' },
  '.cm-gutters': { backgroundColor: 'var(--bg)', color: 'var(--muted)', border: 'none' },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'color-mix(in srgb, var(--accent) 8%, transparent)' },
  '.cm-cursor': { borderLeftColor: 'var(--fg)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': { backgroundColor: 'color-mix(in srgb, var(--accent) 28%, transparent)' },
})
const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.operatorKeyword, t.controlKeyword], color: 'var(--accent)', fontWeight: '600' },
  { tag: [t.string, t.special(t.string)], color: 'var(--req)' },
  { tag: t.comment, color: 'var(--muted)', fontStyle: 'italic' },
  { tag: [t.number, t.bool, t.null], color: 'var(--bonus)' },
  { tag: [t.function(t.variableName), t.definition(t.variableName)], color: 'var(--d-ai)' },
])

interface Props { value: string; onChange?(v: string): void; readOnly?: boolean; label: string }

/** CodeMirror 6 with Python highlighting. Controlled from outside only when `value` differs from the document. */
export default function CodeEditor({ value, onChange, readOnly, label }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const cb = useRef(onChange)
  cb.current = onChange

  useEffect(() => {
    const v = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup, python(), theme, syntaxHighlighting(highlight),
          EditorView.contentAttributes.of({ 'aria-label': label }),
          EditorState.readOnly.of(!!readOnly), EditorView.editable.of(!readOnly),
          EditorView.updateListener.of((u) => { if (u.docChanged) cb.current?.(u.state.doc.toString()) }),
        ],
      }),
    })
    view.current = v
    return () => v.destroy()
    // the editor is created once per mount; later `value` changes are applied below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const v = view.current
    if (v && v.state.doc.toString() !== value) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } })
  }, [value])

  return <div ref={host} className="cm-host" />
}
