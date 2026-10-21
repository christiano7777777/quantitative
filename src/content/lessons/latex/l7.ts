// Lesson for lecture 7 (Cross-references and macros). Verbatim format. Order of the long question: macros without and
// with arguments, using them, labels, \eqref, cleveref.
import type { Lesson } from '../../../lib/types'

export const lessonLec7: Lesson = {
  verbatim: true,
  teach: [
    'You are setting up the notation and the internal references of a paper. Two habits make a long document easy to change. Every symbol of your notation is a macro, so that changing the notation is one edit. Every number the text refers to (sections, equations, tables, figures) is a label, so that LaTeX keeps the numbers right however you reorder things.',
    '## Macros without arguments',
    '`\\newcommand{\\R}{\\mathbb{R}}` defines a new command `\\R` that expands to `\\mathbb{R}`. The name includes its backslash, and the body is what it stands for. Definitions go in the preamble. `\\newcommand` refuses a name that already exists, which protects you from overwriting something by accident; `\\renewcommand` is for deliberately replacing an existing command. Avoid one-letter names that LaTeX already uses (`\\P` is the paragraph sign, for example).',
    '## Macros with arguments',
    'Give the number of arguments in square brackets after the name, and refer to them in the body as `#1`, `#2`, and so on:',
    '```latex\n\\newcommand{\\norm}[1]{\\lVert #1 \\rVert}\n\\newcommand{\\inner}[2]{\\langle #1, #2 \\rangle}\n```',
    'Then `\\norm{x - y}` gives $\\lVert x - y \\rVert$ and `\\inner{u}{v}` gives $\\langle u, v \\rangle$. For an operator name such as Var, use amsmath\'s `\\DeclareMathOperator{\\Var}{Var}` instead, which gives the upright letters the spacing of `\\log`.',
    '## Using the notation',
    'Write every occurrence through its macro: `\\norm{x} \\le 1, \\quad x \\in \\R^{n}` gives $\\lVert x \\rVert \\le 1, \\quad x \\in \\mathbb{R}^{n}$. Typing `||x||` instead gives two ordinary bars with the wrong spacing, and the next time you change how norms look you would have to find every one by hand.',
    '## Labels',
    'Put `\\label{name}` right after the thing that gets the number: inside the `equation` environment, after `\\section{...}`, after `\\caption{...}` in a float. Use a prefix that says what is labelled (`eq:`, `sec:`, `tab:`, `fig:`). LaTeX writes the labels to the `.aux` file and reads them on the next run, so after adding a label you compile twice; until then references print `??`.',
    '## Referring',
    '`\\ref{sec:data}` prints the bare number and `\\pageref{sec:data}` its page. Join the word and the number with a tie, `Section~\\ref{sec:data}`, so that a line never breaks between them. For equations, amsmath\'s `\\eqref{eq:loss}` prints the number in parentheses, "(3)", which is how equations are cited.',
    'The cleveref package (loaded after hyperref, if both are used) adds `\\cref{sec:data}`, which prints the kind of object together with the number, such as "section 2" or "eq. (3)", so you cannot write "Table" for a figure by mistake. At the start of a sentence use `\\Cref`, which capitalises the name and does not abbreviate it: "Section 2", "Equation (3)".',
    '## How to work the whole problem',
    'Define each piece of notation once in the preamble: no argument for a fixed symbol, `[1]` and `#1` for something applied to an argument. Write the formulas with these macros. Label every numbered object right after it is numbered, with the paper\'s prefix. When referring, choose `\\eqref` for equations, `\\cref` for anything inside a sentence, and `\\Cref` at the start of one.',
    '## Typical mistakes',
    'Leaving out the backslash in the name of a new command. Using `\\renewcommand` for a new name, or `\\newcommand` for an existing one. Forgetting `[1]`, or writing a fixed letter where `#1` belongs. Typing the notation by hand instead of using its macro. Putting a label before the caption or outside the equation. Dropping the prefix. Using `\\ref` where parentheses or the object\'s name are wanted. Not compiling twice and wondering about the `??`.',
  ],
  samples: [{ workedSeed: 'latex-7-worked', lqId: 'latex-lq-7' }],
  practice: [
    { prompt: 'With `\\norm` and `\\R` defined as in the lesson, typeset the unit ball.', blank: { mode: 'render', key: '\\{ x \\in \\R^{n} : \\norm{x} \\le 1 \\}', macros: { '\\R': '\\mathbb{R}', '\\norm': '\\lVert #1 \\rVert' } } },
  ],
}
