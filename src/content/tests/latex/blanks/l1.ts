// Short typed questions for lecture 1 (Document structure). No sections (lessons.test checks unseen-first strictly on
// lecture 1). tokens mode, set mode where options may come in any order.
import { BOX } from '../../../shared/typed'
import type { BlankQuestion } from '../../../../lib/types'

export const blanksLec1: BlankQuestion[] = [
  {
    id: 'latex-1-01', lecture: 1, kind: 'template',
    prompt: 'Type the line that ends the preamble and starts the text of the document.',
    template: '\\usepackage{amsmath}\n' + BOX + '\n\\maketitle',
    blank: {
      mode: 'tokens', key: '\\begin{document}',
      traps: [
        { text: '\\begin{body}', misconception: 'the body is the document environment' },
        { text: '\\start{document}', misconception: 'environments are opened with \\begin{...}' },
      ],
    },
    explanation: 'Everything before `\\begin{document}` is the preamble; the text goes between it and `\\end{document}`.',
  },
  {
    id: 'latex-1-02', lecture: 1, kind: 'template',
    prompt: 'A thesis is divided into chapters, then sections. Which standard class fits it?',
    template: '\\documentclass{' + BOX + '}',
    blank: {
      mode: 'tokens', key: 'report', accept: ['book'],
      traps: [
        { text: 'article', misconception: 'article has no \\chapter command' },
        { text: 'chapter', misconception: 'chapter is a sectioning command, not a class' },
      ],
    },
    explanation: '`report` (or `book`) provides `\\chapter`; `article` starts at `\\section`.',
  },
  {
    id: 'latex-1-03', lecture: 1, kind: 'template',
    prompt: 'The title, authors and date are set in the preamble. Print the title block at the start of the text.',
    template: '\\begin{document}\n' + BOX,
    blank: {
      mode: 'tokens', key: '\\maketitle',
      traps: [
        { text: '\\title', misconception: '\\title only stores the title; \\maketitle prints the block' },
        { text: '\\printtitle', misconception: 'there is no such command in the standard classes' },
      ],
    },
    explanation: '`\\maketitle` typesets what `\\title`, `\\author` and `\\date` stored.',
  },
  {
    id: 'latex-1-04', lecture: 1, kind: 'template',
    prompt: 'Start the section "Acknowledgements" without a number.',
    template: BOX + '{Acknowledgements}',
    blank: {
      mode: 'tokens', key: '\\section*',
      traps: [
        { text: '\\section', misconception: 'without the star the section is numbered' },
        { text: '\\section[*]', misconception: 'the square brackets give a short title, not "unnumbered"' },
      ],
    },
    explanation: 'The starred form `\\section*` has no number and does not go into the table of contents.',
  },
  {
    id: 'latex-1-05', lecture: 1, kind: 'fix',
    prompt: 'This line stops the compile with "Runaway argument". Type the corrected line.',
    broken: '\\usepackage{amsmath,graphicx',
    blank: {
      mode: 'set', key: '\\usepackage{amsmath,graphicx}',
      accept: ['\\usepackage{amsmath}\n\\usepackage{graphicx}'],
      traps: [{ text: '\\usepackage{amsmath graphicx}', misconception: 'package names in one list are separated by commas' }],
    },
    explanation: 'The closing brace was missing, so LaTeX read the following lines as part of the argument.',
  },
  {
    id: 'latex-1-06', lecture: 1, kind: 'template',
    prompt: 'Make the sentence print a percent sign.',
    template: 'Half of the sample, 50' + BOX + ', was used for training.',
    blank: {
      mode: 'tokens', key: '\\%',
      traps: [
        { text: '%', misconception: 'a bare % starts a comment and hides the rest of the line' },
        { text: '\\percent', misconception: 'there is no \\percent command in plain LaTeX; escape the sign' },
      ],
    },
    explanation: 'The percent sign is the comment character, so it is printed with `\\%`.',
  },
  {
    id: 'latex-1-07', lecture: 1, kind: 'name',
    prompt: 'Which command prints a table of contents built from the numbered headings?',
    blank: {
      mode: 'tokens', key: '\\tableofcontents',
      traps: [
        { text: '\\toc', misconception: 'there is no \\toc command in the standard classes' },
        { text: '\\contents', misconception: 'the command is \\tableofcontents' },
      ],
    },
    explanation: '`\\tableofcontents` reads the `.toc` file written by the previous run, so it is complete after the second compile.',
  },
  {
    id: 'latex-1-08', lecture: 1, kind: 'template',
    prompt: 'End the first paragraph so that the second sentence starts a new paragraph (with indentation), using a command.',
    template: 'The first paragraph ends here.' + BOX + 'A new paragraph starts here.',
    blank: {
      mode: 'tokens', key: '\\par',
      traps: [
        { text: '\\\\', misconception: '\\\\ breaks the line but stays in the same paragraph, with no indentation' },
        { text: '\\newline', misconception: '\\newline breaks the line inside the same paragraph' },
      ],
    },
    explanation: 'A paragraph ends with a blank line in the source or with `\\par`. `\\\\` and `\\newline` only break the line.',
  },
  {
    id: 'latex-1-09', lecture: 1, kind: 'template',
    prompt: 'Set the whole document in two columns at 11 points, as class options.',
    template: '\\documentclass[' + BOX + ']{article}',
    blank: {
      mode: 'set', key: 'twocolumn,11pt', context: '\\documentclass[' + BOX + ']{article}',
      traps: [
        { text: '2column,11pt', misconception: 'the option is spelled twocolumn' },
        { text: 'twocolumn,11', misconception: 'font size options include the unit: 11pt' },
      ],
    },
    explanation: 'Class options are a comma-separated list in square brackets; their order does not matter.',
  },
  {
    id: 'latex-1-10', lecture: 1, kind: 'template',
    prompt: 'Start a numbered heading one level below a section.',
    template: BOX + '{Robustness checks}',
    blank: {
      mode: 'tokens', key: '\\subsection',
      traps: [
        { text: '\\subsection*', misconception: 'the star removes the number' },
        { text: '\\section', misconception: '\\section is the level above' },
      ],
    },
    explanation: 'The levels go `\\section`, `\\subsection`, `\\subsubsection`, then `\\paragraph`.',
  },
  {
    id: 'latex-1-11', lecture: 1, kind: 'template',
    prompt: 'Make the date in the title block the day of compilation, written by LaTeX.',
    template: '\\date{' + BOX + '}',
    blank: {
      mode: 'tokens', key: '\\today',
      traps: [
        { text: 'today', misconception: 'without the backslash the word "today" is printed' },
        { text: '\\now', misconception: 'the command is \\today' },
      ],
    },
    explanation: '`\\today` prints the date of the run. `\\date{}` (empty) prints no date at all.',
  },
]
