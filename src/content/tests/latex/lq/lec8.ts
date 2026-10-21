// LQ for lecture 8 (Paper structure). One story: assembling main.tex of a research paper from separate section files.
// Five parts in the order of the lesson: the abstract, a labelled section, the \input of its file, the roadmap reference
// in the introduction, the appendix. All tokens mode.
// Lecture 8.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance, Trap } from '../../../../lib/types'
import { BOX, typed } from '../../../shared/typed'

export interface Params {
  name: string // section heading
  slug: string // label and file name
  folder: string
  num: number // the number the section gets, for the prompt only
  topic: string
}

export const SECTIONS: [string, string][] = [
  ['Related Work', 'related'], ['Data', 'data'], ['Methodology', 'method'], ['Empirical Results', 'results'], ['Robustness Checks', 'robustness'],
]
const FOLDERS = ['sections', 'chapters', 'parts']
const TOPICS = ['intraday momentum', 'bank capital and lending', 'option-implied skew', 'household savings']

export function sample(rng: Rng): Params {
  const k = rng.pick([0, 1, 2, 3, 4])
  const [name, slug] = SECTIONS[k]
  return { name, slug, folder: rng.pick(FOLDERS), num: k + 2, topic: rng.pick(TOPICS) }
}

export interface PartKey { key: string; accept?: string[]; traps: Trap[] }

export function keys(P: Params): PartKey[] {
  const path = P.folder + '/' + P.slug
  return [
    {
      key: '\\begin{abstract}',
      traps: [
        { text: '\\abstract', misconception: 'the abstract is an environment, opened with \\begin{abstract}' },
        { text: '\\section*{Abstract}', misconception: 'a heading called Abstract does not give the abstract its own layout (narrower, smaller type)' },
      ],
    },
    {
      key: '\\section{' + P.name + '}\\label{sec:' + P.slug + '}',
      accept: ['\\section{' + P.name + '}\n\\label{sec:' + P.slug + '}'],
      traps: [
        { text: '\\label{sec:' + P.slug + '}\\section{' + P.name + '}', misconception: 'a label before the heading records the previous number; it goes after \\section' },
        { text: '\\section{' + P.name + '}\\label{' + P.slug + '}', misconception: 'the paper prefixes section labels with sec:' },
      ],
    },
    {
      key: '\\input{' + path + '}',
      accept: ['\\input{' + path + '.tex}'],
      traps: [
        { text: '\\include{' + path + '}', misconception: '\\include always starts a new page and cannot be used inside an \\include-d file; an article section is \\input' },
        { text: '\\input{' + P.slug + '}', misconception: 'the path is relative to main.tex, so it includes the folder' },
      ],
    },
    {
      key: 'Section~\\ref{sec:' + P.slug + '}',
      traps: [
        { text: 'Section \\ref{sec:' + P.slug + '}', misconception: 'a normal space can break the line between the word and the number; use the tie ~' },
        { text: 'Section~' + P.num, misconception: 'a typed number goes wrong as soon as sections move; refer to the label' },
      ],
    },
    {
      key: '\\appendix',
      traps: [
        { text: '\\section{Appendix}', misconception: 'a section called Appendix is just another numbered section; \\appendix switches the numbering to letters' },
        { text: '\\appendix{}', misconception: '\\appendix takes no argument; the appendix sections follow it as ordinary \\section commands' },
      ],
    },
  ]
}

export function build(P: Params): LQInstance {
  const ks = keys(P)
  return {
    intro: 'You are assembling `main.tex` of a paper on ' + P.topic + ' (class article). Each section lives in its own file in the folder `' + P.folder +
      '/`, named after its label without the prefix. Labels use the prefix `sec:` followed by a short name. Type only what goes in each box.',
    parts: [
      typed({
        prompt: 'Right after the title block, open the abstract.', lecture: 8,
        explanation: 'The standard classes provide an `abstract` environment, set narrower and smaller than the text. Answer: `' + ks[0].key + '`.',
        view: { kind: 'template', template: '\\maketitle\n' + BOX + '\n  We show that ...\n\\end{abstract}' }, blank: { mode: 'tokens', ...ks[0] },
      }),
      typed({
        prompt: 'In the file of the section "' + P.name + '", write its first line: the heading followed by its label, short name ' + P.slug + '.', lecture: 8,
        explanation: 'The label comes right after `\\section`, so it records that section\'s number. Answer: `' + ks[1].key + '`.',
        view: { kind: 'template', template: BOX + '\nWe ...' }, blank: { mode: 'tokens', ...ks[1] },
      }),
      typed({
        prompt: 'In main.tex, read in the file of the section "' + P.name + '" at this point of the text.', lecture: 8,
        explanation: '`\\input{folder/file}` reads the file as if it were typed there; the `.tex` extension may be left out. Answer: `' + ks[2].key + '`.',
        view: { kind: 'template', template: '\\input{' + P.folder + '/intro}\n' + BOX }, blank: { mode: 'tokens', ...ks[2] },
      }),
      typed({
        prompt: 'In the roadmap paragraph of the introduction, refer to the section "' + P.name + '" (it is currently Section ' + P.num + ') with \\ref, written so that the word and the number stay on one line.', lecture: 8,
        explanation: 'Refer to the label, never to a typed number, and tie the word to it with `~`. Answer: `' + ks[3].key + '`.',
        view: { kind: 'template', template: BOX + ' describes the ' + P.name.toLowerCase() + '.' }, blank: { mode: 'tokens', ...ks[3] },
      }),
      typed({
        prompt: 'After the conclusion, start the appendix, so that the sections that follow are lettered A, B, ...', lecture: 8,
        explanation: '`\\appendix` changes the numbering of the sections after it to letters; it prints nothing itself. Answer: `' + ks[4].key + '`.',
        view: { kind: 'template', template: '\\input{' + P.folder + '/conclusion}\n' + BOX + '\n\\section{Proofs}' }, blank: { mode: 'tokens', ...ks[4] },
      }),
    ],
  }
}

export const genLec8: LQGenerator = { id: 'latex-lq-8', generate: (rng) => build(sample(rng)) }
