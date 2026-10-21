import { codeBlock, isCodeBlock, richSegments } from '../lib/rich-text'
import { Math } from './Math'

/** Text in the Rich format (src/lib/rich-text.ts): `code` and ```blocks verbatim, the rest as Math. Never HTML. */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {richSegments(text).map((s, i) => (s.t === 'code' ? <code key={i} className="ic">{s.v}</code> : <Math key={i} text={s.v} />))}
    </>
  )
}

/** One lesson paragraph: a ``` block, a "## " heading or a Rich paragraph. */
export function RichParagraph({ text }: { text: string }) {
  if (isCodeBlock(text)) return <pre className="code">{codeBlock(text)}</pre>
  if (text.startsWith('## ')) return <h3><Rich text={text.slice(3)} /></h3>
  return <p><Rich text={text} /></p>
}
