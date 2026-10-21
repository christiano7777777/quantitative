import { describe, expect, it } from 'vitest'
import { extractMacros, mathErrors, renderLatexAnswer, renderMarkdown, splitMath } from './latex'

describe('splitMath', () => {
  it('splits text, inline, display and environment maths, with line numbers', () => {
    const segs = splitMath('a $x$ b\n$$y$$ c \\(z\\) \\[w\\]\n\\begin{align}u&=v\\end{align}')
    expect(segs.filter((s) => s.kind === 'math').map((s) => s.kind === 'math' && [s.tex, s.display])).toEqual([
      ['x', false], ['y', true], ['z', false], ['w', true], ['\\begin{align}u&=v\\end{align}', true],
    ])
    const env = segs.find((s) => s.kind === 'math' && s.tex.startsWith('\\begin'))!
    expect(env.line).toBe(3)
  })

  it('treats \\$ as a literal dollar and reports an unclosed opener', () => {
    expect(splitMath('costs \\$5 and \\$6')).toEqual([{ kind: 'text', text: 'costs \\$5 and \\$6', line: 1 }])
    expect(splitMath('oops $x + 1').some((s) => s.kind === 'unclosed')).toBe(true)
  })

  it('does not let an inline $ run across a blank line', () => {
    const segs = splitMath('price $5\n\nlater $x$')
    expect(segs.some((s) => s.kind === 'unclosed')).toBe(true)
    expect(segs.some((s) => s.kind === 'math' && s.tex === 'x')).toBe(true)
  })
})

describe('renderLatexAnswer', () => {
  it('renders good formulas and keeps going after a bad one', () => {
    const r = renderLatexAnswer('Good $x^2$.\n\nBad $\\frac{1}{$ here.\n\nAlso fine $$\\sum_i a_i$$ and $\\notacommand$.')
    expect(r.errors.map((e) => e.line)).toEqual([3, 5])
    expect(r.html.match(/class="katex"/g)!.length).toBe(2) // x^2 and the sum; the two bad ones are not katex output
    expect(r.html).toContain('tex-err')
    expect(r.html).toContain('here.')
  })

  it('never throws, whatever is typed', () => {
    for (const bad of ['$', '$$', '\\[', '\\begin{align}', '\\begin{align} x &', '{{{', '}}}', '\\textbf{', '\\newcommand{', '$\\def\\a{\\a}\\a$', '\\\\\\\\', '%', '\\item', '$\\begin{matrix}$'])
      expect(() => renderLatexAnswer(bad)).not.toThrow()
  })

  it('supports align environments, text commands, lists and proof', () => {
    const r = renderLatexAnswer('\\textbf{Claim.} \\emph{Yes}\n\n\\begin{proof}\n\\begin{align}a&=b\\\\ c&=d\\end{align}\n\\end{proof}\n\n\\begin{itemize}\\item one \\item two\\end{itemize}')
    expect(r.errors).toEqual([])
    expect(r.html).toContain('<strong>Claim.</strong>')
    expect(r.html).toContain('<em>Yes</em>')
    expect(r.html).toContain('Proof.')
    expect(r.html).toContain('<li>one')
    expect(r.html).toContain('katex-display')
  })

  it('applies \\newcommand and \\DeclareMathOperator from the answer, even for names KaTeX already defines', () => {
    const r = renderLatexAnswer('\\newcommand{\\R}{\\mathbb{R}}\n\\DeclareMathOperator{\\Var}{Var}\n$\\Var(X)\\in\\R$')
    expect(r.errors).toEqual([])
    expect(r.html).toContain('katex')
  })

  it('escapes HTML typed in the answer', () => {
    const r = renderLatexAnswer('<img src=x onerror=alert(1)> <script>x</script> $a<b$')
    expect(r.html).not.toMatch(/<img|<script/)
    expect(r.html).toContain('&lt;img')
  })

  it('does not execute \\href or \\includegraphics (trust is off)', () => {
    const r = renderLatexAnswer('$\\href{javascript:alert(1)}{x}$ $\\includegraphics{a.png}$')
    expect(r.html).not.toMatch(/<a[\s>]|<img|href="/) // shown as red source text, no link or image element is produced
  })
})

describe('renderMarkdown', () => {
  it('renders paragraphs, lists, code and maths, and escapes HTML', () => {
    const r = renderMarkdown('# Title\n\nSome **bold** and *italic* with $a^2$ and `code <b>`.\n\n- one\n- two\n\n```python\nx = 1 < 2\n```\n\n<script>alert(1)</script>')
    expect(r.errors).toEqual([])
    expect(r.html).toContain('<h3>Title</h3>')
    expect(r.html).toContain('<strong>bold</strong>')
    expect(r.html).toContain('<ul><li>one</li><li>two</li></ul>')
    expect(r.html).toContain('x = 1 &lt; 2')
    expect(r.html).toContain('<code class="ic">code &lt;b&gt;</code>')
    expect(r.html).not.toContain('<script>')
  })

  it('does not treat dollars inside code as maths', () => {
    const r = renderMarkdown('Use `$x$` and\n```\nprice = "$5" + "$6"\n```')
    expect(r.errors).toEqual([])
    expect(r.html).not.toContain('katex')
  })

  it('uses the preamble macros', () => {
    expect(mathErrors('$\\E[X]$', '\\newcommand{\\E}{\\mathbb{E}}')).toEqual([])
    expect(mathErrors('$\\E[X]$', '')).toHaveLength(1)
  })
})

describe('extractMacros', () => {
  it('reads arguments and removes the definitions from the text', () => {
    const m: Record<string, string> = {}
    const rest = extractMacros('\\newcommand{\\pair}[2]{(#1,#2)}\nbody \\def\\one{1} end', m)
    expect(m['\\pair']).toBe('(#1,#2)')
    expect(m['\\one']).toBe('1')
    expect(rest.trim().replace(/\s+/g, ' ')).toBe('body end')
  })
})
