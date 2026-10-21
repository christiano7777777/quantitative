// Lesson for lecture 4 (Tables and figures). Verbatim format. The ideas come in the order the long question asks them:
// placement, column specification, rows, rules, caption and label, figures.
import type { Lesson } from '../../../lib/types'

export const lessonLec4: Lesson = {
  verbatim: true,
  teach: [
    'You have finished the experiments of a study and now need the results table and one figure in the paper. A table in LaTeX is two things nested inside each other: a float, which decides where on the page the object goes and carries its caption and label, and the content, here a `tabular` that lays out the cells. Figures work the same way, with `\\includegraphics` as the content.',
    '```latex\n\\begin{table}[htbp]\n  \\centering\n  \\caption{Test-set scores of the models.}\n  \\label{tab:main}\n  \\begin{tabular}{lrr}\n    \\toprule\n    Model & AUC & F1 \\\\\n    \\midrule\n    Baseline & 0.704 & 0.612 \\\\\n    Ridge    & 0.846 & 0.781 \\\\\n    \\bottomrule\n  \\end{tabular}\n\\end{table}\n```',
    '## Where the float goes',
    'The optional argument of `table` or `figure` lists the places LaTeX may use: `h` here (where the code is), `t` the top of a page, `b` the bottom of a page, `p` a separate page that holds only floats. LaTeX tries the allowed places in its own fixed order, so the order of the letters does not matter: `[htbp]` and `[pbth]` mean the same. Leaving a letter out forbids that place. Without `p`, a large float that fits nowhere else is held back, often to the end of the chapter, together with every float after it. `[H]` from the float package is something else: it switches floating off and pins the object exactly here.',
    '## The column specification',
    'The mandatory argument of `tabular` has one letter per column: `l` left, `c` centred, `r` right. A `|` between letters draws a vertical rule. Text columns are usually left-aligned and numbers right-aligned, so that digits of the same place sit under each other; with numbers given to the same number of decimals, right alignment lines up the decimal points. A table of model names and three scores is therefore `{lrrr}`. Spaces between the letters are ignored by LaTeX.',
    '## Rows and cells',
    'Inside the tabular, `&` separates cells and `\\\\` ends a row. Every row has as many cells as the specification has columns; one cell too many gives the error "Extra alignment tab has been changed to \\cr". Spaces around `&` are ignored, so align the `&` signs in your source for readability. `\\newline` does not end a row: inside a `p{...}` column it breaks the line within a cell.',
    '## Rules: booktabs',
    'The booktabs package replaces `\\hline` with three rules: `\\toprule` above the header, `\\midrule` between header and body, `\\bottomrule` at the end. They have different weights and leave proper space above and below the text. A booktabs table has no vertical rules: the columns are separated by white space alone, which reads better and looks like the tables in journals.',
    '## Caption and label',
    'Inside the float, `\\caption{...}` writes "Table 1: ..." and steps the counter. `\\label{...}` records the current number under a name, so it must come after `\\caption`; before it, the label would pick up whatever was numbered last, often the section. Use a prefix that says what is labelled: `tab:` for tables, `fig:` for figures, `eq:` for equations. Elsewhere in the text, `Table~\\ref{tab:main}` prints the number. Tables usually have the caption above, figures below.',
    '## Figures',
    'With the graphicx package, `\\includegraphics[options]{file}` places an image. The options come in square brackets before the file name. Give the size relative to the layout, `width=0.8\\textwidth`, so the figure follows any change of page size; `scale=` multiplies the natural size of the file instead. The extension can be left out, and LaTeX finds `plot.pdf` or `plot.png`. Vector PDFs exported from your plotting tool stay sharp at any size. Use `\\centering` inside the float to centre its content: the `center` environment would add extra vertical space.',
    '```latex\n\\begin{figure}[htbp]\n  \\centering\n  \\includegraphics[width=0.8\\textwidth]{figures/roc}\n  \\caption{ROC curves of the three models.}\n  \\label{fig:roc}\n\\end{figure}\n```',
    '## How to work the whole problem',
    'Read the request for placement and translate each allowed place into its letter. Count the columns (one for the row names, one per metric) and choose a letter for each from what they hold. Write the header as the row names\' heading followed by the metric names, with `&` between cells and `\\\\` at the end, then each data row in the same shape and in the same column order. Put the label right after the caption, with the paper\'s prefix. For the figure, turn a percentage of the text width into a fraction of `\\textwidth`.',
    '## Typical mistakes',
    'Writing `[H]` when a list of allowed places was asked for, or adding `h` or `p` that the request rules out. One letter too few in the column specification. Centred or left-aligned numbers. Vertical rules or `\\hline` in a booktabs table. Separating cells with spaces or commas, or ending a row with `\\newline`. Putting the label before the caption, or writing `\\ref` where `\\label` belongs. Writing a width as a percentage: `%` starts a comment, so `width=50%]{plot}` loses the rest of the line.',
  ],
  samples: [{ workedSeed: 'latex-4-worked', lqId: 'latex-lq-4' }],
}
