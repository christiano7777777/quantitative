// Short typed questions for lecture 6 (Citations): tokens/set mode for bib entries and commands, exact mode for keys and
// program names.
import { BOX } from '../../../shared/typed'
import type { BlankQuestion } from '../../../../lib/types'

export const blanksLec6: BlankQuestion[] = [
  {
    id: 'latex-6-01', lecture: 6, kind: 'template',
    prompt: 'Your bib keys are the first author\'s surname in lower case followed by the four-digit year. Cite the 1988 book by Jean Tirole.',
    template: '\\cite{' + BOX + '}',
    blank: {
      mode: 'exact', key: 'tirole1988',
      traps: [
        { text: 'Tirole1988', misconception: 'the convention writes the surname in lower case, and keys must match exactly' },
        { text: 'tirole88', misconception: 'the convention uses the four-digit year' },
      ],
    },
    explanation: 'A citation uses the key of the entry exactly as written in the bib file; a convention lets you type it without looking.',
  },
  {
    id: 'latex-6-02', lecture: 6, kind: 'template',
    prompt: 'Separate the two authors in this bib field.',
    template: 'author = {Smith, Jo ' + BOX + ' Ng, Li},',
    blank: {
      mode: 'tokens', key: 'and',
      traps: [
        { text: ',', misconception: 'a comma separates surname and given name, so BibTeX would read one author with too many parts' },
        { text: '&', misconception: 'authors are joined by the word and; & is a special character' },
      ],
    },
    explanation: 'Authors in a bib field are always separated by `and`, whatever the citation style prints.',
  },
  {
    id: 'latex-6-03', lecture: 6, kind: 'template',
    prompt: 'With natbib, print the whole citation in brackets: (Lee and Kim, 2021).',
    template: 'Momentum is weaker in small markets ' + BOX + '{lee2021}.',
    blank: {
      mode: 'tokens', key: '\\citep',
      traps: [{ text: '\\citet', misconception: '\\citet writes the names into the sentence: Lee and Kim (2021)' }],
    },
    explanation: '`\\citep` is parenthetical, `\\citet` is textual.',
  },
  {
    id: 'latex-6-04', lecture: 6, kind: 'template',
    prompt: 'Cite page 12 of the work.',
    template: '\\citep' + BOX + '{lee2021}',
    blank: {
      mode: 'tokens', key: '[p.~12]', accept: ['[p. 12]', '[p.\\ 12]'],
      traps: [{ text: '{p.~12}', misconception: 'the page note is an optional argument, in square brackets' }],
    },
    explanation: 'An optional argument before the key adds a note after the citation: (Lee and Kim, 2021, p. 12).',
  },
  {
    id: 'latex-6-05', lecture: 6, kind: 'template',
    prompt: 'With BibTeX, number the references in the order they are first cited.',
    template: '\\bibliographystyle{' + BOX + '}',
    blank: {
      mode: 'tokens', key: 'unsrt',
      traps: [{ text: 'plain', misconception: 'plain numbers the references in alphabetical order of authors' }],
    },
    explanation: '`unsrt` keeps the order of first citation; `plain` sorts by author.',
  },
  {
    id: 'latex-6-06', lecture: 6, kind: 'template',
    prompt: 'With biblatex, load the bibliography data stored in the BibTeX file named refs.',
    template: '\\addbibresource{' + BOX + '}',
    blank: {
      mode: 'tokens', key: 'refs.bib',
      traps: [{ text: 'refs', misconception: 'biblatex needs the full file name, with the .bib extension' }],
    },
    explanation: '`\\addbibresource` takes the file name with its extension.',
  },
  {
    id: 'latex-6-07', lecture: 6, kind: 'template',
    prompt: 'Load biblatex with author-year citations.',
    template: '\\usepackage[' + BOX + ']{biblatex}',
    blank: {
      mode: 'set', key: 'style=authoryear', context: '\\usepackage[' + BOX + ']{biblatex}',
      traps: [{ text: 'style=plainnat', misconception: 'plainnat is a BibTeX style; biblatex\'s author-year style is authoryear' }],
    },
    explanation: 'With biblatex the style is a package option, for example `style=authoryear` or `style=numeric`.',
  },
  {
    id: 'latex-6-08', lecture: 6, kind: 'template',
    prompt: 'Start the BibTeX entry of a PhD dissertation.',
    template: '@' + BOX + '{wong2020,',
    blank: {
      mode: 'tokens', key: 'phdthesis',
      traps: [{ text: 'thesis', misconception: '@thesis is a biblatex type; the standard BibTeX styles know @phdthesis and @mastersthesis' }],
    },
    explanation: 'The standard BibTeX entry type for a dissertation is `@phdthesis`.',
  },
  {
    id: 'latex-6-09', lecture: 6, kind: 'template',
    prompt: 'Start the entry of one paper published in conference proceedings.',
    template: '@' + BOX + '{kim2022,',
    blank: {
      mode: 'tokens', key: 'inproceedings',
      traps: [{ text: 'proceedings', misconception: '@proceedings is the whole volume; one paper in it is @inproceedings' }],
    },
    explanation: 'One paper in a volume is `@inproceedings`, with a `booktitle` field for the volume.',
  },
  {
    id: 'latex-6-10', lecture: 6, kind: 'template',
    prompt: 'Keep the capitals of the acronym GARCH in every bibliography style.',
    template: 'title = {Pricing with ' + BOX + ' models},',
    blank: {
      mode: 'tokens', key: '{GARCH}',
      traps: [{ text: 'GARCH', misconception: 'some styles lower-case titles; braces protect the letters' }],
    },
    explanation: 'Many styles change the case of titles; braces around a word keep it as typed.',
  },
  {
    id: 'latex-6-11', lecture: 6, kind: 'name',
    prompt: 'With BibTeX, which program runs between the first and second LaTeX runs to build the reference list?',
    blank: {
      mode: 'exact', key: 'bibtex',
      traps: [{ text: 'biber', misconception: 'biber is the backend of biblatex, not of BibTeX' }],
    },
    explanation: 'The cycle is latex, `bibtex`, latex, latex (latexmk runs it for you, lecture 10).',
  },
  {
    id: 'latex-6-12', lecture: 6, kind: 'template',
    prompt: 'List every entry of the bib file in the bibliography, cited or not.',
    template: '\\nocite{' + BOX + '}',
    blank: {
      mode: 'tokens', key: '*',
      traps: [{ text: 'all', misconception: 'the wildcard is * ; "all" would look for an entry with that key' }],
    },
    explanation: '`\\nocite{*}` adds every entry without citing it in the text.',
  },
]
