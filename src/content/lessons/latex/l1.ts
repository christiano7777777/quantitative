// Lesson for lecture 1 (Document structure). Verbatim format. Order of the long question: class line, packages, title,
// authors, headings, special characters.
import type { Lesson } from '../../../lib/types'

export const lessonLec1: Lesson = {
  verbatim: true,
  teach: [
    'You are starting the source file of a report. A LaTeX file is plain text that a program (pdflatex, xelatex or lualatex) turns into a PDF. It has two parts. The preamble, from the first line up to `\\begin{document}`, sets things up: the class, the packages, the title and the authors. The body, between `\\begin{document}` and `\\end{document}`, is the text itself.',
    '```latex\n\\documentclass[11pt,a4paper]{article}\n\\usepackage{amsmath,graphicx}\n\\title{Liquidity and Momentum}\n\\author{Ann Lee \\and Bo Chen}\n\\date{\\today}\n\\begin{document}\n\\maketitle\n\\section{Introduction}\nMomentum is ...\n\\end{document}\n```',
    '## The class line',
    'The first line names the class, which fixes the overall layout and the commands you get. `article` is for papers and short reports, and its largest heading is `\\section`. `report` and `book` add `\\chapter` for longer documents, and `beamer` is for slides (lecture 9). Options go in square brackets before the class name, separated by commas, in any order: a font size (`10pt`, `11pt` or `12pt`), a paper size (`a4paper` or `letterpaper`), and layout switches such as `twocolumn`. Note the exact spellings: `a4paper`, not `a4`, and `11pt` with its unit.',
    '## Packages',
    'Packages add features. `\\usepackage{amsmath}` loads one, and `\\usepackage{amsmath,graphicx}` loads several, separated by commas. Names are written without the `.sty` extension, and options for a package go in square brackets before its name, as for the class. Packages are loaded in the preamble only. A few must be loaded in a certain order (hyperref near the end, for example), so keep one package per line once a document grows.',
    '## Title, authors, date',
    'In the preamble, `\\title{...}`, `\\author{...}` and `\\date{...}` only store information. Nothing is printed until `\\maketitle` appears in the body. Several authors go in one `\\author`, separated by `\\and`, which sets them side by side; a second `\\author` command would simply replace the first. `\\date{\\today}` prints the day of compilation, and `\\date{}` prints no date at all.',
    '## Headings',
    'In `article` the heading levels are `\\section`, `\\subsection`, `\\subsubsection`, then the run-in `\\paragraph`. Each takes the heading text in braces, and LaTeX numbers it for you. A star, as in `\\section*{Acknowledgements}`, gives an unnumbered heading that is also left out of the table of contents. `\\tableofcontents` prints the contents from a file written by the previous compile, which is why a new heading only appears there after the second run.',
    '## Special characters and paragraphs',
    'Ten characters have special meanings. Five of them appear in ordinary text all the time and are printed with a backslash in front: `\\&` (the column separator in tables), `\\%` (the comment character), `\\$` (maths), `\\#` (macro parameters) and `\\_` (subscripts). A bare `%` is the worst of them, because it silently hides the rest of the line. Spaces are flexible: several spaces count as one, and a single line break counts as a space. A blank line, or `\\par`, ends a paragraph, while `\\\\` only breaks the line inside the same paragraph.',
    '## How to work the whole problem',
    'Choose the class from the kind of document: chapters mean `report`, otherwise `article`. Turn each stated setting into its class option and put them in brackets before the class name. List the packages in one `\\usepackage` with commas. Store the title and the authors in the preamble, with `\\and` between authors. In the body, pick the heading level and decide on the star from "numbered" or "unnumbered". Finally, read each sentence for `& % $ # _` and put a backslash in front of each one.',
    '## Typical mistakes',
    'Putting the options after the class name, or misspelling them (`a4` for `a4paper`, `11` for `11pt`). Loading a class with `\\usepackage`. Separating packages with spaces, or adding `.sty`. Forgetting the braces of `\\title`, so that only one letter becomes the title. Writing "and" instead of `\\and`, or using two `\\author` commands. Using `\\chapter` in an article. Leaving a `%`, `&` or `_` unescaped in the text. Using `\\\\` to start a new paragraph.',
  ],
  samples: [{ workedSeed: 'latex-1-worked', lqId: 'latex-lq-1' }],
}
