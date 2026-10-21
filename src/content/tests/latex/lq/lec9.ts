// LQ for lecture 9 (Slides and posters). One story: a beamer talk about a paper. Six parts in the order of the lesson:
// the class line with the aspect ratio and the theme (set/tokens mode), a frame with a title, an overlay item, a column,
// a fragile frame for code (tokens/set mode).
// Lecture 9.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance, Trap } from '../../../../lib/types'
import { BOX, typed } from '../../../shared/typed'

export interface Params {
  ratio: '169' | '43' | '1610'
  theme: string
  title: string
  item: string
  from: number // first slide of the overlay item
  width: string // e.g. '0.5'
  codeTitle: string
}

export const RATIO_TEXT: Record<Params['ratio'], string> = { '169': '16:9', '43': '4:3', '1610': '16:10' }
const THEMES = ['Madrid', 'Berlin', 'Warsaw', 'Copenhagen', 'Boadilla']
const TITLES = ['Main Results', 'Data', 'Identification', 'Robustness', 'Takeaways']
const ITEMS = ['Returns are predictable', 'The effect is larger for small firms', 'Results survive transaction costs', 'Volatility explains half the effect']
const CODE_TITLES = ['Estimation code', 'The core loop', 'Replication script']

export function sample(rng: Rng): Params {
  return {
    ratio: rng.pick(['169', '43', '1610'] as const), theme: rng.pick(THEMES), title: rng.pick(TITLES), item: rng.pick(ITEMS),
    from: rng.pick([2, 3, 4]), width: rng.pick(['0.4', '0.5', '0.6']), codeTitle: rng.pick(CODE_TITLES),
  }
}

export interface PartKey { key: string; accept?: string[]; traps: Trap[] }

export function keys(P: Params): PartKey[] {
  return [
    {
      key: '\\documentclass[aspectratio=' + P.ratio + ']{beamer}',
      traps: [
        { text: '\\documentclass[aspectratio=' + RATIO_TEXT[P.ratio] + ']{beamer}', misconception: 'the value is written without the colon: ' + P.ratio },
        { text: '\\documentclass{beamer}[aspectratio=' + P.ratio + ']', misconception: 'class options go in square brackets before the class name' },
      ],
    },
    {
      key: '\\usetheme{' + P.theme + '}',
      traps: [
        { text: '\\usepackage{' + P.theme + '}', misconception: 'a beamer theme is loaded with \\usetheme' },
        { text: '\\usecolortheme{' + P.theme + '}', misconception: '\\usecolortheme changes only the colours; ' + P.theme + ' is a presentation theme' },
      ],
    },
    {
      key: '\\begin{frame}{' + P.title + '}',
      accept: ['\\begin{frame}\\frametitle{' + P.title + '}', '\\begin{frame}\n\\frametitle{' + P.title + '}'],
      traps: [
        { text: '\\begin{slide}{' + P.title + '}', misconception: 'a slide in beamer is a frame' },
        { text: '\\begin{frame}[' + P.title + ']', misconception: 'square brackets hold the frame\'s options; the title goes in braces' },
      ],
    },
    {
      key: '\\item<' + P.from + '-> ' + P.item,
      traps: [
        { text: '\\item<' + P.from + '> ' + P.item, misconception: 'without the dash the item is shown on slide ' + P.from + ' only' },
        { text: '\\item[' + P.from + '-] ' + P.item, misconception: 'square brackets after \\item replace the bullet; overlays use angle brackets' },
      ],
    },
    {
      key: '\\begin{column}{' + P.width + '\\textwidth}',
      traps: [
        { text: '\\begin{columns}{' + P.width + '\\textwidth}', misconception: 'columns is the outer environment; each column inside it takes a width' },
        { text: '\\begin{column}[' + P.width + '\\textwidth]', misconception: 'the width of a column is a required argument, in braces' },
      ],
    },
    {
      key: '\\begin{frame}[fragile]{' + P.codeTitle + '}',
      accept: ['\\begin{frame}[fragile]\\frametitle{' + P.codeTitle + '}', '\\begin{frame}[fragile]\n\\frametitle{' + P.codeTitle + '}'],
      traps: [
        { text: '\\begin{frame}{' + P.codeTitle + '}', misconception: 'a frame that contains verbatim text must be marked fragile' },
        { text: '\\begin{frame}[verbatim]{' + P.codeTitle + '}', misconception: 'the frame option is called fragile' },
      ],
    },
  ]
}

export function build(P: Params): LQInstance {
  const ks = keys(P)
  return {
    intro: 'You are making a beamer talk about your paper, for a projector with a ' + RATIO_TEXT[P.ratio] + ' screen, using the ' + P.theme +
      ' theme. Type only what goes in each box.',
    parts: [
      typed({
        prompt: 'Write the first line of the file, with the aspect ratio of the screen as a class option.', lecture: 9,
        explanation: 'beamer\'s `aspectratio` option takes the ratio without the colon (169 for 16:9, 43 for 4:3, 1610 for 16:10). Answer: `' + ks[0].key + '`.',
        view: { kind: 'template', template: BOX }, blank: { mode: 'set', ...ks[0] },
      }),
      typed({
        prompt: 'In the preamble, choose the presentation theme.', lecture: 9,
        explanation: '`\\usetheme{...}` sets the overall look; colour, font and inner themes can then be changed separately. Answer: `' + ks[1].key + '`.',
        view: { kind: 'template', template: '% preamble\n' + BOX }, blank: { mode: 'tokens', ...ks[1] },
      }),
      typed({
        prompt: 'Open a slide with the title "' + P.title + '".', lecture: 9,
        explanation: 'A slide is a `frame`; its title can follow in braces or be given with `\\frametitle`. Answer: `' + ks[2].key + '`.',
        view: { kind: 'template', template: BOX + '\n  \\begin{itemize}' }, blank: { mode: 'tokens', ...ks[2] },
      }),
      typed({
        prompt: 'Add the item "' + P.item + '" so that it appears from the ' + P.from + (P.from === 2 ? 'nd' : P.from === 3 ? 'rd' : 'th') + ' step of the slide onwards.', lecture: 9,
        explanation: 'An overlay specification in angle brackets says on which steps something is shown; `n-` means from step n on. Answer: `' + ks[3].key + '`.',
        view: { kind: 'template', template: '\\begin{itemize}\n  \\item First point\n  ' + BOX + '\n\\end{itemize}' }, blank: { mode: 'tokens', ...ks[3] },
      }),
      typed({
        prompt: 'On the next slide, open a column that takes ' + Math.round(Number(P.width) * 100) + ' percent of the text width.', lecture: 9,
        explanation: 'Inside `columns`, each `column` takes its width as a required argument. Answer: `' + ks[4].key + '`.',
        view: { kind: 'template', template: '\\begin{columns}\n  ' + BOX + '\n    \\includegraphics[width=\\linewidth]{figures/plot}' }, blank: { mode: 'tokens', ...ks[4] },
      }),
      typed({
        prompt: 'Open a slide titled "' + P.codeTitle + '" that shows source code with the verbatim environment.', lecture: 9,
        explanation: 'Verbatim material inside a frame needs the `fragile` option. Answer: `' + ks[5].key + '`.',
        view: { kind: 'template', template: BOX + '\n\\begin{verbatim}\nfor t in range(T): ...\n\\end{verbatim}' }, blank: { mode: 'set', ...ks[5] },
      }),
    ],
  }
}

export const genLec9: LQGenerator = { id: 'latex-lq-9', generate: (rng) => build(sample(rng)) }
