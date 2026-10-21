// LQ for lecture 5 (Plotting). One story: a figure with a fitted curve and the observed points, drawn with pgfplots, plus
// the export of a second figure from a Python script. Five parts in the order of the lesson: the axis with its labels
// (set mode), a function plot and a data plot (tokens mode), the legend (tokens mode, order matters), the file format of
// the exported figure (exact mode).
// Lecture 5.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance, Trap } from '../../../../lib/types'
import { BOX, typed } from '../../../shared/typed'

export interface Params {
  xlabel: string
  ylabel: string
  expr: string // pgfmath expression in x
  a: number
  b: number // domain a:b
  points: [number, number][]
  curveName: string
  dataName: string
  fig: string
}

/** pgfmath expression and how the question shows it (KaTeX); `positive` means the domain must start above 0. */
export const FUNCTIONS: { expr: string; tex: string; positive: boolean }[] = [
  { expr: 'x^2', tex: 'x^2', positive: false },
  { expr: 'x^3', tex: 'x^3', positive: false },
  { expr: 'exp(-x)', tex: 'e^{-x}', positive: false },
  { expr: 'sqrt(x)', tex: '\\sqrt{x}', positive: true },
  { expr: 'ln(x)', tex: '\\ln x', positive: true },
]
const LABELS: [string, string][] = [['Time (years)', 'Price'], ['Strike', 'Implied volatility'], ['Sample size', 'Error'], ['Dose', 'Response'], ['Horizon (days)', 'Loss']]
const NAMES: [string, string][] = [['model', 'observed'], ['fit', 'data'], ['theory', 'simulation'], ['curve', 'sample']]
const FIGS = ['returns', 'vol-smile', 'learning-curve', 'drawdown']

export function sample(rng: Rng): Params {
  for (;;) {
    const f = rng.pick(FUNCTIONS)
    const [xlabel, ylabel] = rng.pick(LABELS)
    const a = f.positive ? rng.pick([1, 2]) : rng.pick([0, 1, -1])
    const b = a + rng.pick([2, 3, 4, 5])
    const xs = rng.sample([0, 1, 2, 3, 4, 5, 6], 3).sort((p, q) => p - q)
    const points = xs.map((x) => [x, rng.pick([1, 2, 3, 4, 5, 6, 7, 8, 9])] as [number, number])
    if (new Set(points.map((p) => p[1])).size < 2) continue // a flat set of points hides a swapped coordinate
    const [curveName, dataName] = rng.pick(NAMES)
    return { xlabel, ylabel, expr: f.expr, a, b, points, curveName, dataName, fig: rng.pick(FIGS) }
  }
}

export interface PartKey { key: string; accept?: string[]; traps: Trap[] }

export function keys(P: Params): PartKey[] {
  const labels = (braced: boolean, swap: boolean) => {
    const x = 'xlabel=' + (braced ? '{' + P.xlabel + '}' : P.xlabel), y = 'ylabel=' + (braced ? '{' + P.ylabel + '}' : P.ylabel)
    return swap ? y + ', ' + x : x + ', ' + y
  }
  const dom = P.a + ':' + P.b
  const pts = P.points.map(([x, y]) => '(' + x + ',' + y + ')').join(' ')
  return [
    {
      key: '\\begin{axis}[' + labels(true, false) + ']',
      accept: ['\\begin{axis}[' + labels(false, false) + ']'],
      traps: [
        { text: '\\begin{axis}{' + labels(true, false) + '}', misconception: 'axis options go in square brackets' },
        { text: '\\begin{axis}[xlabel={' + P.ylabel + '}, ylabel={' + P.xlabel + '}]', misconception: 'xlabel is the horizontal axis, ylabel the vertical one' },
      ],
    },
    {
      key: '\\addplot[domain=' + dom + ']{' + P.expr + '};',
      traps: [
        { text: '\\addplot[domain=' + dom + ']{' + P.expr + '}', misconception: 'every pgfplots and TikZ command ends with a semicolon' },
        { text: '\\addplot[domain=' + P.a + '-' + P.b + ']{' + P.expr + '};', misconception: 'the domain is written start:end, with a colon' },
        { text: '\\addplot[domain=' + dom + '](' + P.expr + ');', misconception: 'the expression goes in braces' },
      ],
    },
    {
      key: '\\addplot coordinates {' + pts + '};',
      traps: [
        { text: '\\addplot coordinates {' + pts + '}', misconception: 'every pgfplots and TikZ command ends with a semicolon' },
        { text: '\\addplot coordinates {' + P.points.map(([x, y]) => x + ',' + y).join(' ') + '};', misconception: 'each point is written (x,y) in parentheses' },
      ],
    },
    {
      key: '\\legend{' + P.curveName + ', ' + P.dataName + '}',
      traps: [
        { text: '\\legend{' + P.dataName + ', ' + P.curveName + '}', misconception: 'legend entries follow the order of the \\addplot commands' },
        { text: '\\legend{' + P.curveName + ' ' + P.dataName + '}', misconception: 'legend entries are separated by commas' },
      ],
    },
    {
      key: 'pdf',
      traps: [
        { text: 'png', misconception: 'a PNG is a raster image: it blurs when the PDF is zoomed or printed large' },
        { text: 'svg', misconception: 'pdflatex cannot include SVG files directly' },
      ],
    },
  ]
}

export function build(P: Params): LQInstance {
  const ks = keys(P)
  const f = FUNCTIONS.find((x) => x.expr === P.expr)!
  return {
    intro: 'You are drawing a figure with pgfplots inside a `tikzpicture`: a curve $y = ' + f.tex + '$ for $' + P.a + ' \\le x \\le ' + P.b +
      '$, the observed points ' + P.points.map(([x, y]) => '$(' + x + ', ' + y + ')$').join(', ') + ', and a legend. A second figure comes from a ' +
      'co-author\'s Python script with matplotlib. Type only what goes in each box.',
    parts: [
      typed({
        prompt: 'Open the axis with the horizontal axis labelled "' + P.xlabel + '" and the vertical axis labelled "' + P.ylabel + '".', lecture: 5,
        explanation: 'Options of `axis` go in square brackets as `key=value` pairs, in any order; braces around a label are needed only when it contains a comma, but never hurt. Answer: `' + ks[0].key + '`.',
        view: { kind: 'template', template: '\\begin{tikzpicture}\n' + BOX }, blank: { mode: 'set', ...ks[0] },
      }),
      typed({
        prompt: 'Plot the curve as a function of x over the given range. Write the expression in pgfplots syntax: powers with ^, and functions such as exp, sqrt and ln with brackets.', lecture: 5,
        explanation: '`\\addplot[domain=a:b]{expression};` samples the expression in `x` over the domain. Answer: `' + ks[1].key + '`.',
        view: { kind: 'template', template: '\\begin{axis}[...]\n' + BOX }, blank: { mode: 'tokens', ...ks[1] },
      }),
      typed({
        prompt: 'Plot the observed points, in the order given, as a second plot.', lecture: 5,
        explanation: '`\\addplot coordinates {...};` takes points as `(x,y)` separated by spaces. Answer: `' + ks[2].key + '`.',
        view: { kind: 'template', template: BOX }, blank: { mode: 'tokens', ...ks[2] },
      }),
      typed({
        prompt: 'Add a legend that calls the curve "' + P.curveName + '" and the points "' + P.dataName + '".', lecture: 5,
        explanation: '`\\legend{...}` takes one entry per `\\addplot`, in the order the plots were drawn: here the curve first. Answer: `' + ks[3].key + '`.',
        view: { kind: 'template', template: BOX + '\n\\end{axis}' }, blank: { mode: 'tokens', ...ks[3] },
      }),
      typed({
        prompt: 'The paper is compiled with pdflatex and the figure must stay sharp at any zoom. Give the file extension of the exported figure.', lecture: 5,
        explanation: 'A PDF keeps lines and text as vectors, and pdflatex includes it directly with `\\includegraphics`. Answer: `' + ks[4].key + '`.',
        view: { kind: 'template', template: 'plt.savefig("figures/' + P.fig + '.' + BOX + '", bbox_inches="tight")' }, blank: { mode: 'exact', ...ks[4] },
      }),
    ],
  }
}

export const genLec5: LQGenerator = { id: 'latex-lq-5', generate: (rng) => build(sample(rng)) }
