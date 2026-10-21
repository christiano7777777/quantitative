import katex from 'katex'
import type { ReactNode } from 'react'
import { BLANK_MARK } from '../lib/blank-grader'
import type { BlankView } from '../lib/types'
import { Rich } from './Rich'

/** A formula drawn with KaTeX's HTML output only: the MathML annotation would put the TeX source (the answer) in the page. */
export function Picture({ tex, macros }: { tex: string; macros?: Record<string, string> }) {
  const html = katex.renderToString(tex, { output: 'html', displayMode: true, throwOnError: false, strict: 'ignore', macros: { ...(macros ?? {}) } })
  return <div className="pic" role="img" aria-label="formula" dangerouslySetInnerHTML={{ __html: html }} />
}

/**
 * The question around a typed answer: the prompt, then the template with the box in place of ⟦⟧, the picture to typeset
 * or the snippet to fix. Without `input` (results, worked samples) the box is drawn as an empty slot.
 */
export function BlankPrompt({ prompt, view, input, macros }: { prompt: string; view: BlankView; input?: ReactNode; macros?: Record<string, string> }) {
  const slot = input ?? <span className="slot" aria-label="answer box" />
  const [before, after] = view.template !== undefined ? view.template.split(BLANK_MARK) : ['', '']
  return (
    <>
      <p><Rich text={prompt} /></p>
      {view.kind === 'picture' && view.picture && <Picture tex={view.picture} macros={macros} />}
      {view.kind === 'fix' && view.broken && <pre className="code broken">{view.broken}</pre>}
      {view.template !== undefined
        ? <pre className="code tpl">{before}{slot}{after ?? ''}</pre>
        : input && <div className="tpl-free">{input}</div>}
    </>
  )
}
