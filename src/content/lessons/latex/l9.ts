// Lesson for lecture 9 (Slides and posters). Verbatim format. Order of the long question: the class line and theme,
// frames, overlays, columns, fragile frames.
import type { Lesson } from '../../../lib/types'

export const lessonLec9: Lesson = {
  verbatim: true,
  teach: [
    'You are turning a paper into a conference talk. beamer is the LaTeX class for slides: the same maths, macros and figures as the paper, laid out one idea per slide. A poster is the same idea on one large page. It is usually a class built for posters, such as beamerposter or tikzposter, with columns and boxes like the ones below.',
    '```latex\n\\documentclass[aspectratio=169]{beamer}\n\\usetheme{Madrid}\n\\title{Intraday Momentum}\n\\author{Ann Lee}\n\\begin{document}\n\\begin{frame}\n  \\titlepage\n\\end{frame}\n\\begin{frame}{Main Results}\n  \\begin{itemize}\n    \\item Returns are predictable\n    \\item<2-> The effect is larger for small firms\n  \\end{itemize}\n\\end{frame}\n\\end{document}\n```',
    '## Class and theme',
    'The class line chooses the slide shape with `aspectratio`, written without the colon: `169` for 16:9 screens, `1610` for 16:10, `43` for the old 4:3 default. The option `handout` prints each frame once with all its steps shown, which is useful for a printed copy. In the preamble, `\\usetheme{...}` picks the overall look (Madrid, Berlin, Warsaw, ...). `\\usecolortheme{...}` and `\\usefonttheme{...}` change only colours or fonts.',
    '## Frames',
    'Each slide is a `frame` environment. Give its title in braces after `\\begin{frame}` or with `\\frametitle{...}` inside it. Square brackets right after `\\begin{frame}` hold options, not the title. The title slide is a frame containing `\\titlepage`, filled from `\\title` and `\\author`. Keep one message per frame: a title that states it, then a few short items, a figure or a formula.',
    '## Overlays',
    'A frame can be shown in steps, all in one PDF page per step. `\\pause` reveals what follows on the next step. More precisely, an overlay specification in angle brackets says when something appears: `\\item<2->` shows the item from step 2 on, `<2>` on step 2 only, `<2-3>` on steps 2 and 3. `\\only<2>{...}` exists only on that step and takes no space otherwise, while `\\uncover<2>{...}` and `\\visible<2>{...}` keep its space reserved so that nothing jumps. `\\alert<2>{...}` highlights on a step.',
    '## Columns and blocks',
    '`\\begin{columns}` holds several `\\begin{column}{width}` environments side by side, each with a required width such as `0.5\\textwidth`; a common layout is text on the left and a figure on the right. `\\begin{block}{Heading}` draws a titled box in the theme\'s colours (`alertblock` and `exampleblock` are variants), which is also the building block of a poster.',
    '## Code on slides',
    'A frame that contains verbatim material, such as the `verbatim` environment or a code listing, must be marked `fragile`: `\\begin{frame}[fragile]{Code}`. Without it the compile fails with confusing errors, because beamer reads the frame\'s contents before verbatim can take over.',
    '## How to work the whole problem',
    'Write the class line with the screen\'s ratio as `aspectratio`, then the theme in the preamble. For each slide, open a `frame` with its title in braces. Add overlays to items with angle brackets: a trailing dash means "from this step on". For side-by-side content, open `columns`, then each `column` with its width in braces. Mark any frame with code `fragile`.',
    '## Typical mistakes',
    'Writing the aspect ratio as 16:9. Loading a theme with `\\usepackage`, or changing the whole theme when only colours were asked. Putting the frame title in square brackets. Writing `<2>` when "from step 2 on" is wanted, or square brackets instead of angle brackets. Confusing `columns` and `column`, or giving a column\'s width in brackets. Forgetting `fragile` on a frame with code.',
  ],
  samples: [{ workedSeed: 'latex-9-worked', lqId: 'latex-lq-9' }],
}
