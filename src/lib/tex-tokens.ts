// TeX-aware normalisation for typed answers (src/lib/blank-grader.ts). Nothing here executes or renders the input: it is
// split into tokens the way TeX reads it, rewritten to a canonical form, and the canonical strings are compared.
//
// tokens mode: `%` comments go; a control word swallows the spaces after it; text is one token per character (so x^10 and
//   x^{10} differ); a space survives only between two word characters (or after a closing brace before a word character);
//   \( \) become $ $; a brace group holding exactly one token in argument position is unwrapped (\frac12 = \frac{1}{2});
//   a bib entry gets its type and field names lower-cased and its values written as {..}.
// set mode: tokens mode, then option lists [a,b], the package lists of \usepackage and friends, `.style={..}` lists inside
//   options, the placement letters of a float and the fields of a bib entry are sorted. \cite lists and everything else
//   keep their order.

export type TokKind = 'cw' | 'cs' | 'ch' | 'sp' | 'open' | 'close' | 'lb' | 'rb'
export interface Tok { t: TokKind; v: string }

/** Fixes what phone keyboards and copy-paste do to code. Applied to every answer in every mode. */
export function preNormalize(s: string): string {
  return s
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/—/g, '--')
    .replace(/…/g, '...')
    .replace(/ /g, ' ')
    .replace(/＼/g, '\\')
    .trim()
}

const LETTER = /[A-Za-z@]/
const WORD = /^[\p{L}\p{N}]$/u
const SPACE = /[ \t\n\f\v]/

/** Removes `%` comments (an escaped \% stays), with the newline and the leading spaces of the next line, as TeX does. */
export function stripComments(s: string): string {
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '\\' && i + 1 < s.length) { out += c + s[i + 1]; i++; continue }
    if (c === '%') {
      while (i < s.length && s[i] !== '\n') i++
      while (i + 1 < s.length && (s[i + 1] === ' ' || s[i + 1] === '\t')) i++
      continue
    }
    out += c
  }
  return out
}

export function tokenize(src: string): Tok[] {
  const s = stripComments(src)
  const out: Tok[] = []
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (c === '\\') {
      if (i + 1 >= s.length) { out.push({ t: 'ch', v: '\\' }); i++; continue }
      if (LETTER.test(s[i + 1])) {
        let j = i + 1
        while (j < s.length && LETTER.test(s[j])) j++
        out.push({ t: 'cw', v: s.slice(i + 1, j) })
        while (j < s.length && SPACE.test(s[j])) j++ // TeX skips spaces after a control word
        i = j
        continue
      }
      const n = s[i + 1]
      out.push({ t: 'cs', v: SPACE.test(n) ? ' ' : n })
      i += 2
      continue
    }
    if (SPACE.test(c)) {
      while (i < s.length && SPACE.test(s[i])) i++
      out.push({ t: 'sp', v: ' ' })
      continue
    }
    const t: TokKind = c === '{' ? 'open' : c === '}' ? 'close' : c === '[' ? 'lb' : c === ']' ? 'rb' : 'ch'
    out.push({ t, v: c })
    i++
  }
  return out
}

const isWord = (k: Tok | undefined) => !!k && k.t === 'ch' && WORD.test(k.v)

/** Keeps a space only where it separates words: between two word characters, or after `}` before a word character. */
function pruneSpaces(ts: Tok[]): Tok[] {
  const out: Tok[] = []
  for (let i = 0; i < ts.length; i++) {
    const k = ts[i]
    if (k.t !== 'sp') { out.push(k); continue }
    const prev = out[out.length - 1]
    const next = ts[i + 1]
    if ((isWord(prev) || prev?.t === 'close') && isWord(next)) out.push(k)
  }
  return out
}

// ---- a tree of brace groups (brackets become groups only where set mode needs them) ----

export type Node = Tok | Group
export interface Group { t: 'group'; open: '{' | '['; kids: Node[] }

const isGroup = (n: Node | undefined): n is Group => !!n && n.t === 'group'

/** Brace groups; null when the braces do not balance (such an answer never equals a key, which always balances). */
function parseBraces(ts: Tok[]): Node[] | null {
  const stack: Node[][] = [[]]
  for (const k of ts) {
    if (k.t === 'open') stack.push([])
    else if (k.t === 'close') {
      if (stack.length === 1) return null
      const kids = stack.pop()!
      stack[stack.length - 1].push({ t: 'group', open: '{', kids })
    } else stack[stack.length - 1].push(k)
  }
  return stack.length === 1 ? stack[0] : null
}

/** Turns matching [ ... ] inside one sequence into bracket groups; an unmatched bracket stays a token. Recursive. */
function parseBrackets(ns: Node[]): Node[] {
  const out: Node[] = []
  for (let i = 0; i < ns.length; i++) {
    const n = ns[i]
    if (isGroup(n)) { out.push({ ...n, kids: parseBrackets(n.kids) }); continue }
    if (n.t === 'lb') {
      let depth = 0, j = i
      for (; j < ns.length; j++) {
        const m = ns[j]
        if (isGroup(m)) continue
        if (m.t === 'lb') depth++
        else if (m.t === 'rb' && --depth === 0) break
      }
      if (j < ns.length) {
        out.push({ t: 'group', open: '[', kids: parseBrackets(ns.slice(i + 1, j)) })
        i = j
        continue
      }
    }
    out.push(n)
  }
  return out
}

/** A brace group directly after a control word/symbol, ^ or _, `]` or another argument group is an argument. */
function unwrapArgs(ns: Node[]): Node[] {
  const out: Node[] = []
  let argPos = false
  for (const n0 of ns) {
    const n: Node = isGroup(n0) ? { ...n0, kids: unwrapArgs(n0.kids) } : n0
    if (isGroup(n) && n.open === '{') {
      if (argPos && n.kids.length === 1 && !isGroup(n.kids[0]) && n.kids[0].t !== 'sp') { out.push(n.kids[0]); argPos = true; continue }
      out.push(n)
      continue // argPos unchanged: the next brace group is an argument too
    }
    out.push(n)
    if (isGroup(n)) { argPos = true; continue } // [..] optional argument
    argPos = n.t === 'cw' || (n.t === 'cs' && n.v !== '\\') || (n.t === 'ch' && (n.v === '^' || n.v === '_')) || n.t === 'rb'
  }
  return out
}

const delimiters = (ts: Tok[]) => ts.map((k) => (k.t === 'cs' && (k.v === '(' || k.v === ')') ? { t: 'ch' as const, v: '$' } : k))

// ---- serialisation: unambiguous, one record per node ----

export function serialize(ns: Node[]): string {
  return ns.map((n) => {
    if (isGroup(n)) return n.open === '{' ? '{' + serialize(n.kids) + '}' : '[' + serialize(n.kids) + ']'
    switch (n.t) {
      case 'cw': return '\\' + n.v + '\u0001'
      case 'cs': return '\\' + n.v
      case 'sp': return '\u0002'
      case 'lb': return '\u0003'
      case 'rb': return '\u0004'
      default: return n.v === '\\' ? '\u0005' : n.v
    }
  }).join('')
}

// ---- bib entries ----

const isCh = (n: Node | undefined, v: string) => !!n && !isGroup(n) && n.t === 'ch' && n.v === v

/** Splits a sequence at top-level commas, treating "..." as one span (bib values). */
function splitCommas(ns: Node[], quotes: boolean): Node[][] {
  const items: Node[][] = [[]]
  let inQ = false
  for (const n of ns) {
    if (quotes && isCh(n, '"')) inQ = !inQ
    if (!inQ && isCh(n, ',')) items.push([])
    else items[items.length - 1].push(n)
  }
  return items
}

const trimSp = (ns: Node[]) => {
  let a = 0, b = ns.length
  while (a < b && !isGroup(ns[a]) && (ns[a] as Tok).t === 'sp') a++
  while (b > a && !isGroup(ns[b - 1]) && (ns[b - 1] as Tok).t === 'sp') b--
  return ns.slice(a, b)
}

const lower = (ns: Node[]) => ns.map((n) => (!isGroup(n) && n.t === 'ch' ? { ...n, v: n.v.toLowerCase() } : n))

/** `name = value` with a lower-case name and the value as one {..} group ("..." and bare words are rewritten). */
function bibField(item: Node[]): { name: string; nodes: Node[] } {
  const eq = item.findIndex((n) => isCh(n, '='))
  if (eq < 0) return { name: '', nodes: trimSp(item) }
  const name = lower(trimSp(item.slice(0, eq)))
  let value = trimSp(item.slice(eq + 1))
  if (value.length >= 2 && isCh(value[0], '"') && isCh(value[value.length - 1], '"')) value = [{ t: 'group', open: '{', kids: value.slice(1, -1) }]
  else if (!(value.length === 1 && isGroup(value[0]))) value = [{ t: 'group', open: '{', kids: value }]
  const nodes: Node[] = [...name, { t: 'ch', v: '=' }, ...value]
  return { name: serialize(name), nodes }
}

/** `@type{key, field = value, ...}` → canonical nodes; fields sorted by name when `sort`. Null when it is not a bib entry. */
function bibEntry(ns: Node[], sort: boolean): Node[] | null {
  if (!isCh(ns[0], '@')) return null
  let i = 1
  while (i < ns.length && !isGroup(ns[i])) i++
  const body = ns[i]
  if (!isGroup(body) || body.open !== '{' || trimSp(ns.slice(i + 1)).length > 0) return null
  const type = lower(trimSp(ns.slice(1, i)))
  const items = splitCommas(body.kids, true).map(trimSp)
  if (items.length > 1 && items[items.length - 1].length === 0) items.pop() // trailing comma
  const [key, ...rest] = items
  let fields = rest.map(bibField)
  if (sort) fields = [...fields].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  const kids: Node[] = [...key]
  for (const f of fields) kids.push({ t: 'ch', v: ',' }, ...f.nodes)
  return [{ t: 'ch', v: '@' }, ...type, { t: 'group', open: '{', kids }]
}

// ---- set mode sorting ----

const SORTED_PACKAGE_LISTS = new Set(['usepackage', 'RequirePackage', 'usetikzlibrary', 'usepgfplotslibrary'])
const FLOATS = new Set(['figure', 'figure*', 'table', 'table*'])
const PLACEMENT = /^[htbpH!]+$/

const sortItems = (items: Node[][]) => items.map((it) => serialize(trimSp(it))).sort().join(',')

/** An option list item `key=value` where key ends in `style`: its braced value is a list too. */
function sortStyleValue(item: Node[]): Node[] {
  const eq = item.findIndex((n) => isCh(n, '='))
  if (eq < 0) return item
  const name = serialize(trimSp(item.slice(0, eq)))
  const val = trimSp(item.slice(eq + 1))
  if (!/style$/.test(name) || val.length !== 1 || !isGroup(val[0]) || val[0].open !== '{') return item
  const g = val[0]
  return [...trimSp(item.slice(0, eq)), { t: 'ch', v: '=' }, { t: 'ch', v: '{' + sortItems(splitCommas(g.kids, false).map(sortStyleValue)) + '}' }]
}

function setSort(ns: Node[]): Node[] {
  const kids = ns.map((n) => (isGroup(n) ? { ...n, kids: setSort(n.kids) } : n))
  const out: Node[] = []
  for (let i = 0; i < kids.length; i++) {
    const n = kids[i]
    if (!isGroup(n)) { out.push(n); continue }
    if (n.open === '[') {
      // placement specifier right after \begin{figure|table}
      const env = kids[i - 1], begin = kids[i - 2]
      const envName = isGroup(env) ? serialize(env.kids) : !isGroup(env) && env?.t === 'ch' ? env.v : ''
      if (!isGroup(begin) && begin?.t === 'cw' && begin.v === 'begin' && FLOATS.has(envName) && PLACEMENT.test(serialize(n.kids))) {
        out.push({ t: 'ch', v: '[' + [...serialize(n.kids)].sort().join('') + ']' })
        continue
      }
      const items = splitCommas(n.kids, false)
      if (items.length > 1) { out.push({ t: 'ch', v: '[' + sortItems(items.map(sortStyleValue)) + ']' }); continue }
      out.push(n)
      continue
    }
    // a brace list sorted only as the package list of \usepackage and friends (after an optional [..])
    let j = i - 1
    if (isGroup(kids[j]) && (kids[j] as Group).open === '[') j--
    const cmd = kids[j]
    const items = splitCommas(n.kids, false)
    if (items.length > 1 && !isGroup(cmd) && cmd?.t === 'cw' && SORTED_PACKAGE_LISTS.has(cmd.v)) {
      out.push({ t: 'ch', v: '{' + sortItems(items) + '}' })
      continue
    }
    out.push(n)
  }
  return out
}

// ---- public normalisers ----

function tree(s: string, brackets: boolean): Node[] | null {
  const ns = parseBraces(pruneSpaces(delimiters(tokenize(preNormalize(s)))))
  if (!ns) return null
  return unwrapArgs(brackets ? parseBrackets(ns) : ns)
}

/** Canonical string for `tokens` mode, or null if the braces do not balance. */
export function normalizeTokens(s: string): string | null {
  const ns = tree(s, false)
  if (!ns) return null
  return serialize(bibEntry(ns, false) ?? ns)
}

/** Canonical string for `set` mode, or null if the braces do not balance. */
export function normalizeSet(s: string): string | null {
  const ns = tree(s, true)
  if (!ns) return null
  const bib = bibEntry(ns, true)
  return serialize(bib ?? setSort(ns))
}

/** Plain text: trimmed, runs of whitespace collapsed. */
export const normalizeExact = (s: string) => preNormalize(s).replace(/\s+/g, ' ')
