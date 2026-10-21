// Short typed questions for lecture 5 (Plotting): TikZ and pgfplots in tokens/set mode, and two exact-mode blanks for
// the matplotlib export call (single tokens, not LaTeX).
import { BOX } from '../../../shared/typed'
import type { BlankQuestion } from '../../../../lib/types'

export const blanksLec5: BlankQuestion[] = [
  {
    id: 'latex-5-01', lecture: 5, kind: 'name',
    prompt: 'Which package provides the `axis` environment and `\\addplot`?',
    template: '\\usepackage{' + BOX + '}',
    blank: {
      mode: 'tokens', key: 'pgfplots',
      traps: [
        { text: 'tikz', misconception: 'TikZ draws shapes; axes and plots come from pgfplots, which loads TikZ for you' },
        { text: 'pgfplot', misconception: 'the package name ends in s: pgfplots' },
      ],
    },
    explanation: '`pgfplots` builds on TikZ and adds axes, plots and legends.',
  },
  {
    id: 'latex-5-02', lecture: 5, kind: 'template',
    prompt: 'Open the environment that every TikZ drawing (and every pgfplots axis) lives in.',
    template: '\\begin{' + BOX + '}\n  \\begin{axis}',
    blank: {
      mode: 'tokens', key: 'tikzpicture',
      traps: [
        { text: 'figure', misconception: 'figure is the float around the drawing; the drawing itself is a tikzpicture' },
        { text: 'tikz', misconception: 'tikz is the package; the environment is tikzpicture' },
      ],
    },
    explanation: 'A `tikzpicture` holds the drawing; put it inside a `figure` if it needs a caption.',
  },
  {
    id: 'latex-5-03', lecture: 5, kind: 'template',
    prompt: 'Finish this TikZ command.',
    template: '\\draw (0,0) -- (2,1)' + BOX,
    blank: {
      mode: 'tokens', key: ';',
      traps: [{ text: '.', misconception: 'TikZ commands end with a semicolon, not a full stop' }],
    },
    explanation: 'Every TikZ and pgfplots command ends with `;`. A missing one is the most common TikZ error.',
  },
  {
    id: 'latex-5-04', lecture: 5, kind: 'fix',
    prompt: 'This should draw a straight line from (0,0) to (2,1). Type the corrected command.',
    broken: '\\draw (0,0) - (2,1);',
    blank: {
      mode: 'tokens', key: '\\draw (0,0) -- (2,1);',
      traps: [{ text: '\\draw (0,0) -> (2,1);', misconception: 'an arrow tip is an option, \\draw[->]; the path itself is joined by --' }],
    },
    explanation: 'Points on a straight path are joined by two hyphens, `--`.',
  },
  {
    id: 'latex-5-05', lecture: 5, kind: 'template',
    prompt: 'Draw this line with an arrow tip at its end.',
    template: '\\draw[' + BOX + '] (0,0) -- (1,0);',
    blank: {
      mode: 'tokens', key: '->',
      traps: [
        { text: '<-', misconception: '<- puts the tip at the start of the path' },
        { text: 'arrow', misconception: 'arrow tips are written as -> (end), <- (start) or <-> (both)' },
      ],
    },
    explanation: '`->` puts a tip at the end, `<-` at the start, `<->` at both ends.',
  },
  {
    id: 'latex-5-06', lecture: 5, kind: 'template',
    prompt: 'Label the point (1,2) with the text Peak.',
    template: '\\node at (1,2) ' + BOX + ';',
    blank: {
      mode: 'tokens', key: '{Peak}',
      traps: [{ text: 'Peak', misconception: 'the text of a node goes in braces' }],
    },
    explanation: 'A node is `\\node at (x,y) {text};`.',
  },
  {
    id: 'latex-5-07', lecture: 5, kind: 'template',
    prompt: 'Make the horizontal axis run from 0 to 10.',
    template: '\\begin{axis}[' + BOX + ']',
    blank: {
      mode: 'set', key: 'xmin=0, xmax=10', context: '\\begin{axis}[' + BOX + ']',
      traps: [
        { text: 'domain=0:10', misconception: 'domain sets where a function is evaluated, not the range shown on the axis' },
        { text: 'xmin=10, xmax=0', misconception: 'xmin is the left end of the axis' },
      ],
    },
    explanation: '`xmin` and `xmax` fix the visible range of the x axis (`ymin` and `ymax` for y), in any order.',
  },
  {
    id: 'latex-5-08', lecture: 5, kind: 'template',
    prompt: 'Use an axis whose vertical scale is logarithmic and horizontal scale linear.',
    template: '\\begin{' + BOX + '}',
    blank: {
      mode: 'tokens', key: 'semilogyaxis',
      traps: [
        { text: 'loglogaxis', misconception: 'loglogaxis makes both axes logarithmic' },
        { text: 'semilogxaxis', misconception: 'semilogxaxis makes the horizontal axis logarithmic' },
      ],
    },
    explanation: 'pgfplots has `axis`, `semilogxaxis`, `semilogyaxis` and `loglogaxis`.',
  },
  {
    id: 'latex-5-09', lecture: 5, kind: 'template',
    prompt: 'In the co-author\'s Python script, write the figure to a file instead of showing it on screen.',
    template: 'plt.' + BOX + '("figures/roc.pdf", bbox_inches="tight")',
    blank: {
      mode: 'exact', key: 'savefig',
      traps: [
        { text: 'show', misconception: 'show opens a window and writes no file' },
        { text: 'save', misconception: 'the matplotlib function is savefig' },
      ],
    },
    explanation: '`plt.savefig(path)` writes the current figure; the extension of the path picks the format.',
  },
  {
    id: 'latex-5-10', lecture: 5, kind: 'template',
    prompt: 'Trim the white margin around the exported figure.',
    template: 'plt.savefig("figures/roc.pdf", bbox_inches=' + BOX + ')',
    blank: {
      mode: 'exact', key: '"tight"', accept: ["'tight'"],
      traps: [{ text: 'tight', misconception: 'in Python the value is a string, so it needs quotes' }],
    },
    explanation: '`bbox_inches="tight"` crops the saved figure to its content.',
  },
  {
    id: 'latex-5-11', lecture: 5, kind: 'template',
    prompt: 'Put the legend in the top left corner inside the axis.',
    template: '\\begin{axis}[' + BOX + ']',
    blank: {
      mode: 'set', key: 'legend pos=north west', context: '\\begin{axis}[' + BOX + ']',
      traps: [{ text: 'legend pos=top left', misconception: 'positions are compass names: north west, north east, south west, south east' }],
    },
    explanation: '`legend pos` takes a compass position; `outer north east` puts the legend outside the axis.',
  },
  {
    id: 'latex-5-12', lecture: 5, kind: 'template',
    prompt: 'Draw the data as separate markers, with no line joining them.',
    template: '\\addplot[' + BOX + '] coordinates {(0,1) (1,3) (2,2)};',
    blank: {
      mode: 'tokens', key: 'only marks',
      traps: [{ text: 'marks only', misconception: 'the option is spelled only marks' }],
    },
    explanation: '`only marks` draws the markers without the connecting line.',
  },
]
