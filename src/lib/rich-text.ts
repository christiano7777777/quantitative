// The Rich text format of typed-answer content (lessons with `verbatim`, typed questions):
//   a paragraph that starts with ``` is a code block (the first line, after the fence, is ignored; a closing ``` is optional);
//   `code` and ``code with a ` in it`` are inline code;
//   everything else is KaTeX text as in Math.tsx ($inline$, $$display$$).
// Code is never passed to KaTeX and never rendered as HTML.

export type RichSeg = { t: 'text' | 'code'; v: string }

const FENCE = /^```[^\n]*\n?/

export const isCodeBlock = (p: string) => p.startsWith('```')

/** The code of a ``` paragraph. */
export const codeBlock = (p: string) => p.replace(FENCE, '').replace(/\n?```\s*$/, '')

const INLINE = /``([\s\S]+?)``|`([^`]+)`/g

/** Inline segments of a paragraph that is not a code block. */
export function richSegments(p: string): RichSeg[] {
  const out: RichSeg[] = []
  let last = 0
  for (const m of p.matchAll(INLINE)) {
    if (m.index! > last) out.push({ t: 'text', v: p.slice(last, m.index) })
    out.push({ t: 'code', v: m[1] ?? m[2] })
    last = m.index! + m[0].length
  }
  if (last < p.length) out.push({ t: 'text', v: p.slice(last) })
  return out
}

/** The text a reader sees as maths/prose, with all code removed (for the $-balance and leak checks). */
export const withoutCode = (p: string) =>
  isCodeBlock(p) ? '' : richSegments(p).filter((s) => s.t === 'text').map((s) => s.v).join(' ')
