import { describe, expect, it } from 'vitest'
import { canonical, equivalent, gradeBlank, MAX_ANSWER, renderCanonical, stripMathDelimiters } from './blank-grader'
import type { Blank, BlankMode } from './types'

const table: Record<BlankMode, { same: [string, string][]; differ: [string, string][] }> = {
  exact: {
    same: [
      ['git  commit', 'git commit'],
      [' *.log ', '*.log'],
      ['“tight”', '"tight"'],
      ['git push —force', 'git push --force'],
      ['main.tex\n', 'main.tex'],
    ],
    differ: [
      ['*.aux', '.aux'],
      ['main.tex', 'Main.tex'],
      ['"tight"', "'tight'"],
      ['add .', 'add -A'],
      ['gitcommit', 'git commit'],
    ],
  },
  tokens: {
    same: [
      ['\\frac12', '\\frac{1}{2}'],
      ['\\textbf a', '\\textbf{a}'],
      ['\\usepackage{booktabs} % rules', '\\usepackage{booktabs}'],
      ['\\(x\\)', '$x$'],
      ['\\\\ \\hline', '\\\\\\hline'],
      ['\\section {Intro}', '\\section{Intro}'],
      ['\\begin{table} [ htbp ]', '\\begin{table}[htbp]'],
      ['\\includegraphics[width = 0.5\\textwidth]{a}', '\\includegraphics[width=0.5\\textwidth]{a}'],
      ['\\usepackage{a, b}', '\\usepackage{a,b}'],
      ['@Article{k, Title = "X"}', '@article{k, title={X}}'],
      ['@misc{k, year = 2024,}', '@misc{k,year={2024}}'],
      ['\\frac{a} {b}', '\\frac{a}{b}'],
    ],
    differ: [
      ['x^10', 'x^{10}'],
      ['\\section{Related Work}', '\\section{RelatedWork}'],
      ['\\begin{table}[h]', '\\begin{table}[H]'],
      ['\\begin{tabular}{c|c}', '\\begin{tabular}{cc}'],
      ['\\toprule', '\\hline'],
      ['\\usepackage{a,b}', '\\usepackage{b,a}'],
      ['\\section{Intro', '\\section{Intro}'],
      ['\\%', ''],
      ['\\emph{a}', '\\emph{A}'],
      ['\\[x\\]', '$x$'],
    ],
  },
  set: {
    same: [
      ['\\begin{figure}[htbp]', '\\begin{figure}[bpth]'],
      ['\\usepackage{amsmath,amssymb}', '\\usepackage{amssymb, amsmath}'],
      ['\\includegraphics[width=0.8\\textwidth,angle=90]{f}', '\\includegraphics[angle=90, width=0.8\\textwidth]{f}'],
      ['@Article{k, Year=2024, title={X}}', '@article{k, title={X}, year={2024}}'],
      ['\\tikzset{every node/.style={draw,fill}}', '\\tikzset{every node/.style={draw,fill}}'],
      ['\\begin{tikzpicture}[every node/.style={draw,fill}, x=1cm]', '\\begin{tikzpicture}[x=1cm,every node/.style={fill,draw}]'],
      ['\\usepackage[margin=2cm,a4paper]{geometry}', '\\usepackage[a4paper, margin=2cm]{geometry}'],
      ['@book{key, author = "Lee, Ann", year = 2020}', '@book{key, year={2020}, author={Lee, Ann}}'],
    ],
    differ: [
      ['\\begin{figure}[htbp]', '\\begin{figure}[htb]'],
      ['\\cite{b,a}', '\\cite{a,b}'],
      ['@article{a, title={X}}', '@article{title={X}, a}'],
      ['\\begin{tabular}{lcr}', '\\begin{tabular}{rcl}'],
      ['\\includegraphics[width=.8\\textwidth]{f}', '\\includegraphics[width=0.8\\textwidth]{f}'],
      ['\\addplot[legend entries={a,b}]', '\\addplot[legend entries={b,a}]'],
      ['\\begin{equation}[ab]', '\\begin{equation}[ba]'],
    ],
  },
  render: {
    same: [
      ['\\frac12', '\\frac{1}{2}'],
      ['\\int_0^1', '\\int^1_0'],
      ['\\le', '\\leq'],
      ['\\left(\\frac12\\right)', '\\left( \\frac{1}{2} \\right)'],
      ['\\{a\\}', '\\lbrace a\\rbrace'],
      ['$e^{i\\pi}$', 'e^{i \\pi }'],
      ['\\(\\alpha\\)', '\\alpha'],
    ],
    differ: [
      ['x^10', 'x^{10}'],
      ['\\sin x', 'sin x'],
      ['\\dfrac12', '\\frac12'],
      ['\\left(x\\right)', '(x)'],
      ['\\bar{xy}', '\\overline{xy}'],
      ['\\text{a b}', '\\text{ab}'],
    ],
  },
}

describe.each(Object.entries(table))('%s mode', (mode, { same, differ }) => {
  it.each(same)('%s ≡ %s', (a, b) => expect(equivalent(a, b, mode as BlankMode)).toBe(true))
  it.each(differ)('%s ≠ %s', (a, b) => expect(equivalent(a, b, mode as BlankMode)).toBe(false))
})

describe('render safety', () => {
  it('ignores the annotation that repeats the source', () => {
    expect(renderCanonical('x')).not.toContain('annotation')
  })
  it('a \\gdef in one answer does not leak into the next render', () => {
    const macros = { '\\RR': '\\mathbb{R}' }
    renderCanonical('\\gdef\\frac#1#2{0}\\gdef\\RR{0}\\frac12', macros)
    expect(macros).toEqual({ '\\RR': '\\mathbb{R}' })
    expect(equivalent('\\frac12', '\\frac{1}{2}', 'render')).toBe(true)
    expect(renderCanonical('\\RR', macros)).not.toBeNull()
    expect(renderCanonical('\\RR')).toBeNull() // no macros: undefined control sequence
  })
  it('rejects runaway macros, unbalanced input and \\href without trust as a link', () => {
    expect(renderCanonical('\\def\\a{\\a\\a}\\a')).toBeNull()
    expect(renderCanonical('\\frac{')).toBeNull()
    expect(renderCanonical('\\href{javascript:alert(1)}{x}') ?? '').not.toMatch(/href=|javascript:/)
  })
  it('strips one outer pair of math delimiters only', () => {
    expect(stripMathDelimiters('$x$')).toBe('x')
    expect(stripMathDelimiters('$$x$$')).toBe('x')
    expect(stripMathDelimiters('\\(x\\)')).toBe('x')
    expect(stripMathDelimiters('\\[x\\]')).toBe('x')
    expect(stripMathDelimiters('$a$+$b$')).toBe('a$+$b')
  })
})

describe('gradeBlank', () => {
  const b: Blank = {
    mode: 'tokens', key: '\\toprule', accept: ['\\toprule[1pt]'],
    traps: [{ text: '\\hline', misconception: 'hline is the plain LaTeX rule, not the booktabs one' }],
  }
  it('accepts the key and the accept list', () => {
    expect(gradeBlank('\\toprule', b).correct).toBe(true)
    expect(gradeBlank(' \\toprule  % top', b).correct).toBe(true)
    expect(gradeBlank('\\toprule[1pt]', b).correct).toBe(true)
  })
  it('reports a trap', () => {
    const r = gradeBlank('\\hline ', b)
    expect(r.correct).toBe(false)
    expect(r.trap?.misconception).toMatch(/booktabs/)
  })
  it('rejects empty, unrelated and over-long answers', () => {
    expect(gradeBlank('', b).correct).toBe(false)
    expect(gradeBlank('   ', b).correct).toBe(false)
    expect(gradeBlank('\\midrule', b)).toEqual({ correct: false })
    expect(gradeBlank('\\toprule' + ' '.repeat(MAX_ANSWER) + 'x', b).correct).toBe(false)
  })
  it('handles a long answer quickly', () => {
    const t = Date.now()
    gradeBlank('{'.repeat(1000) + '}'.repeat(1000), b)
    gradeBlank('x'.repeat(MAX_ANSWER), { mode: 'render', key: 'x' })
    gradeBlank('x'.repeat(MAX_ANSWER), { mode: 'set', key: 'x' })
    expect(Date.now() - t).toBeLessThan(2000)
  })
  it('compares in context: placement letters become a set only inside \\begin{figure}[..]', () => {
    const ctx = '\\begin{figure}[\u27e6\u27e7]'
    const place: Blank = { mode: 'set', key: 'htb', context: ctx, traps: [{ text: 'H', misconception: 'H is not a placement list' }] }
    expect(gradeBlank('bth', place).correct).toBe(true)
    expect(gradeBlank('htbp', place).correct).toBe(false)
    expect(gradeBlank('H', place).trap?.text).toBe('H')
    expect(gradeBlank('bth', { mode: 'set', key: 'htb' }).correct).toBe(false) // no context: just letters
    expect(gradeBlank('', place).correct).toBe(false) // an empty box is not the bare context
  })
  it('canonical is null for input that cannot be read', () => {
    expect(canonical('\\section{a', 'tokens')).toBeNull()
    expect(canonical('}{', 'set')).toBeNull()
    expect(canonical('', 'exact')).toBeNull()
  })
})
