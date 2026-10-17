import katex from 'katex'
import { Fragment } from 'react'

const SPLIT = /(\$\$[^$]+\$\$|\$[^$]+\$)/g

function render(tex: string, display: boolean): string {
  return katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: 'ignore' })
}

/** Text with $inline$ and $$display$$ KaTeX. Non-math text is rendered as plain text, never as HTML. */
export function Math({ text }: { text: string }) {
  return (
    <>
      {text.split(SPLIT).map((part, i) => {
        if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4)
          return <span key={i} dangerouslySetInnerHTML={{ __html: render(part.slice(2, -2), true) }} />
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2)
          return <span key={i} dangerouslySetInnerHTML={{ __html: render(part.slice(1, -1), false) }} />
        return <Fragment key={i}>{part}</Fragment>
      })}
    </>
  )
}
