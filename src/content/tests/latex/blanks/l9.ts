// Short typed questions for lecture 9 (Slides and posters): beamer frames, overlays and blocks in tokens/set mode.
import { BOX } from '../../../shared/typed'
import type { BlankQuestion } from '../../../../lib/types'

export const blanksLec9: BlankQuestion[] = [
  {
    id: 'latex-9-01', lecture: 9, kind: 'template',
    prompt: 'Make a title slide from the information given by \\title and \\author.',
    template: '\\begin{frame}\n  ' + BOX + '\n\\end{frame}',
    blank: {
      mode: 'tokens', key: '\\titlepage', accept: ['\\maketitle'],
      traps: [{ text: '\\title', misconception: '\\title only stores the title' }],
    },
    explanation: 'Inside a frame, `\\titlepage` (or `\\maketitle`) draws the title slide.',
  },
  {
    id: 'latex-9-02', lecture: 9, kind: 'template',
    prompt: 'Give this slide a title using a separate command inside the frame.',
    template: '\\begin{frame}\n  ' + BOX + '{Results}',
    blank: {
      mode: 'tokens', key: '\\frametitle',
      traps: [{ text: '\\title', misconception: '\\title is the title of the talk, not of one slide' }],
    },
    explanation: '`\\frametitle{...}` is the same as giving the title in braces after `\\begin{frame}`.',
  },
  {
    id: 'latex-9-03', lecture: 9, kind: 'template',
    prompt: 'Show the first sentence, then wait for a click before the second.',
    template: 'Prices fall at the open.\n' + BOX + '\nThey recover by noon.',
    blank: {
      mode: 'tokens', key: '\\pause',
      traps: [{ text: '\\newpage', misconception: 'a new page would be a new frame; \\pause adds a step to the same slide' }],
    },
    explanation: '`\\pause` splits the frame into steps: what follows appears on the next one.',
  },
  {
    id: 'latex-9-04', lecture: 9, kind: 'template',
    prompt: 'Show this text on step 2 only, so that it takes no space on the other steps.',
    template: BOX + '{The estimate is biased.}',
    blank: {
      mode: 'tokens', key: '\\only<2>',
      traps: [
        { text: '\\uncover<2>', misconception: '\\uncover keeps the space on the other steps (the text is just hidden)' },
        { text: '\\only<2->', misconception: '2- means step 2 and every later step' },
      ],
    },
    explanation: '`\\only<2>{...}` exists only on step 2; `\\uncover<2>{...}` and `\\visible<2>{...}` reserve the space.',
  },
  {
    id: 'latex-9-05', lecture: 9, kind: 'template',
    prompt: 'Put the definition in a highlighted box with the heading "Definition".',
    template: BOX + '\n  A frame is one slide of a beamer talk.\n\\end{block}',
    blank: {
      mode: 'tokens', key: '\\begin{block}{Definition}',
      traps: [{ text: '\\begin{box}{Definition}', misconception: 'the beamer environment is block (also alertblock and exampleblock)' }],
    },
    explanation: '`block` draws a titled box in the colours of the theme.',
  },
  {
    id: 'latex-9-06', lecture: 9, kind: 'template',
    prompt: 'Highlight one word in the theme\'s alert colour.',
    template: 'The effect is ' + BOX + '{not} robust.',
    blank: {
      mode: 'tokens', key: '\\alert',
      traps: [{ text: '\\emph', misconception: '\\emph only sets italics; \\alert uses the theme\'s alert colour' }],
    },
    explanation: '`\\alert{...}` highlights text in the theme\'s alert colour and can take an overlay, `\\alert<2>{...}`.',
  },
  {
    id: 'latex-9-07', lecture: 9, kind: 'template',
    prompt: 'Open the environment that holds side-by-side columns on a slide.',
    template: BOX + '\n  \\begin{column}{0.5\\textwidth}',
    blank: {
      mode: 'tokens', key: '\\begin{columns}',
      traps: [{ text: '\\begin{column}', misconception: 'column is one column; the outer environment is columns' }],
    },
    explanation: '`columns` holds several `column` environments, each with its own width.',
  },
  {
    id: 'latex-9-08', lecture: 9, kind: 'template',
    prompt: 'Produce a printable version of the talk in which every frame appears once, with all its steps shown.',
    template: '\\documentclass[' + BOX + ']{beamer}',
    blank: {
      mode: 'set', key: 'handout', context: '\\documentclass[' + BOX + ']{beamer}',
      traps: [{ text: 'print', misconception: 'the class option is handout' }],
    },
    explanation: 'The `handout` option collapses the steps of each frame into one page.',
  },
  {
    id: 'latex-9-09', lecture: 9, kind: 'template',
    prompt: 'Change only the colours of the theme to those of the colour theme beaver.',
    template: BOX + '{beaver}',
    blank: {
      mode: 'tokens', key: '\\usecolortheme',
      traps: [{ text: '\\usetheme', misconception: '\\usetheme changes the whole look; \\usecolortheme only the colours' }],
    },
    explanation: 'beamer separates presentation, colour, font, inner and outer themes.',
  },
  {
    id: 'latex-9-10', lecture: 9, kind: 'template',
    prompt: 'Uncover this item from step 3 onwards.',
    template: '\\item' + BOX + ' The effect fades after a week',
    blank: {
      mode: 'tokens', key: '<3->',
      traps: [
        { text: '<3>', misconception: 'without the dash the item shows on step 3 only' },
        { text: '[3-]', misconception: 'square brackets after \\item set the bullet label' },
      ],
    },
    explanation: 'Overlay specifications use angle brackets: `<3->` means step 3 and later.',
  },
  {
    id: 'latex-9-11', lecture: 9, kind: 'fix',
    prompt: 'This frame shows code with the verbatim environment and fails to compile. Type the corrected first line.',
    broken: '\\begin{frame}{Code}\n\\begin{verbatim}\nx = 1\n\\end{verbatim}\n\\end{frame}',
    blank: {
      mode: 'set', key: '\\begin{frame}[fragile]{Code}',
      traps: [{ text: '\\begin{frame}[verbatim]{Code}', misconception: 'the frame option is called fragile' }],
    },
    explanation: 'Frames with verbatim material need the `fragile` option.',
  },
]
