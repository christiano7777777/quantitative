// Lesson for lecture 6 (Citations). Verbatim format. Order of the long question: citation keys, bib entries, citing in
// the text, the bibliography commands of BibTeX and biblatex.
import type { Lesson } from '../../../lib/types'

export const lessonLec6: Lesson = {
  verbatim: true,
  teach: [
    'You are adding references to a paper. In LaTeX you never type a reference list by hand. The data of every work lives once in a `.bib` file, each entry under a short key. In the text you cite by key, and a bibliography program builds the list in the journal\'s style and keeps the numbers and names in step. There are two systems: BibTeX (the classic one, with styles such as `plainnat`) and biblatex (a package with the backend biber, configured from LaTeX). Both read the same `.bib` files.',
    '## Entries and keys',
    'An entry starts with `@` and its type, then the key, then `field = {value}` pairs separated by commas:',
    '```bibtex\n@article{lee2021,\n  author  = {Lee, Ann and Kim, Bo},\n  title   = {Momentum in Small Markets},\n  journal = {Journal of Finance},\n  year    = {2021}\n}\n```',
    'The key is everything between the opening brace and the first comma. Choose one convention and keep to it, for example the first author\'s surname in lower case followed by the year, so that you can type keys without looking them up. Field names and the entry type are not case-sensitive, fields can come in any order, and a value can be in braces, in quotes, or bare if it is a number.',
    'Common types: `@article` (journal paper: author, title, journal, year), `@book`, `@inproceedings` (one paper in conference proceedings, with `booktitle`), `@phdthesis`, `@techreport` and `@misc`. Authors are always joined by `and`, each written "Surname, Given" or "Given Surname"; the style decides how they are printed. Some styles change the case of titles, so put braces around words that must keep their capitals: `{GARCH}`.',
    '## Citing',
    '`\\cite{lee2021}` cites with the style\'s default form. With author-year citations (natbib, or biblatex with its natbib option), use `\\citet{lee2021}` when the names are part of the sentence, as in "Lee and Kim (2021) show", and `\\citep{lee2021}` for a citation in brackets: "(Lee and Kim, 2021)". Several works go in one command, `\\citep{lee2021,diaz2019}`, which gives one pair of brackets. An optional argument adds a page: `\\citep[p.~12]{lee2021}`. `\\nocite{*}` lists every entry without citing it.',
    '## BibTeX',
    'Choose the style with `\\bibliographystyle{plainnat}` (author-year, for natbib), `plain` (numbered, sorted by author) or `unsrt` (numbered in order of citation). Then write `\\bibliography{refs}` where the list should appear. The file name goes without the `.bib` extension. The compile cycle is latex, `bibtex`, latex, latex. Until then, citations print as question marks.',
    '## biblatex',
    'Load the package with the style as an option, `\\usepackage[style=authoryear]{biblatex}`, and the data in the preamble with `\\addbibresource{refs.bib}`. Here the extension is required. Print the list with `\\printbibliography`. The program between the LaTeX runs is `biber`. Do not mix the two systems: `\\bibliography` and `\\bibliographystyle` belong to BibTeX, while `\\addbibresource` and `\\printbibliography` belong to biblatex.',
    '## How to work the whole problem',
    'Build each key from the convention. Write the entry with the key first, then one field per piece of information, with authors joined by `and`. In the text, decide whether the names belong to the sentence (`\\citet`) or to a bracket (`\\citep`), and put several keys in one command, in the order asked. Finally, check which system the paper uses and write that system\'s two commands: for BibTeX, the style and `\\bibliography{file}`; for biblatex, `\\addbibresource{file.bib}` and `\\printbibliography`.',
    '## Typical mistakes',
    'Separating authors with commas. Leaving out the key, or putting a field before it. Citing with a key that differs from the bib file (capital letters, two-digit year). Using `\\citet` and `\\citep` the wrong way round. Writing one `\\citep` per key. Adding `.bib` to `\\bibliography`, or leaving it out of `\\addbibresource`. Mixing BibTeX and biblatex commands. Forgetting braces around acronyms in titles.',
  ],
  samples: [{ workedSeed: 'latex-6-worked', lqId: 'latex-lq-6' }],
}
