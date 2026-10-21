// LQ for lecture 7 (Cross-references and macros). One story: the notation and references of a paper. Six parts in the
// order of the lesson: define a macro without argument and one with an argument (tokens mode), use them in a formula
// (render mode with the two macros defined), label an equation, refer to it with parentheses, refer to a section with
// cleveref (tokens mode).
// Lecture 7.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance, Trap } from '../../../../lib/types'
import { BOX, typed } from '../../../shared/typed'

export interface Params {
  set: number // index into SETS
  op: number // index into OPS
  v: string // vector letter
  d: string // dimension letter
  c: number // bound
  eq: string // equation label name
  sec: string // section label name
  start: boolean // the section reference starts a sentence
}

/** Macros without argument: name, body, and what it stands for. */
export const SETS = [
  { name: 'R', body: '\\mathbb{R}', what: 'the real numbers, blackboard bold R' },
  { name: 'N', body: '\\mathbb{N}', what: 'the natural numbers, blackboard bold N' },
  { name: 'Z', body: '\\mathbb{Z}', what: 'the integers, blackboard bold Z' },
]
/** Macros with one argument. */
export const OPS = [
  { name: 'norm', body: '\\lVert #1 \\rVert', what: 'the norm of its argument, between double bars' },
  { name: 'abs', body: '\\lvert #1 \\rvert', what: 'the absolute value of its argument, between single bars' },
  { name: 'vect', body: '\\mathbf{#1}', what: 'its argument in bold, as a vector' },
]
const EQS = ['pricing', 'budget', 'loss', 'update', 'moment']
const SECS = ['data', 'model', 'results', 'robustness']

export function sample(rng: Rng): Params {
  for (;;) {
    const [v, d] = rng.sample(['x', 'y', 'u', 'w', 'n', 'k', 'm'], 2)
    const P: Params = {
      set: rng.pick([0, 1, 2]), op: rng.pick([0, 1, 2]), v, d, c: rng.pick([1, 2, 5, 10]),
      eq: rng.pick(EQS), sec: rng.pick(SECS), start: rng.pick([true, false]),
    }
    if (P.d === P.v) continue
    return P
  }
}

export interface PartKey { key: string; accept?: string[]; traps: Trap[] }

/** The KaTeX macros of the two definitions, used to grade and draw part 3. */
export const macrosOf = (P: Params) => ({ ['\\' + SETS[P.set].name]: SETS[P.set].body, ['\\' + OPS[P.op].name]: OPS[P.op].body })

export function keys(P: Params): PartKey[] {
  const S = SETS[P.set], O = OPS[P.op]
  const use = '\\' + O.name + '{' + P.v + '} \\le ' + P.c + ', \\quad ' + P.v + ' \\in \\' + S.name + '^{' + P.d + '}'
  const expanded = O.body.replace('#1', P.v)
  const cref = (P.start ? '\\Cref' : '\\cref') + '{sec:' + P.sec + '}'
  return [
    {
      key: '\\newcommand{\\' + S.name + '}{' + S.body + '}',
      accept: ['\\newcommand\\' + S.name + '{' + S.body + '}'],
      traps: [
        { text: '\\newcommand{' + S.name + '}{' + S.body + '}', misconception: 'the name of the new command includes its backslash' },
        { text: '\\renewcommand{\\' + S.name + '}{' + S.body + '}', misconception: '\\renewcommand is for a command that already exists; for a new one LaTeX stops with an error' },
      ],
    },
    {
      key: '\\newcommand{\\' + O.name + '}[1]{' + O.body + '}',
      traps: [
        { text: '\\newcommand{\\' + O.name + '}{' + O.body + '}', misconception: 'without [1] the macro takes no argument and #1 is an error' },
        { text: '\\newcommand{\\' + O.name + '}[1]{' + O.body.replace('#1', 'x') + '}', misconception: 'the body refers to the argument as #1; a fixed letter ignores it' },
      ],
    },
    {
      key: use,
      traps: [
        { text: use.replace('\\' + S.name + '^', S.name + '^'), misconception: 'without the backslash the letter is an italic variable, not the macro' },
        ...(P.op === 2 ? [] : [{ text: use.replace('\\' + O.name + '{' + P.v + '}', (P.op === 0 ? '||' : '|') + P.v + (P.op === 0 ? '||' : '|')), misconception: 'typed bars are ordinary symbols; the macro gives the delimiters with the right spacing' }]),
        ...(P.op === 2 ? [{ text: use.replace('\\' + O.name + '{' + P.v + '}', P.v), misconception: 'the vector is set in bold through the macro' }] : []),
      ],
      accept: [use.replace('\\' + O.name + '{' + P.v + '}', expanded)],
    },
    {
      key: '\\label{eq:' + P.eq + '}',
      traps: [
        { text: '\\label{' + P.eq + '}', misconception: 'the paper prefixes equation labels with eq:' },
        { text: '\\ref{eq:' + P.eq + '}', misconception: '\\ref prints a number; \\label defines the name' },
      ],
    },
    {
      key: '\\eqref{eq:' + P.eq + '}', accept: ['(\\ref{eq:' + P.eq + '})'],
      traps: [
        { text: '\\ref{eq:' + P.eq + '}', misconception: '\\ref gives the bare number; equations are cited with parentheses, \\eqref' },
        { text: '\\eqref{' + P.eq + '}', misconception: 'refer to the label exactly as defined, with its eq: prefix' },
      ],
    },
    {
      key: cref,
      traps: [
        { text: '\\ref{sec:' + P.sec + '}', misconception: '\\ref prints only the number; \\cref adds the word section' },
        { text: (P.start ? '\\cref' : '\\Cref') + '{sec:' + P.sec + '}', misconception: P.start ? 'at the start of a sentence the word needs a capital: \\Cref' : 'in the middle of a sentence use \\cref' },
      ],
    },
  ]
}

export function build(P: Params): LQInstance {
  const ks = keys(P)
  const S = SETS[P.set], O = OPS[P.op]
  return {
    intro: 'You are setting up the notation of a paper that loads amsmath and cleveref. The paper writes `\\' + S.name + '` for ' + S.what + ', and `\\' + O.name +
      '{...}` for ' + O.what + '. Labels use prefixes: `eq:` for equations and `sec:` for sections. Type only what goes in each box.',
    parts: [
      typed({
        prompt: 'In the preamble, define the command `\\' + S.name + '`.', lecture: 7,
        explanation: '`\\newcommand{\\name}{body}` defines a command that did not exist. Answer: `' + ks[0].key + '`.',
        view: { kind: 'template', template: '% notation\n' + BOX }, blank: { mode: 'tokens', ...ks[0] },
      }),
      typed({
        prompt: 'Define the command `\\' + O.name + '`, which takes one argument.', lecture: 7,
        explanation: 'The number of arguments goes in square brackets after the name, and the body refers to them as `#1`, `#2`, ... Answer: `' + ks[1].key + '`.',
        view: { kind: 'template', template: BOX }, blank: { mode: 'tokens', ...ks[1] },
      }),
      typed({
        prompt: 'Using the two commands, type the code for this formula.', lecture: 7,
        explanation: 'Each symbol of the notation is written with its macro, so a change of notation is one edit in the preamble. Answer: `' + ks[2].key + '`.',
        view: { kind: 'picture', picture: ks[2].key }, blank: { mode: 'render', macros: macrosOf(P), ...ks[2] },
      }),
      typed({
        prompt: 'Give the displayed equation the label ' + P.eq + ', with the paper\'s prefix.', lecture: 7,
        explanation: 'Inside a numbered environment, `\\label` records the equation number under the name. Answer: `' + ks[3].key + '`.',
        view: { kind: 'template', template: '\\begin{equation}\n  P = \\sum_t c_t e^{-rt} ' + BOX + '\n\\end{equation}' }, blank: { mode: 'tokens', ...ks[3] },
      }),
      typed({
        prompt: 'Refer to that equation so that its number prints in parentheses, as in "by (3)".', lecture: 7,
        explanation: '`\\eqref` (amsmath) prints the number with parentheses. Answer: `' + ks[4].key + '`.',
        view: { kind: 'template', template: 'by ' + BOX + ', the price falls' }, blank: { mode: 'tokens', ...ks[4] },
      }),
      typed({
        prompt: 'Refer to the section labelled `sec:' + P.sec + '` so that the kind of object (the word section) is printed with its number' + (P.start ? ', at the start of a sentence, where it needs a capital.' : ', in the middle of a sentence.'), lecture: 7,
        explanation: 'cleveref\'s `\\cref` prints the kind and the number ("section 2"); `\\Cref` capitalises it for the start of a sentence. Answer: `' + ks[5].key + '`.',
        view: { kind: 'template', template: P.start ? BOX + ' describes the data.' : 'as described in ' + BOX + '.' }, blank: { mode: 'tokens', ...ks[5] },
      }),
    ],
  }
}

export const genLec7: LQGenerator = { id: 'latex-lq-7', generate: (rng) => build(sample(rng)) }
