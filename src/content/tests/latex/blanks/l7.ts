// Short typed questions for lecture 7 (Cross-references and macros): tokens mode for definitions and references, render
// mode (with the question's macros) for uses of a macro, exact mode for what an unresolved reference prints.
import { BOX } from '../../../shared/typed'
import type { BlankQuestion } from '../../../../lib/types'

export const blanksLec7: BlankQuestion[] = [
  {
    id: 'latex-7-01', lecture: 7, kind: 'template',
    prompt: 'Join the word and the number so that a line break can never fall between them.',
    template: 'see Figure' + BOX + '\\ref{fig:roc}',
    blank: {
      mode: 'tokens', key: '~',
      traps: [{ text: '\\space', misconception: '\\space is an ordinary space, where a line can still break' }],
    },
    explanation: 'The tie `~` is a space that never breaks: `Figure~\\ref{fig:roc}`.',
  },
  {
    id: 'latex-7-02', lecture: 7, kind: 'template',
    prompt: 'Print the page on which the labelled table appears.',
    template: 'the table on page ' + BOX + '{tab:main}',
    blank: {
      mode: 'tokens', key: '\\pageref',
      traps: [{ text: '\\ref', misconception: '\\ref prints the table number, not its page' }],
    },
    explanation: '`\\pageref{label}` prints the page of the label; `\\ref{label}` its number.',
  },
  {
    id: 'latex-7-03', lecture: 7, kind: 'template',
    prompt: 'Define `\\Var` as an operator name, set upright with the spacing of `\\log` or `\\sin`.',
    template: BOX + '{\\Var}{Var}',
    blank: {
      mode: 'tokens', key: '\\DeclareMathOperator',
      traps: [{ text: '\\newcommand', misconception: 'a plain macro would print the letters but not give them the spacing of an operator' }],
    },
    explanation: 'amsmath\'s `\\DeclareMathOperator{\\Var}{Var}` makes a proper operator, like `\\log`.',
  },
  {
    id: 'latex-7-04', lecture: 7, kind: 'template',
    prompt: 'Change the existing command `\\vec` so that it prints its argument in bold.',
    template: BOX + '{\\vec}[1]{\\mathbf{#1}}',
    blank: {
      mode: 'tokens', key: '\\renewcommand',
      traps: [{ text: '\\newcommand', misconception: '\\newcommand refuses to redefine a command that already exists' }],
    },
    explanation: '`\\renewcommand` replaces the definition of an existing command.',
  },
  {
    id: 'latex-7-05', lecture: 7, kind: 'template',
    prompt: 'This macro uses two arguments. Give the number to declare.',
    template: '\\newcommand{\\inner}[' + BOX + ']{\\langle #1, #2 \\rangle}',
    blank: {
      mode: 'tokens', key: '2',
      traps: [{ text: '1', misconception: 'the body uses #1 and #2, so the macro needs two arguments' }],
    },
    explanation: 'The number in brackets is how many arguments the body uses, at most 9.',
  },
  {
    id: 'latex-7-06', lecture: 7, kind: 'picture',
    prompt: 'The paper defines `\\E` as a blackboard-bold E. Using it, type the code for this formula.',
    picture: '\\E[X] = \\mu',
    blank: {
      mode: 'render', key: '\\E[X] = \\mu', macros: { '\\E': '\\mathbb{E}' },
      traps: [{ text: 'E[X] = \\mu', misconception: 'without the backslash, E is an italic variable, not the macro' }],
    },
    explanation: 'Writing the notation through its macro keeps it consistent across the paper.',
  },
  {
    id: 'latex-7-07', lecture: 7, kind: 'picture',
    prompt: 'The paper defines `\\abs{...}` as the absolute value. Using it, type the code for this formula.',
    picture: '\\abs{x - y} < \\varepsilon',
    blank: {
      mode: 'render', key: '\\abs{x - y} < \\varepsilon', macros: { '\\abs': '\\lvert #1 \\rvert' },
      traps: [
        { text: '|x - y| < \\varepsilon', misconception: 'typed bars are ordinary symbols; the macro gives the delimiters with their spacing' },
        { text: '\\abs{x - y} < \\epsilon', misconception: 'the picture shows the curly epsilon, \\varepsilon' },
      ],
    },
    explanation: 'The argument goes in braces after the macro name.',
  },
  {
    id: 'latex-7-08', lecture: 7, kind: 'template',
    prompt: 'Label this section with the paper\'s convention: the prefix sec: and the short name data.',
    template: '\\section{Data and Methods}\n' + BOX,
    blank: {
      mode: 'tokens', key: '\\label{sec:data}',
      traps: [{ text: '\\label{data}', misconception: 'the convention puts a prefix that says what is labelled' }],
    },
    explanation: 'A label right after `\\section{...}` records the section number.',
  },
  {
    id: 'latex-7-09', lecture: 7, kind: 'name',
    prompt: 'After the first compile, what does LaTeX print in place of a `\\ref` whose label it has not seen yet?',
    blank: {
      mode: 'exact', key: '??',
      traps: [
        { text: '0', misconception: 'LaTeX prints question marks, not a zero, until the next run reads the label' },
        { text: '?', misconception: 'it prints two question marks' },
      ],
    },
    explanation: 'Labels are written to the `.aux` file and read on the next run; until then a reference prints `??`.',
  },
  {
    id: 'latex-7-10', lecture: 7, kind: 'template',
    prompt: 'With cleveref, refer to the figure at the start of a sentence, so the word is capitalised.',
    template: BOX + '{fig:roc} shows the curves.',
    blank: {
      mode: 'tokens', key: '\\Cref',
      traps: [{ text: '\\cref', misconception: '\\cref may print the word in lower case or abbreviated; at a sentence start use \\Cref' }],
    },
    explanation: '`\\Cref` prints the capitalised, unabbreviated name: "Figure 3".',
  },
  {
    id: 'latex-7-11', lecture: 7, kind: 'name',
    prompt: 'Which package provides `\\cref` and `\\Cref`?',
    template: '\\usepackage{' + BOX + '}',
    blank: {
      mode: 'tokens', key: 'cleveref',
      traps: [{ text: 'hyperref', misconception: 'hyperref makes references clickable and has \\autoref, but \\cref comes from cleveref' }],
    },
    explanation: '`cleveref` is loaded after `hyperref` when both are used.',
  },
]
