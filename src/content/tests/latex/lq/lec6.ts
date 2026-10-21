// LQ for lecture 6 (Citations). One story: the references of a paper. Six parts in the order of the lesson: a citation
// key by the paper's convention (exact mode), a bib entry (set mode: fields in any order), a textual or parenthetical
// citation and a double citation (tokens mode), then the two bibliography commands of BibTeX or biblatex (tokens mode).
// Lecture 6.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance, Trap } from '../../../../lib/types'
import { BOX, typed } from '../../../shared/typed'

export interface Person { given: string; family: string }
export interface Params {
  other: [Person, Person] // authors of the paper whose key is asked (part 1)
  otherYear: number
  authors: [Person, Person] // authors of the main entry
  year: number
  title: string
  journal: string
  textual: boolean // "Lee and Kim (2021) show" vs "(Lee and Kim, 2021)"
  system: 'bibtex' | 'biblatex'
  file: string // bib file name without extension
}

const PEOPLE: Person[] = [
  { given: 'Ann', family: 'Lee' }, { given: 'Bo', family: 'Kim' }, { given: 'Carla', family: 'Diaz' }, { given: 'Dev', family: 'Patel' },
  { given: 'Eva', family: 'Novak' }, { given: 'Femi', family: 'Okoro' }, { given: 'Gus', family: 'Hansen' }, { given: 'Hana', family: 'Sato' },
]
const TITLES = ['Momentum in Small Markets', 'Learning the Volatility Surface', 'Default Risk and Bank Size', 'Liquidity Shocks and Prices']
const JOURNALS = ['Journal of Finance', 'Review of Financial Studies', 'Journal of Econometrics', 'Quantitative Finance']
const FILES = ['refs', 'library', 'references']

export const citeKey = (p: Person, year: number) => p.family.toLowerCase() + year

export function sample(rng: Rng): Params {
  for (;;) {
    const [a, b, c, d] = rng.sample(PEOPLE, 4)
    const P: Params = {
      other: [c, d], otherYear: rng.pick([2015, 2017, 2019, 2020, 2022]), authors: [a, b], year: rng.pick([2018, 2021, 2023, 2024]),
      title: rng.pick(TITLES), journal: rng.pick(JOURNALS), textual: rng.pick([true, false]),
      system: rng.pick(['bibtex', 'biblatex'] as const), file: rng.pick(FILES),
    }
    if (citeKey(P.other[0], P.otherYear) === citeKey(P.authors[0], P.year)) continue
    return P
  }
}

export interface PartKey { key: string; accept?: string[]; traps: Trap[] }

const full = (p: Person) => p.given + ' ' + p.family
const inverted = (p: Person) => p.family + ', ' + p.given

export function keys(P: Params): PartKey[] {
  const k = citeKey(P.authors[0], P.year)
  const k2 = citeKey(P.other[0], P.otherYear)
  const entry = (authors: string) =>
    '@article{' + k + ',\n  author = {' + authors + '},\n  title = {' + P.title + '},\n  journal = {' + P.journal + '},\n  year = {' + P.year + '}\n}'
  const cmd = P.textual ? '\\citet' : '\\citep'
  const biblatex = P.system === 'biblatex'
  return [
    {
      key: k2,
      traps: [
        { text: P.other[0].family + P.otherYear, misconception: 'the convention writes the surname in lower case' },
        { text: citeKey(P.other[1], P.otherYear), misconception: 'the key uses the first author' },
        { text: P.other[0].family.toLowerCase() + String(P.otherYear).slice(2), misconception: 'the convention uses the full four-digit year' },
      ],
    },
    {
      key: entry(inverted(P.authors[0]) + ' and ' + inverted(P.authors[1])),
      accept: [entry(full(P.authors[0]) + ' and ' + full(P.authors[1]))],
      traps: [
        { text: entry(inverted(P.authors[0]) + ', ' + inverted(P.authors[1])), misconception: 'authors are separated by the word and; a comma separates surname from given name' },
        { text: '@article{author = {' + inverted(P.authors[0]) + ' and ' + inverted(P.authors[1]) + '}, title = {' + P.title + '}, journal = {' + P.journal + '}, year = {' + P.year + '}}', misconception: 'the citation key comes first, right after the opening brace' },
      ],
    },
    {
      key: cmd + '{' + k + '}',
      traps: [
        { text: (P.textual ? '\\citep' : '\\citet') + '{' + k + '}', misconception: P.textual ? '\\citep puts the whole citation in brackets' : '\\citet writes the names into the sentence' },
        { text: cmd + '{' + P.authors[0].family + P.year + '}', misconception: 'cite with the key exactly as in the bib file' },
      ],
    },
    {
      key: '\\citep{' + k + ',' + k2 + '}',
      traps: [
        { text: '\\citep{' + k + '}\\citep{' + k2 + '}', misconception: 'one command takes several keys separated by commas, giving one pair of brackets' },
        { text: '\\citep{' + k + ' ' + k2 + '}', misconception: 'keys are separated by commas' },
      ],
    },
    biblatex
      ? {
        key: '\\addbibresource{' + P.file + '.bib}',
        traps: [
          { text: '\\addbibresource{' + P.file + '}', misconception: '\\addbibresource needs the full file name, with .bib' },
          { text: '\\bibliography{' + P.file + '}', misconception: '\\bibliography belongs to BibTeX; biblatex loads data with \\addbibresource' },
        ],
      }
      : {
        key: '\\bibliography{' + P.file + '}',
        traps: [
          { text: '\\addbibresource{' + P.file + '.bib}', misconception: '\\addbibresource belongs to biblatex' },
          { text: '\\input{' + P.file + '.bib}', misconception: 'a .bib file is read by BibTeX, not typeset with \\input' },
        ],
      },
    biblatex
      ? {
        key: '\\printbibliography',
        traps: [{ text: '\\bibliographystyle{plainnat}', misconception: 'with biblatex the style is a package option, and the list is printed by \\printbibliography' }],
      }
      : {
        key: '\\bibliographystyle{plainnat}',
        traps: [
          { text: '\\printbibliography', misconception: '\\printbibliography belongs to biblatex' },
          { text: '\\bibliographystyle{plain}', misconception: 'plain is numeric and does not work with \\citet; natbib author-year citations need plainnat' },
        ],
      },
  ]
}

export function build(P: Params): LQInstance {
  const ks = keys(P)
  const k = citeKey(P.authors[0], P.year)
  const biblatex = P.system === 'biblatex'
  return {
    intro: 'You are adding references to a paper. Citation keys follow one convention: the first author\'s surname in lower case followed by the four-digit year. ' +
      'Citations are written with natbib\'s author-year commands `\\citet` and `\\citep`' +
      (biblatex ? ' (biblatex provides them with its natbib option), and the references are processed by biblatex' : ', and the references are processed by BibTeX') +
      '. The bibliography data is in the file `' + P.file + '.bib`. Type only what goes in each box.',
    parts: [
      typed({
        prompt: 'Give the citation key of the paper by ' + full(P.other[0]) + ' and ' + full(P.other[1]) + ' published in ' + P.otherYear + '.', lecture: 6,
        explanation: 'First author\'s surname in lower case, then the year. Answer: `' + ks[0].key + '`.',
        view: { kind: 'template', template: '\\cite{' + BOX + '}' }, blank: { mode: 'exact', ...ks[0] },
      }),
      typed({
        prompt: 'Write the bib entry, with key `' + k + '`, for the journal article "' + P.title + '" by ' + full(P.authors[0]) + ' and ' + full(P.authors[1]) +
          ', in ' + P.journal + ', ' + P.year + '. Give the fields author, title, journal and year.', lecture: 6,
        explanation: 'An entry is `@type{key, field = {value}, ...}`; authors are joined by `and`, each written "Surname, Given" (or "Given Surname"). Fields can come in any order. Answer: `' + ks[1].key.replace(/\n\s*/g, ' ') + '`.',
        view: { kind: 'template', template: BOX }, blank: { mode: 'set', ...ks[1] },
      }),
      typed({
        prompt: 'Cite this article in the sentence ' + (P.textual
          ? '"' + P.authors[0].family + ' and ' + P.authors[1].family + ' (' + P.year + ') show that ...", where the names are part of the sentence.'
          : '"Momentum is weaker in small markets (' + P.authors[0].family + ' and ' + P.authors[1].family + ', ' + P.year + ').", where the whole citation is in brackets.'), lecture: 6,
        explanation: 'natbib: `\\citet` for a textual citation, `\\citep` for a parenthetical one. Answer: `' + ks[2].key + '`.',
        view: { kind: 'template', template: P.textual ? BOX + ' show that ...' : 'Momentum is weaker in small markets ' + BOX + '.' }, blank: { mode: 'tokens', ...ks[2] },
      }),
      typed({
        prompt: 'Cite this article together with the ' + P.otherYear + ' paper by ' + full(P.other[0]) + ' and ' + full(P.other[1]) + ', in one pair of brackets, this article first.', lecture: 6,
        explanation: 'One `\\citep` with both keys, separated by a comma. Answer: `' + ks[3].key + '`.',
        view: { kind: 'template', template: 'as found before ' + BOX + '.' }, blank: { mode: 'tokens', ...ks[3] },
      }),
      typed({
        prompt: biblatex
          ? 'With biblatex, load the bibliography data in the preamble.'
          : 'With BibTeX, name the bibliography file where the list of references should appear.', lecture: 6,
        explanation: biblatex
          ? '`\\addbibresource{file.bib}` in the preamble, with the extension. Answer: `' + ks[4].key + '`.'
          : '`\\bibliography{file}` without the extension, where the list should be printed. Answer: `' + ks[4].key + '`.',
        view: { kind: 'template', template: biblatex ? '\\usepackage[style=authoryear]{biblatex}\n' + BOX : BOX + '\n\\end{document}' }, blank: { mode: 'tokens', ...ks[4] },
      }),
      typed({
        prompt: biblatex
          ? 'With biblatex, print the list of references at the end.'
          : 'With BibTeX, choose the author-year style that works with natbib, plainnat.', lecture: 6,
        explanation: biblatex
          ? '`\\printbibliography` prints the list; the style was chosen as a package option. Answer: `' + ks[5].key + '`.'
          : '`\\bibliographystyle{...}` chooses how BibTeX formats the list; `plainnat` gives author-year data for `\\citet` and `\\citep`. Answer: `' + ks[5].key + '`.',
        view: { kind: 'template', template: biblatex ? BOX + '\n\\end{document}' : BOX + '\n\\bibliography{...}' }, blank: { mode: 'tokens', ...ks[5] },
      }),
    ],
  }
}

export const genLec6: LQGenerator = { id: 'latex-lq-6', generate: (rng) => build(sample(rng)) }
