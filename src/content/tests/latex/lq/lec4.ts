// LQ for lecture 4 (Tables and figures). One story: the results table and one figure of a paper. Six parts in the order of
// the lesson: the float placement, the column specification, the header row, a data row, the label after the caption,
// the figure include. Placement and \includegraphics are graded in set mode (order of letters and options is free), the
// rest in tokens mode. Every part is answerable from the intro and its own prompt, so any prefix of parts can be asked.
// Lecture 4.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance, Trap } from '../../../../lib/types'
import { BOX, typed } from '../../../shared/typed'

export type Placement = 'tp' | 'htb' | 'tb' | 'htbp'
export interface Params {
  study: string
  models: string[] // 3 row names
  metrics: string[] // k column names
  values: number[] // the k values of the second model, in thousandths
  place: Placement
  slug: string // label of the table, without prefix
  fig: string // figure file name, without folder and extension
  frac: number // width as a fraction of \textwidth, one decimal
}

const PLACEMENT_TEXT: Record<Placement, string> = {
  tp: 'at the top of a page, or on a separate page of floats, but never "here" or at the bottom',
  htb: 'here if it fits, otherwise at the top or the bottom of a page, but never on a separate page of floats',
  tb: 'at the top or the bottom of a page only',
  htbp: 'anywhere LaTeX can: here, top, bottom, or a separate page of floats',
}
const STUDIES = [
  ['credit default', 'credit'], ['house prices', 'housing'], ['churn', 'churn'], ['volatility', 'vol'], ['fraud detection', 'fraud'],
]
const MODELS = ['Baseline', 'Ridge', 'Lasso', 'Random forest', 'Gradient boosting', 'Neural net']
const METRICS = ['Accuracy', 'AUC', 'F1', 'Recall', 'Precision', 'Brier']
const FIGS = ['loss-curve', 'roc', 'calibration', 'residuals', 'importance']

export function sample(rng: Rng): Params {
  for (;;) {
    const [study, short] = rng.pick(STUDIES)
    const k = rng.pick([2, 3, 4])
    const values = Array.from({ length: k }, () => rng.pick([612, 704, 755, 781, 803, 846, 871, 905, 918, 942]))
    const P: Params = {
      study, models: rng.sample(MODELS, 3), metrics: rng.sample(METRICS, k), values,
      place: rng.pick(['tp', 'htb', 'tb', 'htbp'] as const), slug: short + '-' + rng.pick(['results', 'main', 'scores']),
      fig: rng.pick(FIGS), frac: rng.pick([0.5, 0.6, 0.7, 0.8, 0.9]),
    }
    // a row with two equal values is fine in a paper but makes a column swap invisible in the answer: avoid it
    if (new Set(values).size !== k) continue
    return P
  }
}

const num = (thousandths: number) => '0.' + String(thousandths).padStart(3, '0')
const pct = (f: number) => Math.round(f * 100)

export interface PartKey { key: string; accept?: string[]; traps: Trap[] }

const PLACEMENT_TRAPS: Record<Placement, Trap[]> = {
  tp: [{ text: 'htp', misconception: 'h allows "here", which the paper rules out' }, { text: 'tbp', misconception: 'b allows the bottom of a page' }],
  htb: [{ text: 'htbp', misconception: 'p allows a separate float page' }, { text: 'H', misconception: 'H (float package) forces the table here and is not a placement letter list' }],
  tb: [{ text: 'htb', misconception: 'h allows "here"' }, { text: 'tbp', misconception: 'p allows a separate float page' }],
  htbp: [{ text: 'htb', misconception: 'without p a large float has nowhere to go and can be held back to the end' }, { text: 'H', misconception: 'H (float package) forces the table here and is not a placement letter list' }],
}

export function keys(P: Params): PartKey[] {
  const k = P.metrics.length
  const header = ['Model', ...P.metrics].join(' & ') + ' \\\\'
  const row = [P.models[1], ...P.values.map(num)].join(' & ') + ' \\\\'
  const width = String(P.frac)
  const path = 'figures/' + P.fig
  return [
    { key: P.place, traps: PLACEMENT_TRAPS[P.place] },
    {
      key: 'l' + 'r'.repeat(k), accept: ['l' + ' r'.repeat(k)],
      traps: [
        { text: 'l' + 'c'.repeat(k), misconception: 'centred numbers do not line up on their decimal places; right-align them' },
        { text: 'l|' + 'r'.repeat(k), misconception: 'vertical rules do not belong in a booktabs table' },
        { text: 'r'.repeat(k), misconception: 'one letter per column: the model column needs its own l' },
      ],
    },
    {
      key: header,
      traps: [
        { text: ['Model', ...P.metrics].join(' & '), misconception: 'every row of a tabular ends with \\\\' },
        { text: ['Model', ...P.metrics].join(', ') + ' \\\\', misconception: 'cells are separated by &, not commas' },
      ],
    },
    {
      key: row,
      traps: [
        { text: [P.models[1], ...P.values.map(num)].join(' ') + ' \\\\', misconception: 'spaces do not separate cells; use &' },
        { text: [P.models[1], ...P.values.map(num)].join(' & ') + ' \\newline', misconception: '\\newline does not end a table row; \\\\ does' },
      ],
    },
    {
      key: '\\label{tab:' + P.slug + '}',
      traps: [
        { text: '\\label{' + P.slug + '}', misconception: 'the paper prefixes every table label with tab:' },
        { text: '\\ref{tab:' + P.slug + '}', misconception: '\\ref prints a number; \\label defines the name' },
      ],
    },
    {
      key: '\\includegraphics[width=' + width + '\\textwidth]{' + path + '}',
      accept: [
        '\\includegraphics[width=' + width.slice(1) + '\\textwidth]{' + path + '}',
        '\\includegraphics[width=' + width + '\\textwidth]{' + path + '.pdf}',
        '\\includegraphics[width=' + width.slice(1) + '\\textwidth]{' + path + '.pdf}',
      ],
      traps: [
        { text: '\\includegraphics[width=' + pct(P.frac) + '%]{' + path + '}', misconception: '% starts a comment, so the rest of the line is lost; give a fraction of \\textwidth' },
        { text: '\\includegraphics[scale=' + width + ']{' + path + '}', misconception: 'scale multiplies the natural size of the file, not the text width' },
        { text: '\\includegraphics{' + path + '}[width=' + width + '\\textwidth]', misconception: 'options come in square brackets before the file name' },
      ],
    },
  ]
}

export function build(P: Params): LQInstance {
  const ks = keys(P)
  const k = P.metrics.length
  return {
    intro: 'You are adding the results of a study on ' + P.study + ' to a paper that uses booktabs. The table compares the models ' +
      P.models.join(', ') + ' on ' + k + ' metrics (' + P.metrics.join(', ') + '), one row per model. The figure is the file `figures/' + P.fig +
      '.pdf`. Type only what goes in each box.',
    parts: [
      typed({
        prompt: 'The journal wants this table placed ' + PLACEMENT_TEXT[P.place] + '. Fill in the placement letters.', lecture: 4,
        explanation: 'h = here, t = top, b = bottom, p = page of floats. Their order does not change where LaTeX tries, so any order of the same letters is right. Answer: `' + ks[0].key + '`.',
        view: { kind: 'template', template: '\\begin{table}[' + BOX + ']' }, blank: { mode: 'set', context: '\\begin{table}[' + BOX + ']', ...ks[0] },
      }),
      typed({
        prompt: 'Give the column specification: the model names left-aligned, then one right-aligned column per metric, with no vertical rules.', lecture: 4,
        explanation: 'One letter per column: `l` for the names, then `r` for each of the ' + k + ' metrics. Answer: `' + ks[1].key + '`.',
        view: { kind: 'template', template: '\\begin{tabular}{' + BOX + '}\n\\toprule' }, blank: { mode: 'tokens', ...ks[1] },
      }),
      typed({
        prompt: 'Type the header row: the word Model, then the metric names in the order given above.', lecture: 4,
        explanation: 'Cells are separated by `&` and the row ends with `\\\\`. Answer: `' + ks[2].key + '`.',
        view: { kind: 'template', template: '\\toprule\n' + BOX + '\n\\midrule' }, blank: { mode: 'tokens', ...ks[2] },
      }),
      typed({
        prompt: 'Type the row of ' + P.models[1] + ', whose scores are ' + P.values.map(num).join(', ') + ' in the order of the metrics.', lecture: 4,
        explanation: 'Same shape as the header: name, then one cell per metric, `&` between cells, `\\\\` at the end. Answer: `' + ks[3].key + '`.',
        view: { kind: 'template', template: '\\midrule\n' + BOX }, blank: { mode: 'tokens', ...ks[3] },
      }),
      typed({
        prompt: 'The paper names every table label `tab:` followed by a short name. Give the label of this table, short name ' + P.slug + ', on the line after the caption.', lecture: 4,
        explanation: 'The label goes after `\\caption`, so it takes the caption\'s number. Answer: `' + ks[4].key + '`.',
        view: { kind: 'template', template: '\\caption{Test-set scores of the models.}\n' + BOX + '\n\\end{table}' }, blank: { mode: 'tokens', ...ks[4] },
      }),
      typed({
        prompt: 'Include the figure at ' + pct(P.frac) + ' percent of the text width.', lecture: 4,
        explanation: 'Options go in square brackets before the file name; a width relative to `\\textwidth` scales with the layout. The extension can be left out. Answer: `' + ks[5].key + '`.',
        view: { kind: 'template', template: '\\begin{figure}[htbp]\n\\centering\n' + BOX + '\n\\caption{...}' }, blank: { mode: 'set', ...ks[5] },
      }),
    ],
  }
}

export const genLec4: LQGenerator = { id: 'latex-lq-4', generate: (rng) => build(sample(rng)) }
