// Rendering for the Big Exam: the student's LaTeX answer, and Markdown + LaTeX in question text and model answers.
// Pure TypeScript (no DOM), so the Node validator uses the very same code to check that every formula renders.
//
// Design rule: every formula is rendered on its own inside try/catch, so one bad line never breaks the rest of the
// preview. A formula that fails is shown as red source text with KaTeX's message, and listed in `errors`.

import katex from 'katex'

export interface MathSeg { kind: 'math'; tex: string; display: boolean; line: number }
export interface TextSeg { kind: 'text'; text: string; line: number }
export interface UnclosedSeg { kind: 'unclosed'; open: string; line: number }
export type Seg = MathSeg | TextSeg | UnclosedSeg

export interface RenderError { line: number; message: string; source: string }
export interface Rendered { html: string; errors: RenderError[] }

/** environments that are display maths on their own, passed to KaTeX whole (it supports these at the top level) */
const MATH_ENVS = ['equation', 'equation*', 'align', 'align*', 'alignat', 'alignat*', 'gather', 'gather*', 'multline', 'multline*', 'eqnarray', 'eqnarray*', 'displaymath', 'math', 'flalign', 'flalign*']

const lineAt = (src: string, i: number) => {
  let n = 1
  for (let k = 0; k < i; k++) if (src.charCodeAt(k) === 10) n++
  return n
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Split text into plain text and maths. Recognises $..$, $$..$$, \(..\), \[..\] and \begin{align}..\end{align} (and
 * the other display environments). `\$` is a literal dollar. An opener with no closer becomes an `unclosed` segment.
 */
export function splitMath(src: string): Seg[] {
  const out: Seg[] = []
  let text = '', textStart = 0, i = 0
  const flush = (end: number) => {
    if (text) out.push({ kind: 'text', text, line: lineAt(src, textStart) })
    text = ''; textStart = end
  }
  while (i < src.length) {
    const c = src[i]
    if (c === '\\' && src[i + 1] === '$') { text += '\\$'; i += 2; continue }
    if (c === '\\' && src[i + 1] === '\\') { text += '\\\\'; i += 2; continue }
    let open = '', close = '', display = false, whole = false
    if (src.startsWith('$$', i)) { open = '$$'; close = '$$'; display = true }
    else if (c === '$') { open = '$'; close = '$' }
    else if (src.startsWith('\\[', i)) { open = '\\['; close = '\\]'; display = true }
    else if (src.startsWith('\\(', i)) { open = '\\('; close = '\\)' }
    else if (src.startsWith('\\begin{', i)) {
      const m = /^\\begin\{([^}]*)\}/.exec(src.slice(i))
      if (m && MATH_ENVS.includes(m[1])) { open = m[0]; close = `\\end{${m[1]}}`; display = true; whole = true }
    }
    if (!open) { text += c; i++; continue }
    flush(i)
    const from = i + open.length
    let to = src.indexOf(close, from)
    // an inline $..$ may not run across a blank line: that is a stray dollar sign, not a formula
    if (open === '$' && to >= 0 && /\n\s*\n/.test(src.slice(from, to))) to = -1
    if (to < 0) {
      out.push({ kind: 'unclosed', open, line: lineAt(src, i) })
      i = from; textStart = i
      continue
    }
    const inner = src.slice(from, to)
    out.push({ kind: 'math', tex: whole ? open + inner + close : inner, display, line: lineAt(src, i) })
    i = to + close.length; textStart = i
  }
  flush(src.length)
  return out
}

// ---- macros ----

/** Reads a {...} group starting at src[i] === '{'. Returns the inside and the index after the closing brace. */
function readGroup(src: string, i: number): { body: string; end: number } | null {
  if (src[i] !== '{') return null
  let depth = 0
  for (let k = i; k < src.length; k++) {
    const c = src[k]
    if (c === '\\') { k++; continue }
    if (c === '{') depth++
    else if (c === '}' && --depth === 0) return { body: src.slice(i + 1, k), end: k + 1 }
  }
  return null
}

export type Macros = Record<string, string>

/**
 * Finds \newcommand, \renewcommand, \providecommand, \def and \DeclareMathOperator in `src`, puts them into `macros`
 * (KaTeX's own macro table, so it also overrides built-ins such as \R) and returns `src` without them.
 */
export function extractMacros(src: string, macros: Macros): string {
  const re = /\\(newcommand|renewcommand|providecommand|DeclareMathOperator\*?|def|gdef)\s*/g
  let out = '', last = 0, m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length
    let name = ''
    const braced = readGroup(src, i)
    if (braced && /^\\[A-Za-z]+$/.test(braced.body.trim())) { name = braced.body.trim(); i = braced.end }
    else { const bare = /^\\[A-Za-z]+/.exec(src.slice(i)); if (!bare) continue; name = bare[0]; i += name.length }
    // an optional [n] or #1#2 argument list is skipped: KaTeX reads the arity from the #n placeholders in the body
    const opt = /^\s*\[\d\]/.exec(src.slice(i))
    if (opt) i += opt[0].length
    else { const hash = /^(#\d)+/.exec(src.slice(i)); if (hash) i += hash[0].length }
    while (src[i] === ' ' || src[i] === '\n') i++
    const body = readGroup(src, i)
    if (!body) continue
    const isOp = m[1].startsWith('DeclareMathOperator')
    macros[name] = isOp ? `\\operatorname${m[1].endsWith('*') ? '*' : ''}{${body.body}}` : body.body
    out += src.slice(last, m.index)
    last = i = body.end
    re.lastIndex = i
  }
  return out + src.slice(last)
}

// ---- one formula ----

export function renderMath(tex: string, display: boolean, macros: Macros): { html: string } | { error: string } {
  try {
    return { html: katex.renderToString(tex, { displayMode: display, throwOnError: true, strict: 'ignore', macros, maxExpand: 2000, trust: false }) }
  } catch (e) {
    return { error: (e instanceof Error ? e.message : String(e)).replace(/^KaTeX parse error:\s*/, '') }
  }
}

function mathHtml(s: MathSeg, macros: Macros, errors: RenderError[]): string {
  const r = renderMath(s.tex, s.display, macros)
  if ('html' in r) return r.html
  errors.push({ line: s.line, message: r.error, source: s.tex })
  const open = s.display ? '$$' : '$'
  return `<span class="tex-err" title="${esc(r.error)}">${esc(open + s.tex + open)}</span>`
}

const unclosedHtml = (s: UnclosedSeg, errors: RenderError[]) => {
  errors.push({ line: s.line, message: `unclosed ${s.open}`, source: s.open })
  return `<span class="tex-err" title="unclosed ${esc(s.open)}">${esc(s.open)}</span>`
}

// ---- Markdown + LaTeX (question text, model answers) ----

const TOKEN = (n: number) => `\u0001${n}\u0002`
const TOKEN_RE = /\u0001(\d+)\u0002/g

/** a small safe Markdown: headings, lists, quotes, fenced and inline code, **bold**, *italic*; HTML in the source is escaped */
export function renderMarkdown(src: string, macroSource: Macros = {}): Rendered {
  const errors: RenderError[] = []
  const macros: Macros = { ...macroSource }
  const held: string[] = []
  const hold = (html: string) => { held.push(html); return TOKEN(held.length - 1) }

  let s = extractMacros(src, macros)
  s = s.replace(/```([A-Za-z]*)\n([\s\S]*?)```/g, (_, lang: string, code: string) => hold(`<pre class="code"><code${lang ? ` class="lang-${esc(lang)}"` : ''}>${esc(code.replace(/\n$/, ''))}</code></pre>`))
  s = s.replace(/`([^`\n]+)`/g, (_, code: string) => hold(`<code class="ic">${esc(code)}</code>`))
  s = splitMath(s).map((g) => g.kind === 'text' ? g.text : g.kind === 'math' ? hold(mathHtml(g, macros, errors)) : hold(unclosedHtml(g, errors))).join('')
  s = s.replace(/\\\$/g, '$')

  const inline = (t: string) => esc(t)
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\n]+)\*(?![*\w])/g, '$1<em>$2</em>')
    .replace(/(^|[^_\w])_([^_\n]+)_(?![_\w])/g, '$1<em>$2</em>')

  const blocks = s.split(/\n\s*\n/)
  const html = blocks.map((b) => {
    const lines = b.split('\n').filter((l) => l.trim() !== '')
    if (!lines.length) return ''
    const first = lines[0].trim()
    if (lines.length === 1 && /^\u0001\d+\u0002$/.test(first)) return first // a lone code block or display formula
    const h = /^(#{1,4})\s+(.*)$/.exec(first)
    if (h && lines.length === 1) return `<h${h[1].length + 2}>${inline(h[2])}</h${h[1].length + 2}>`
    if (lines.every((l) => /^\s*[-*]\s+/.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ''))}</li>`).join('')}</ul>`
    if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ''))}</li>`).join('')}</ol>`
    if (lines.every((l) => /^\s*>/.test(l))) return `<blockquote>${inline(lines.map((l) => l.replace(/^\s*>\s?/, '')).join(' '))}</blockquote>`
    return `<p>${inline(lines.join('\n')).replace(/\n/g, ' ')}</p>`
  }).join('\n')

  // tokens may sit inside other held HTML only through this one level, so one pass is enough
  return { html: html.replace(TOKEN_RE, (_, n: string) => held[Number(n)]), errors }
}

// ---- the student's LaTeX answer ----

/** matches \name{...} (one argument), allowing nested braces */
function replaceCommand(src: string, name: string, wrap: (arg: string) => string): string {
  const re = new RegExp(`\\\\${name}\\s*\\{`, 'g')
  let out = '', last = 0, m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    const g = readGroup(src, m.index + m[0].length - 1)
    if (!g) continue
    out += src.slice(last, m.index) + wrap(g.body)
    last = g.end
    re.lastIndex = g.end
  }
  return out + src.slice(last)
}

/** typesets the plain-text part of a LaTeX answer (already free of maths): a useful subset, everything else shown as typed */
function latexText(t: string): string {
  t = t.replace(/(^|[^\\])%.*$/gm, '$1') // comments
  let s = esc(t)
  // commands with an argument, innermost-friendly: run a few rounds so \textbf{\emph{x}} works
  for (let round = 0; round < 3; round++) {
    s = replaceCommand(s, 'textbf', (a) => `<strong>${a}</strong>`)
    s = replaceCommand(s, 'textit', (a) => `<em>${a}</em>`)
    s = replaceCommand(s, 'emph', (a) => `<em>${a}</em>`)
    s = replaceCommand(s, 'textrm', (a) => a)
    s = replaceCommand(s, 'underline', (a) => `<u>${a}</u>`)
    s = replaceCommand(s, 'texttt', (a) => `<code class="ic">${a}</code>`)
    s = replaceCommand(s, 'section', (a) => `\n\n<h3>${a}</h3>\n\n`)
    s = replaceCommand(s, 'subsection', (a) => `\n\n<h4>${a}</h4>\n\n`)
    s = replaceCommand(s, 'paragraph', (a) => `\n\n<strong>${a}.</strong> `)
    s = replaceCommand(s, 'textsc', (a) => a)
  }
  s = s.replace(/\\(label|vspace|hspace)\s*\{[^}]*\}/g, '')
  s = s.replace(/\\(noindent|medskip|bigskip|smallskip|hfill|qedhere|clearpage|newpage|centering)\b/g, '')
  s = s.replace(/\\begin\{(proof)\}(\[[^\]]*\])?/g, '\n\n<em>Proof.</em> ').replace(/\\end\{proof\}/g, ' <span class="qed">&#8718;</span>\n\n')
  s = s.replace(/\\begin\{(theorem|lemma|claim|proposition|corollary|definition|remark|example)\}(\[[^\]]*\])?/g,
    (_, n: string) => `\n\n<strong>${n[0].toUpperCase() + n.slice(1)}.</strong> `).replace(/\\end\{(theorem|lemma|claim|proposition|corollary|definition|remark|example)\}/g, '\n\n')
  s = s.replace(/\\begin\{itemize\}/g, '\n\n<ul>').replace(/\\end\{itemize\}/g, '</ul>\n\n')
  s = s.replace(/\\begin\{enumerate\}/g, '\n\n<ol>').replace(/\\end\{enumerate\}/g, '</ol>\n\n')
  s = s.replace(/\\item\s*/g, '<li>')
  s = s.replace(/\\\\(\[[^\]]*\])?|\\newline\b/g, '<br>').replace(/~/g, '&nbsp;')
  s = s.replace(/\\([&%$_#{}])/g, '$1').replace(/\\,|\\;|\\ /g, ' ').replace(/---/g, '&#8212;').replace(/--/g, '&#8211;')
  s = s.replace(/``/g, '&#8220;').replace(/''/g, '&#8221;')
  return s
}

/** Renders a student's answer typed fully in LaTeX: text commands, lists, theorem-style environments and maths. */
export function renderLatexAnswer(src: string, macroSource: Macros = {}): Rendered {
  const errors: RenderError[] = []
  const macros: Macros = { ...macroSource }
  const rest = extractMacros(src.replace(/\\documentclass[^\n]*|\\usepackage(\[[^\]]*\])?\{[^}]*\}|\\begin\{document\}|\\end\{document\}/g, ''), macros)
  const parts = splitMath(rest).map((g) => {
    if (g.kind === 'text') return latexText(g.text)
    return g.kind === 'math' ? mathHtml(g, macros, errors) : unclosedHtml(g, errors)
  }).join('')
  // paragraphs: blank line = new paragraph; block elements are left alone
  const html = parts.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    .map((p) => (/^<(h\d|ul|ol|pre)/.test(p) ? p : `<p>${p}</p>`)).join('\n')
  return { html, errors }
}

/** every formula in a Markdown + LaTeX text that KaTeX cannot render (the validator uses this) */
export function mathErrors(src: string, preamble = ''): RenderError[] {
  const macros: Macros = {}
  extractMacros(preamble, macros)
  return renderMarkdown(src, macros).errors
}
