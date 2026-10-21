// Lesson for lecture 8 (Paper structure). Verbatim format. Order of the long question: abstract, labelled sections,
// one file per section, the roadmap paragraph, the appendix.
import type { Lesson } from '../../../lib/types'

export const lessonLec8: Lesson = {
  verbatim: true,
  teach: [
    'You are assembling the source of a research paper. A typical empirical paper has a fixed shape: title block, abstract, Introduction, Related Work, Data, Methodology, Results, Robustness, Conclusion, references, appendix. The writing is yours. This lecture is about the LaTeX that holds the shape together, so that sections can be written separately, moved, and referred to without anything breaking.',
    '```latex\n\\documentclass{article}\n% preamble ...\n\\begin{document}\n\\maketitle\n\\begin{abstract}\n  We show that ...\n\\end{abstract}\n\\input{sections/intro}\n\\input{sections/related}\n\\input{sections/data}\n\\input{sections/results}\n\\input{sections/conclusion}\n\\bibliography{refs}\n\\appendix\n\\input{sections/proofs}\n\\end{document}\n```',
    '## Title block and abstract',
    '`\\maketitle` prints what `\\title`, `\\author` and `\\date` stored (lecture 1). A footnote on an author or the title, for funding or affiliations, is made with `\\thanks{...}` inside `\\author` or `\\title`. The abstract is an environment, `\\begin{abstract} ... \\end{abstract}`, which the class sets narrower and in smaller type, with its own heading. A section called "Abstract" does not do that.',
    '## Sections and their labels',
    'Each part of the paper is a `\\section`, divided further with `\\subsection`, `\\subsubsection`, and the run-in `\\paragraph{...}` heading. Every section that the text refers to gets a label right after its heading: `\\section{Data}\\label{sec:data}`. A label placed before the heading records the previous section\'s number. Keep the label names short, stable and prefixed (`sec:data`), because other files will refer to them.',
    '## One file per section',
    '`\\input{sections/data}` reads the file `sections/data.tex` as if its text were typed at that point. The extension may be left out, and the path is relative to the main file. With one file per section, co-authors edit different files, version control shows readable changes, and moving a section is moving one line. `\\include{...}` is the variant for chapters of a long document: it always starts a new page, cannot be nested, and works with `\\includeonly{...}` in the preamble, which compiles only the listed chapters while keeping page and reference numbers.',
    '## The roadmap',
    'The introduction usually ends with a roadmap: "Section 2 reviews related work, Section 3 describes the data, ...". Never type those numbers. Write `Section~\\ref{sec:data}` (or `\\cref{sec:data}`, lecture 7), so that the numbers follow when sections move. The tie keeps the word and the number on one line.',
    '## Appendix',
    '`\\appendix` takes no argument and prints nothing; it switches the numbering of the following sections to letters (A, B, ...), and references to them print the letters. Put the appendix sections after it as ordinary `\\section` commands. To start the appendix on a fresh page with all waiting figures printed first, put `\\clearpage` before it. `\\newpage` ends the page but leaves waiting floats for later.',
    '## How to work the whole problem',
    'Work from the top of `main.tex` down: title block, then the abstract environment. Each section file starts with its heading and label, using the prefix convention. In `main.tex`, read in the section files with `\\input{folder/name}` in reading order. In the roadmap, refer to every section by its label with a tie. End with `\\appendix` before the appendix sections.',
    '## Typical mistakes',
    'Writing the abstract as a section. Putting a label before its heading, or without its prefix. Using `\\include` for the sections of an article, or forgetting the folder in the path. Typing section numbers in the roadmap. Writing a section called "Appendix" instead of using `\\appendix`, or giving `\\appendix` an argument. Using `\\footnote` in the title block.',
  ],
  samples: [{ workedSeed: 'latex-8-worked', lqId: 'latex-lq-8' }],
}
