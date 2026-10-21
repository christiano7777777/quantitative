// LQ for lecture 1 (Document structure). One story: starting the source file of a report. Six parts in the order of the
// lesson: the class line with options, the packages, the title, the authors, a heading, a sentence with special
// characters. The class line and the package list are graded in set mode (option and package order is free), the rest in
// tokens mode. Every part can be answered from the intro and its own prompt.
// Lecture 1.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance, Trap } from '../../../../lib/types'
import { BOX, typed } from '../../../shared/typed'

export interface Params {
  cls: 'article' | 'report'
  size: '10pt' | '11pt' | '12pt'
  paper: 'a4paper' | 'letterpaper'
  pkgs: [string, string]
  title: string
  authors: [string, string]
  heading: string
  level: 'section' | 'subsection'
  starred: boolean
  phrase: number // index into PHRASES
}

const PACKAGES = ['amsmath', 'graphicx', 'booktabs', 'amssymb', 'xcolor', 'geometry']
const TITLES = ['Liquidity and Momentum', 'Forecasting Realised Volatility', 'A Note on Option Spreads', 'Credit Risk in Small Firms', 'Pricing Weather Derivatives']
const NAMES = ['Ann Lee', 'Bo Chen', 'Carla Diaz', 'Dev Patel', 'Eva Novak', 'Femi Okoro']
const HEADINGS = ['Data and Methods', 'Results', 'Robustness Checks', 'Related Work', 'Model Setup']

/** A sentence with characters that are special in LaTeX, and the same sentence correctly escaped. */
export const PHRASES: { raw: string; tex: string }[] = [
  { raw: 'R&D spending rose 5% in 2024', tex: 'R\\&D spending rose 5\\% in 2024' },
  { raw: 'The file data_raw.csv has 3 columns', tex: 'The file data\\_raw.csv has 3 columns' },
  { raw: 'Costs fell by $2 million', tex: 'Costs fell by \\$2 million' },
  { raw: 'Item #4 is 20% cheaper', tex: 'Item \\#4 is 20\\% cheaper' },
  { raw: 'Profit & loss for Q1_2025', tex: 'Profit \\& loss for Q1\\_2025' },
]

export function sample(rng: Rng): Params {
  const [a, b] = rng.sample(NAMES, 2)
  return {
    cls: rng.pick(['article', 'report'] as const), size: rng.pick(['10pt', '11pt', '12pt'] as const),
    paper: rng.pick(['a4paper', 'letterpaper'] as const), pkgs: rng.sample(PACKAGES, 2) as [string, string],
    title: rng.pick(TITLES), authors: [a, b], heading: rng.pick(HEADINGS),
    level: rng.pick(['section', 'subsection'] as const), starred: rng.pick([true, false]), phrase: rng.pick([0, 1, 2, 3, 4]),
  }
}

export interface PartKey { key: string; accept?: string[]; traps: Trap[] }

export function keys(P: Params): PartKey[] {
  const opts = P.size + ',' + P.paper
  const [p1, p2] = P.pkgs
  const head = '\\' + P.level + (P.starred ? '*' : '') + '{' + P.heading + '}'
  const other = (P.level === 'section' ? '\\subsection' : '\\section') + (P.starred ? '*' : '') + '{' + P.heading + '}'
  const flip = '\\' + P.level + (P.starred ? '' : '*') + '{' + P.heading + '}'
  const ph = PHRASES[P.phrase]
  return [
    {
      key: '\\documentclass[' + opts + ']{' + P.cls + '}',
      traps: [
        { text: '\\documentclass{' + P.cls + '}[' + opts + ']', misconception: 'options go in square brackets before the class name' },
        { text: '\\documentclass[' + P.size + ',' + (P.paper === 'a4paper' ? 'a4' : 'letter') + ']{' + P.cls + '}', misconception: 'the paper option is spelled ' + P.paper },
        { text: '\\usepackage[' + opts + ']{' + P.cls + '}', misconception: 'a class is loaded with \\documentclass, not \\usepackage' },
      ],
    },
    {
      key: '\\usepackage{' + p1 + ',' + p2 + '}',
      accept: ['\\usepackage{' + p1 + '}\n\\usepackage{' + p2 + '}', '\\usepackage{' + p2 + '}\n\\usepackage{' + p1 + '}'],
      traps: [
        { text: '\\usepackage{' + p1 + ' ' + p2 + '}', misconception: 'several packages in one \\usepackage are separated by commas' },
        { text: '\\usepackage{' + p1 + '.sty,' + p2 + '.sty}', misconception: 'package names are given without the .sty extension' },
      ],
    },
    {
      key: '\\title{' + P.title + '}',
      traps: [
        { text: '\\title ' + P.title, misconception: 'without braces \\title takes only the first letter as its argument' },
        { text: '\\maketitle{' + P.title + '}', misconception: '\\maketitle prints the title block; the title itself is set with \\title' },
      ],
    },
    {
      key: '\\author{' + P.authors[0] + ' \\and ' + P.authors[1] + '}',
      traps: [
        { text: '\\author{' + P.authors[0] + ' and ' + P.authors[1] + '}', misconception: 'a plain "and" is printed as a word; \\and separates the authors' },
        { text: '\\author{' + P.authors[0] + '}\n\\author{' + P.authors[1] + '}', misconception: 'a second \\author replaces the first one' },
      ],
    },
    {
      key: head,
      traps: [
        { text: flip, misconception: P.starred ? 'without the star the heading gets a number' : 'the star removes the number, and the heading would also be left out of the table of contents' },
        { text: other, misconception: P.level === 'section' ? '\\subsection is one level below a section' : '\\section is one level above a subsection' },
      ],
    },
    {
      key: ph.tex,
      traps: [
        { text: ph.raw, misconception: '& % $ # _ are special in LaTeX and must be escaped with a backslash' },
        { text: ph.raw.replace(/[&%$#_]/g, (c) => '/' + c), misconception: 'the escape character is the backslash, not the slash' },
      ],
    },
  ]
}

const DESCRIBE = (P: Params) =>
  (P.starred ? 'an unnumbered ' : 'a numbered ') + (P.level === 'section' ? 'top-level section' : 'subsection (one level below a section)')

export function build(P: Params): LQInstance {
  const ks = keys(P)
  return {
    intro: 'You are starting the source file of a ' + (P.cls === 'report' ? 'long report with chapters' : 'short paper without chapters') + ' titled "' + P.title +
      '", written by ' + P.authors[0] + ' and ' + P.authors[1] + '. The text is set at ' + P.size.replace('pt', ' points') + ' on ' +
      (P.paper === 'a4paper' ? 'A4' : 'US letter') + ' paper. Type only what goes in each box.',
    parts: [
      typed({
        prompt: 'Write the first line of the file: the standard class that fits this document, with the font size and paper size as class options.', lecture: 1,
        explanation: 'The class goes in braces, its options in square brackets before it; `report` has chapters, `article` does not. The order of the options does not matter. Answer: `' + ks[0].key + '`.',
        view: { kind: 'template', template: BOX + '\n% preamble' }, blank: { mode: 'set', ...ks[0] },
      }),
      typed({
        prompt: 'In the preamble, load the packages ' + P.pkgs[0] + ' and ' + P.pkgs[1] + ' with a single command.', lecture: 1,
        explanation: 'One `\\usepackage` takes a comma-separated list of package names. Two separate lines are also right. Answer: `' + ks[1].key + '`.',
        view: { kind: 'template', template: '% preamble\n' + BOX }, blank: { mode: 'set', ...ks[1] },
      }),
      typed({
        prompt: 'Still in the preamble, set the title of the document.', lecture: 1,
        explanation: 'The title is stored by `\\title{...}` in the preamble and printed later by `\\maketitle`. Answer: `' + ks[2].key + '`.',
        view: { kind: 'template', template: BOX + '\n\\date{\\today}' }, blank: { mode: 'tokens', ...ks[2] },
      }),
      typed({
        prompt: 'Set the two authors so that LaTeX prints them side by side.', lecture: 1,
        explanation: 'Inside `\\author`, the command `\\and` separates authors. Answer: `' + ks[3].key + '`.',
        view: { kind: 'template', template: BOX }, blank: { mode: 'tokens', ...ks[3] },
      }),
      typed({
        prompt: 'In the body, start ' + DESCRIBE(P) + ' with the heading "' + P.heading + '".', lecture: 1,
        explanation: '`\\section` and `\\subsection` are the first two levels in every standard class; a star after the command name removes the number. Answer: `' + ks[4].key + '`.',
        view: { kind: 'template', template: '\\begin{document}\n\\maketitle\n' + BOX }, blank: { mode: 'tokens', ...ks[4] },
      }),
      typed({
        prompt: 'Type this sentence so that it prints exactly as written: `' + PHRASES[P.phrase].raw + '`', lecture: 1,
        explanation: 'Each of `& % $ # _` has a special meaning, so it is written with a backslash in front. An unescaped `%` would even turn the rest of the line into a comment. Answer: `' + ks[5].key + '`.',
        view: { kind: 'template', template: BOX }, blank: { mode: 'tokens', ...ks[5] },
      }),
    ],
  }
}

export const genLec1: LQGenerator = { id: 'latex-lq-1', generate: (rng) => build(sample(rng)) }
