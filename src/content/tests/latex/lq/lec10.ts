// LQ for lecture 10 (Collaboration). One story: a paper written by two authors in a git repository that is also
// synced with Overleaf. Six parts in the order of the lesson: the latexmk engine option, the \input of a co-author's
// section (tokens mode), a .gitignore pattern, the latexmk clean option, staging one file, and pushing or pulling (exact
// mode, single tokens).
// Lecture 10.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance, Trap } from '../../../../lib/types'
import { BOX, typed } from '../../../shared/typed'

export type Engine = 'pdflatex' | 'xelatex' | 'lualatex'
export interface Params {
  engine: Engine
  section: string // file name of the co-author's section, without extension
  ext: string // auxiliary file extension to ignore
  keepPdf: boolean // latexmk -c (keep the PDF) or -C (remove it too)
  edited: string // file the student edited, without extension
  direction: 'push' | 'pull'
}

export const ENGINE_FLAG: Record<Engine, string> = { pdflatex: '-pdf', xelatex: '-xelatex', lualatex: '-lualatex' }
const ENGINE_ALIASES: Record<Engine, string[]> = { pdflatex: ['--pdf'], xelatex: ['--xelatex', '-pdfxe', '--pdfxe'], lualatex: ['--lualatex', '-pdflua', '--pdflua'] }
const ENGINE_TEXT: Record<Engine, string> = {
  pdflatex: 'with pdflatex, to a PDF',
  xelatex: 'with XeLaTeX, because the paper uses system fonts through fontspec',
  lualatex: 'with LuaLaTeX, because the paper uses system fonts through fontspec and Lua code',
}
const SECTIONS = ['data', 'method', 'results', 'literature']
const EXTS = ['aux', 'log', 'bbl', 'blg', 'toc', 'out']

export function sample(rng: Rng): Params {
  for (;;) {
    const [section, edited] = rng.sample(SECTIONS, 2)
    const P: Params = {
      engine: rng.pick(['pdflatex', 'xelatex', 'lualatex'] as const), section, ext: rng.pick(EXTS),
      keepPdf: rng.pick([true, false]), edited, direction: rng.pick(['push', 'pull'] as const),
    }
    if (P.section === P.edited) continue
    return P
  }
}

export interface PartKey { key: string; accept?: string[]; traps: Trap[] }

export function keys(P: Params): PartKey[] {
  const flag = ENGINE_FLAG[P.engine]
  return [
    {
      key: flag, accept: ENGINE_ALIASES[P.engine],
      traps: [
        { text: flag.slice(1), misconception: 'latexmk options start with a hyphen; without it the word is taken as a file name' },
        P.engine === 'pdflatex'
          ? { text: '-dvi', misconception: '-dvi produces a DVI file, not a PDF' }
          : { text: '-pdf', misconception: '-pdf runs pdflatex, which cannot use system fonts through fontspec' },
      ],
    },
    {
      key: '\\input{sections/' + P.section + '}', accept: ['\\input{sections/' + P.section + '.tex}'],
      traps: [
        { text: '\\input{' + P.section + '}', misconception: 'the path is relative to main.tex, so it includes the folder' },
        { text: '\\include{sections/' + P.section + '}', misconception: '\\include starts a new page; a section of an article is read with \\input' },
      ],
    },
    {
      key: '*.' + P.ext,
      traps: [
        { text: '.' + P.ext, misconception: 'without * the pattern matches only a file literally named .' + P.ext },
        { text: P.ext, misconception: 'this matches only a file or folder named exactly ' + P.ext },
      ],
    },
    {
      key: P.keepPdf ? '-c' : '-C',
      traps: [{ text: P.keepPdf ? '-C' : '-c', misconception: P.keepPdf ? '-C also deletes the PDF' : '-c keeps the PDF; -C removes it too' }],
    },
    {
      key: 'sections/' + P.edited + '.tex',
      traps: [
        { text: '.', misconception: '. stages every change in the folder, not only this file' },
        { text: P.edited + '.tex', misconception: 'run from the repository root, the path includes the folder' },
      ],
    },
    P.direction === 'push'
      ? {
        key: 'push',
        traps: [
          { text: 'commit', misconception: 'commit records the change locally; push sends your commits to the shared repository' },
          { text: 'pull', misconception: 'pull brings the other side\'s commits in; push sends yours out' },
        ],
      }
      : {
        key: 'pull',
        traps: [
          { text: 'fetch', misconception: 'fetch downloads the commits but does not merge them into your files' },
          { text: 'push', misconception: 'push sends your commits out; pull brings the other side\'s in' },
        ],
      },
  ]
}

export function build(P: Params): LQInstance {
  const ks = keys(P)
  return {
    intro: 'You and a co-author write a paper in a git repository that is also synced with Overleaf. `main.tex` sits at the root and reads one file per section from the folder `sections/`. ' +
      'The paper is compiled ' + ENGINE_TEXT[P.engine] + ', with latexmk. Commands are run from the repository root. Type only what goes in each box.',
    parts: [
      typed({
        prompt: 'Compile the paper with latexmk using the right engine.', lecture: 10,
        explanation: 'latexmk runs the engine and BibTeX or biber as often as needed; `-pdf` chooses pdflatex, `-xelatex` and `-lualatex` the other engines. Answer: `' + ks[0].key + '`.',
        view: { kind: 'template', template: 'latexmk ' + BOX + ' main.tex' }, blank: { mode: 'exact', ...ks[0] },
      }),
      typed({
        prompt: 'In main.tex, read in your co-author\'s section, the file ' + P.section + '.tex in the sections folder.', lecture: 10,
        explanation: 'One file per section lets the two authors edit different files. Answer: `' + ks[1].key + '`.',
        view: { kind: 'template', template: '\\input{sections/intro}\n' + BOX }, blank: { mode: 'tokens', ...ks[1] },
      }),
      typed({
        prompt: 'Add a line to .gitignore so that no file ending in .' + P.ext + ' is ever committed.', lecture: 10,
        explanation: 'Auxiliary files are rebuilt by every compile and only cause conflicts; `*` matches any name. Answer: `' + ks[2].key + '`.',
        view: { kind: 'template', template: '# .gitignore\n' + BOX }, blank: { mode: 'exact', ...ks[2] },
      }),
      typed({
        prompt: 'Delete the auxiliary files of the build' + (P.keepPdf ? ' but keep the PDF.' : ', and the PDF as well.'), lecture: 10,
        explanation: '`latexmk -c` removes the auxiliary files; `-C` also removes the output. Answer: `' + ks[3].key + '`.',
        view: { kind: 'template', template: 'latexmk ' + BOX }, blank: { mode: 'exact', ...ks[3] },
      }),
      typed({
        prompt: 'You edited only the file ' + P.edited + '.tex in the sections folder. Stage that file, and nothing else, for the next commit.', lecture: 10,
        explanation: '`git add path` stages one file; the path is relative to where you run the command, here the root. Answer: `' + ks[4].key + '`.',
        view: { kind: 'template', template: 'git add ' + BOX }, blank: { mode: 'exact', ...ks[4] },
      }),
      typed({
        prompt: P.direction === 'push'
          ? 'You have committed your change. Send it to the shared repository so that your co-author sees it in Overleaf.'
          : 'Your co-author has edited the paper in Overleaf. Before you start, bring those changes into your copy.', lecture: 10,
        explanation: P.direction === 'push'
          ? '`git push` sends your commits to the remote. Answer: `push`.'
          : '`git pull` fetches the remote commits and merges them into your files. Answer: `pull`.',
        view: { kind: 'template', template: 'git ' + BOX }, blank: { mode: 'exact', ...ks[5] },
      }),
    ],
  }
}

export const genLec10: LQGenerator = { id: 'latex-lq-10', generate: (rng) => build(sample(rng)) }
