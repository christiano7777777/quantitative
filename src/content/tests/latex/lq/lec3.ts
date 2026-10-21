// LQ for lecture 3 (Mathematical typesetting II). One story: the model section of a paper. Six parts in the order of the
// lesson: a matrix, a piecewise definition, an aligned derivation (all three in render mode), then a theorem-like
// environment: its definition, its use with an optional title, and the proof after it (tokens mode).
// Lecture 3.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance, Trap } from '../../../../lib/types'
import { BOX, typed } from '../../../shared/typed'

export interface Params {
  rows: number[][] // 2 rows, 2 or 3 columns
  c: number // threshold of the piecewise function
  pieces: [string, string] // TeX of the two pieces
  k: number // (x + k)^2
  env: 'lemma' | 'proposition' | 'corollary' | 'claim'
  inSection: boolean
  thmTitle: string
  proofTitle: string
}

const PIECES = ['0', 'x', 'x^{2}', '1 - x', '2x', '\\sqrt{x}']
const TITLES = ['Unbiasedness', 'A bound on the variance', 'Uniqueness of the price', 'Monotone payoff']
const PROOF_TITLES = ['Sketch of proof', 'Proof of the bound', 'Proof (outline)']
const NAME: Record<Params['env'], string> = { lemma: 'Lemma', proposition: 'Proposition', corollary: 'Corollary', claim: 'Claim' }

export function sample(rng: Rng): Params {
  for (;;) {
    const cols = rng.pick([2, 3])
    const rows = [0, 1].map(() => Array.from({ length: cols }, () => rng.pick([-3, -2, -1, 0, 1, 2, 3, 4, 5, 7])))
    const pieces = rng.sample(PIECES, 2) as [string, string]
    const P: Params = {
      rows, c: rng.pick([0, 1, 2, 5]), pieces, k: rng.pick([1, 2, 3, 4, 5, 6]),
      env: rng.pick(['lemma', 'proposition', 'corollary', 'claim'] as const), inSection: rng.pick([true, false]),
      thmTitle: rng.pick(TITLES), proofTitle: rng.pick(PROOF_TITLES),
    }
    // two equal rows would make a row swap invisible; keep the matrix informative
    if (rows[0].join() === rows[1].join()) continue
    return P
  }
}

export interface PartKey { key: string; accept?: string[]; traps: Trap[] }

export const matrixBody = (rows: number[][]) => rows.map((r) => r.join(' & ')).join(' \\\\ ')

export function keys(P: Params): PartKey[] {
  const body = matrixBody(P.rows)
  const cases = (amp: boolean, text: boolean) =>
    'f(x) = \\begin{cases} ' + P.pieces[0] + (amp ? ' & ' : ' ') + (text ? '\\text{if } ' : 'if ') + 'x < ' + P.c + ' \\\\ ' +
    P.pieces[1] + (amp ? ' & ' : ' ') + (text ? '\\text{if } ' : 'if ') + 'x \\ge ' + P.c + ' \\end{cases}'
  const lines = (amp: boolean, env: string) =>
    '\\begin{' + env + '} f(x) ' + (amp ? '&' : '') + '= (x + ' + P.k + ')^{2} \\\\ ' + (amp ? '&' : '') + '= x^{2} + ' + 2 * P.k + 'x + ' + P.k * P.k + ' \\end{' + env + '}'
  const name = NAME[P.env]
  const def = '\\newtheorem{' + P.env + '}{' + name + '}' + (P.inSection ? '[section]' : '')
  return [
    {
      key: '\\begin{pmatrix} ' + body + ' \\end{pmatrix}',
      traps: [
        { text: '\\begin{bmatrix} ' + body + ' \\end{bmatrix}', misconception: 'bmatrix draws square brackets; the picture has round ones (pmatrix)' },
        { text: '\\begin{pmatrix} ' + P.rows.map((r) => r.join(' & ')).join(' & ') + ' \\end{pmatrix}', misconception: 'rows are separated by \\\\, otherwise everything is one long row' },
      ],
    },
    {
      key: cases(true, true),
      traps: [
        { text: cases(false, true), misconception: 'without & the conditions are not lined up in their own column' },
        { text: cases(true, false), misconception: 'words in maths need \\text{...}, otherwise they are italic variables' },
      ],
    },
    {
      key: lines(true, 'aligned'),
      accept: [lines(true, 'align*')],
      traps: [
        { text: lines(false, 'aligned'), misconception: 'without & the = signs are not lined up under each other' },
        { text: lines(true, 'align'), misconception: 'align numbers every line; the picture has no equation numbers' },
      ],
    },
    {
      key: def,
      traps: [
        { text: '\\newtheorem{' + name + '}{' + P.env + '}' + (P.inSection ? '[section]' : ''), misconception: 'the first argument is the environment name, the second the heading that is printed' },
        P.inSection
          ? { text: '\\newtheorem{' + P.env + '}[section]{' + name + '}', misconception: 'an optional argument between the two braces shares an existing counter; numbering within sections goes at the end' }
          : { text: def + '[section]', misconception: '[section] at the end would restart the numbering in every section' },
      ],
    },
    {
      key: '\\begin{' + P.env + '}[' + P.thmTitle + ']',
      traps: [
        { text: '\\begin{' + P.env + '}{' + P.thmTitle + '}', misconception: 'the optional title goes in square brackets; braces print it as the first words of the statement' },
        { text: '\\begin{' + name + '}[' + P.thmTitle + ']', misconception: 'the environment is called by its name (' + P.env + '), not by its printed heading' },
      ],
    },
    {
      key: '\\begin{proof}[' + P.proofTitle + ']',
      traps: [
        { text: '\\begin{proof}{' + P.proofTitle + '}', misconception: 'the replacement heading of a proof goes in square brackets' },
        { text: '\\begin{' + P.env + '}[' + P.proofTitle + ']', misconception: 'the proof has its own environment from amsthm, proof' },
      ],
    },
  ]
}

export function build(P: Params): LQInstance {
  const ks = keys(P)
  const name = NAME[P.env]
  return {
    intro: 'You are typesetting the model section of a paper that loads amsmath and amsthm. The first three formulas arrive as pictures: type the code ' +
      'for each (the maths only, with or without `\\[ \\]`). Then the paper needs a new kind of result, a ' + P.env + ' printed with the heading "' + name + '".',
    parts: [
      typed({
        prompt: 'The matrix of the model. Type the code for this formula.', lecture: 3,
        explanation: 'Round brackets mean `pmatrix`. Inside it, `&` separates entries and `\\\\` separates rows. Answer: `' + ks[0].key + '`.',
        view: { kind: 'picture', picture: ks[0].key }, blank: { mode: 'render', ...ks[0] },
      }),
      typed({
        prompt: 'The payoff, defined piece by piece. Type the code for this formula.', lecture: 3,
        explanation: '`cases` puts each value, then `&`, then its condition on one line; the word "if" is text, so it goes in `\\text{if }`. Answer: `' + ks[1].key + '`.',
        view: { kind: 'picture', picture: ks[1].key }, blank: { mode: 'render', ...ks[1] },
      }),
      typed({
        prompt: 'A two-line derivation with the equals signs under each other. Type the code for this formula.', lecture: 3,
        explanation: 'Inside a display, `aligned` lines up the points marked with `&`; here that is just before each `=`. As a whole display, `align*` gives the same picture; `align` would add numbers. Answer: `' + ks[2].key + '`.',
        view: { kind: 'picture', picture: ks[2].key }, blank: { mode: 'render', ...ks[2] },
      }),
      typed({
        prompt: 'In the preamble, define the environment ' + P.env + ' with the heading "' + name + '", numbered ' + (P.inSection ? 'within each section (1.1, 1.2, 2.1, ...)' : 'straight through the paper (1, 2, 3, ...)') + '.', lecture: 3,
        explanation: '`\\newtheorem{name}{Heading}` defines a numbered environment; an optional `[section]` at the end makes the number restart in each section. Answer: `' + ks[3].key + '`.',
        view: { kind: 'template', template: '\\usepackage{amsthm}\n' + BOX }, blank: { mode: 'tokens', ...ks[3] },
      }),
      typed({
        prompt: 'Open a ' + P.env + ' with the title "' + P.thmTitle + '" printed in brackets after its number.', lecture: 3,
        explanation: 'The environment takes an optional title in square brackets. Answer: `' + ks[4].key + '`.',
        view: { kind: 'template', template: BOX + '\nThe estimator is ...' }, blank: { mode: 'tokens', ...ks[4] },
      }),
      typed({
        prompt: 'After the statement, open the proof, with the heading "' + P.proofTitle + '" instead of the default "Proof".', lecture: 3,
        explanation: 'amsthm provides `proof`; its optional argument replaces the heading, and the end of the proof gets a box. Answer: `' + ks[5].key + '`.',
        view: { kind: 'template', template: '\\end{' + P.env + '}\n' + BOX }, blank: { mode: 'tokens', ...ks[5] },
      }),
    ],
  }
}

export const genLec3: LQGenerator = { id: 'latex-lq-3', generate: (rng) => build(sample(rng)) }
