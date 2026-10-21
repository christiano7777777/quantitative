// Marks one typed answer against a Blank (see BlankMode in types.ts). Pure functions, no DOM: used by the grader, the bank
// tests and the lesson practice box. Order: empty or over-long → wrong; equal to a trap → wrong (the trap is reported);
// equal to the key or an `accept` entry → right; otherwise wrong.
import katex from 'katex'
import { normalizeExact, normalizeSet, normalizeTokens, preNormalize } from './tex-tokens'
import type { Blank, BlankMode, Trap } from './types'

/** Longer answers are wrong without being parsed (the input box has the same limit for every question). */
export const MAX_ANSWER = 2000

/** Where the answer box goes inside a template. */
export const BLANK_MARK = '⟦⟧'

const ANNOTATION = /<annotation[^>]*>[\s\S]*?<\/annotation>/g

/** One outer $..$, $$..$$, \(..\) or \[..\] typed around a formula is not part of the answer. */
export function stripMathDelimiters(s: string): string {
  const m = /^\$\$([\s\S]*)\$\$$/.exec(s) ?? /^\$([\s\S]*)\$$/.exec(s) ?? /^\\\(([\s\S]*)\\\)$/.exec(s) ?? /^\\\[([\s\S]*)\\\]$/.exec(s)
  return m ? m[1].trim() : s
}

/**
 * KaTeX MathML of a formula without the <annotation> (which repeats the source and would make every comparison fail), or
 * null if KaTeX rejects it. Every call gets a fresh copy of the macros, so \gdef in one answer cannot change the next.
 */
export function renderCanonical(src: string, macros?: Record<string, string>): string | null {
  const s = stripMathDelimiters(src)
  if (!s) return null
  try {
    return katex.renderToString(s, {
      output: 'mathml', displayMode: true, throwOnError: true, strict: 'ignore', trust: false,
      maxExpand: 200, maxSize: 10, macros: { ...(macros ?? {}) },
    }).replace(ANNOTATION, '')
  } catch {
    return null
  }
}

/**
 * The canonical form of an answer in a mode, or null when it cannot be read (unbalanced braces, KaTeX error). With a
 * `context`, the answer is first put in place of its BLANK_MARK.
 */
export function canonical(raw: string, mode: BlankMode, macros?: Record<string, string>, context?: string): string | null {
  const t = preNormalize(raw)
  if (!t || t.length > MAX_ANSWER) return null
  const s = context === undefined ? t : context.split(BLANK_MARK).join(t)
  switch (mode) {
    case 'exact': return normalizeExact(s)
    case 'tokens': return normalizeTokens(s)
    case 'set': return normalizeSet(s)
    case 'render': return renderCanonical(s, macros)
  }
}

export function equivalent(a: string, b: string, mode: BlankMode, macros?: Record<string, string>, context?: string): boolean {
  const x = canonical(a, mode, macros, context)
  if (x === null) return false
  const y = canonical(b, mode, macros, context)
  return y !== null && x === y
}

export interface BlankVerdict { correct: boolean; trap?: Trap }

export function gradeBlank(given: string, b: Blank): BlankVerdict {
  const g = canonical(given, b.mode, b.macros, b.context)
  if (g === null) return { correct: false }
  const same = (x: string) => canonical(x, b.mode, b.macros, b.context) === g
  const trap = (b.traps ?? []).find((t) => same(t.text))
  if (trap) return { correct: false, trap }
  return { correct: [b.key, ...(b.accept ?? [])].some(same) }
}

/** Plain words for the results page. */
export const modeLabel: Record<BlankMode, string> = {
  render: 'compared as rendered maths (spacing and brace style do not matter, what the formula looks like does)',
  tokens: 'compared as LaTeX code (spaces between commands, % comments and braces around a single token do not matter)',
  set: 'compared as LaTeX code, with option and package lists in any order',
  exact: 'compared exactly, as plain text (only extra spaces are ignored)',
}
