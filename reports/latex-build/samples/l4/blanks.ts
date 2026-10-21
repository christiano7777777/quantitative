// Short typed questions for lecture 4 (Tables and figures), section 1 = tables, section 2 = floats and figures.
// tokens mode for commands and rows, set mode where letters or options may come in any order.
import { BOX } from '../../../../src/content/shared/typed'
import type { BlankQuestion } from '../../../../src/lib/types'

export const blanksLec4: BlankQuestion[] = [
  {
    id: 'latex-4-01', lecture: 4, section: 1, kind: 'name',
    prompt: 'Which package provides the rules `\\toprule`, `\\midrule` and `\\bottomrule`?',
    template: '\\usepackage{' + BOX + '}',
    blank: {
      mode: 'tokens', key: 'booktabs',
      traps: [
        { text: 'array', misconception: 'array adds column types and options, not the three booktabs rules' },
        { text: 'tabularx', misconception: 'tabularx adds stretchable X columns, not rules' },
      ],
    },
    explanation: 'booktabs gives rules of different weights with proper spacing above and below them.',
  },
  {
    id: 'latex-4-02', lecture: 4, section: 1, kind: 'template',
    prompt: 'After the left-aligned first column come three centred columns. Complete the specification.',
    template: '\\begin{tabular}{l' + BOX + '}',
    blank: {
      mode: 'tokens', key: 'ccc', accept: ['c c c'],
      traps: [
        { text: 'c|c|c', misconception: 'the bars add vertical rules, which were not asked for' },
        { text: 'lcc', misconception: 'the l is already written before the box' },
      ],
    },
    explanation: 'One letter per column: `l`, `c` or `r`. The `l` before the box is the first column, so three `c` follow.',
  },
  {
    id: 'latex-4-03', lecture: 4, section: 1, kind: 'fix',
    prompt: 'In a booktabs table, the line under the header row uses the plain LaTeX rule. Type the command that should replace it.',
    broken: 'Model & AUC \\\\ \\hline',
    blank: {
      mode: 'tokens', key: '\\midrule',
      traps: [
        { text: '\\hline', misconception: 'this is the rule being replaced: it has no spacing and the same weight as every other rule' },
        { text: '\\toprule', misconception: '\\toprule is the heavier rule above the header' },
      ],
    },
    explanation: 'Under the header goes `\\midrule`; `\\toprule` and `\\bottomrule` open and close the table.',
  },
  {
    id: 'latex-4-04', lecture: 4, section: 1, kind: 'template',
    prompt: 'End this table row.',
    template: 'Lasso & 0.81 & 0.77 ' + BOX,
    blank: {
      mode: 'tokens', key: '\\\\', accept: ['\\tabularnewline'],
      traps: [
        { text: '\\newline', misconception: '\\newline breaks a line inside a cell; it does not end the row' },
        { text: '&', misconception: '& starts another cell instead of ending the row' },
      ],
    },
    explanation: 'Every row ends with `\\\\` (or the longer `\\tabularnewline`).',
  },
  {
    id: 'latex-4-05', lecture: 4, section: 1, kind: 'template',
    prompt: 'Close the table with the right booktabs rule.',
    template: 'Lasso & 0.81 & 0.77 \\\\\n' + BOX + '\n\\end{tabular}',
    blank: {
      mode: 'tokens', key: '\\bottomrule',
      traps: [
        { text: '\\midrule', misconception: '\\midrule separates the header from the body; the last rule is heavier' },
        { text: '\\hline', misconception: 'booktabs tables do not use \\hline' },
      ],
    },
    explanation: 'The three booktabs rules are `\\toprule`, `\\midrule` and `\\bottomrule`, in that order.',
  },
  {
    id: 'latex-4-06', lecture: 4, section: 1, kind: 'fix',
    prompt: 'This table fails with "Extra alignment tab": its rows have three cells. Type the corrected first line.',
    broken: '\\begin{tabular}{lr}\nModel & AUC & F1 \\\\',
    blank: {
      mode: 'tokens', key: '\\begin{tabular}{lrr}',
      traps: [{ text: '\\begin{tabular}{lr}', misconception: 'two letters give two columns, one short of the three cells' }],
    },
    explanation: 'The specification needs one letter per cell of a row: here `l` and then `r` twice.',
  },
  {
    id: 'latex-4-07', lecture: 4, section: 2, kind: 'template',
    prompt: 'Allow the figure here, at the top or at the bottom of a page, but not on a page of floats.',
    template: '\\begin{figure}[' + BOX + ']',
    blank: {
      mode: 'set', key: 'htb', context: '\\begin{figure}[' + BOX + ']',
      traps: [
        { text: 'htbp', misconception: 'p allows a separate page of floats' },
        { text: 'H', misconception: 'H (float package) pins the figure here; it is not a list of allowed places' },
      ],
    },
    explanation: 'h, t, b and p each allow one kind of place; the letters can be in any order.',
  },
  {
    id: 'latex-4-08', lecture: 4, section: 2, kind: 'template',
    prompt: 'Make the plot half as wide as the text.',
    template: '\\includegraphics[' + BOX + ']{plot}',
    blank: {
      mode: 'set', key: 'width=0.5\\textwidth', accept: ['width=.5\\textwidth', 'width=0.50\\textwidth'],
      context: '\\includegraphics[' + BOX + ']{plot}',
      traps: [
        { text: 'width=50%', misconception: '% starts a comment: the rest of the line disappears' },
        { text: 'scale=0.5', misconception: 'scale halves the size of the file, not the text width' },
      ],
    },
    explanation: 'Give the width as a fraction of `\\textwidth`, so it follows the page layout.',
  },
  {
    id: 'latex-4-09', lecture: 4, section: 2, kind: 'name',
    prompt: 'Which package gives `\\includegraphics` with options such as `width=`?',
    template: '\\usepackage{' + BOX + '}',
    blank: {
      mode: 'tokens', key: 'graphicx',
      traps: [{ text: 'graphics', misconception: 'the older graphics package has no key=value options; graphicx (with an x) does' }],
    },
    explanation: '`graphicx` provides `\\includegraphics[key=value]{file}`.',
  },
  {
    id: 'latex-4-10', lecture: 4, section: 2, kind: 'template',
    prompt: 'Centre the contents of the figure without adding vertical space around them.',
    template: '\\begin{figure}[htbp]\n' + BOX + '\n\\includegraphics[width=0.6\\textwidth]{plot}',
    blank: {
      mode: 'tokens', key: '\\centering',
      traps: [
        { text: '\\begin{center}', misconception: 'the center environment adds vertical space above and below' },
        { text: '\\center', misconception: '\\center is the internal command of the environment, not meant to be used alone' },
      ],
    },
    explanation: 'Inside a float, `\\centering` centres what follows in the float without extra space.',
  },
  {
    id: 'latex-4-11', lecture: 4, section: 2, kind: 'template',
    prompt: 'Give this figure the label fig:loss so the text can refer to it.',
    template: '\\caption{Training loss per epoch.}\n' + BOX,
    blank: {
      mode: 'tokens', key: '\\label{fig:loss}',
      traps: [
        { text: '\\ref{fig:loss}', misconception: '\\ref prints the number; \\label defines the name' },
        { text: '\\caption{fig:loss}', misconception: 'that adds a second caption with the name as its text' },
      ],
    },
    explanation: 'The `\\label` goes after the `\\caption`, so it picks up the caption\'s number.',
  },
]
