// Lesson for lecture 5 (Plotting). Verbatim format. Order of the long question: the axis, a function plot, a data plot,
// the legend, the export of a figure from Python.
import type { Lesson } from '../../../lib/types'

export const lessonLec5: Lesson = {
  verbatim: true,
  teach: [
    'A paper needs plots, and there are two good ways to make them. You can draw them in LaTeX itself with pgfplots, so that the fonts and sizes match the text exactly and the data lives in the source. Or you can produce them with a plotting library such as matplotlib, export them to PDF, and include the file with `\\includegraphics` (lecture 4). In this lecture you draw one figure with pgfplots and export another from Python.',
    '## TikZ in one paragraph',
    'TikZ is LaTeX\'s drawing language. A drawing lives in a `tikzpicture` environment, and each command ends with a semicolon. `\\draw (0,0) -- (2,1);` draws a straight line between two points, `\\draw[->] (0,0) -- (1,0);` adds an arrow tip at the end, and `\\node at (1,2) {Peak};` places text. Options always go in square brackets right after the command. Forgetting the final `;` is the most common TikZ error.',
    '## The axis',
    'pgfplots (`\\usepackage{pgfplots}`, which also loads TikZ) adds an `axis` environment inside the `tikzpicture`. Its options are `key=value` pairs in square brackets, in any order: `xlabel` and `ylabel` for the axis labels, `xmin`, `xmax`, `ymin` and `ymax` for the visible range, `legend pos` for the legend. Put a label in braces when it contains a comma; otherwise braces are optional. For logarithmic scales, use `semilogxaxis`, `semilogyaxis` or `loglogaxis` instead of `axis`.',
    '```latex\n\\begin{tikzpicture}\n  \\begin{axis}[xlabel={Strike}, ylabel={Implied volatility}]\n    \\addplot[domain=0:3]{x^2};\n    \\addplot coordinates {(0,1) (2,5) (4,3)};\n    \\legend{model, observed}\n  \\end{axis}\n\\end{tikzpicture}\n```',
    '## Plotting a function',
    '`\\addplot[domain=a:b]{expression};` evaluates an expression in `x` over the domain, written with a colon. The expression uses pgfplots\' maths syntax: `x^2` for powers, `*` for products, and functions with brackets such as `exp(-x)`, `sqrt(x)` and `ln(x)`. Keep `sqrt` and `ln` on a domain where they are defined. Note that `domain` only chooses where the function is evaluated. The visible range of the axis is set with `xmin` and `xmax`.',
    '## Plotting data',
    '`\\addplot coordinates {(0,1) (2,5) (4,3)};` plots given points, each written `(x,y)` and separated by spaces. By default the points are joined by a line with markers; `\\addplot[only marks]` keeps only the markers, which is right for observations. For more data, `\\addplot table {data.csv};` reads a file instead, so the numbers do not clutter the source.',
    '## Legend',
    '`\\legend{model, observed}` gives one entry per `\\addplot`, in the order the plots were drawn, separated by commas. Draw the plots in the order you want them listed. `legend pos=north west` moves the legend to the top left corner; the other positions are `north east`, `south west` and `south east`.',
    '## Exporting from Python',
    'When a figure comes from a script, save it as PDF: `plt.savefig("figures/roc.pdf", bbox_inches="tight")`. The extension chooses the format. PDF keeps lines and text as vectors, so the figure stays sharp at any zoom, and pdflatex includes it directly. PNG is a raster image that blurs when enlarged; use it only for photographs or images with millions of points. SVG is a vector format too, but pdflatex cannot include it directly. `bbox_inches="tight"` crops the white margin. Set the figure size in the script close to its final size in the paper, so that the fonts come out at a readable size.',
    '## How to work the whole problem',
    'Start from the outside: `tikzpicture`, then `axis` with its options in square brackets. Add the plots in the order they should appear in the legend: a function with `domain=a:b` and the expression in braces, then data as `coordinates` with `(x,y)` points. End every plot command with `;`. Then write the legend in the same order. For a figure exported from Python, choose PDF.',
    '## Typical mistakes',
    'Missing semicolons. Putting options in braces instead of square brackets. Writing the domain as `0-3`. Writing points without brackets, or the expression in round brackets. Swapping `xlabel` and `ylabel`. Listing legend entries in a different order from the plots. Using `domain` to set the axis range. Exporting a plot as PNG for a printed paper, or as SVG for pdflatex.',
  ],
  samples: [{ workedSeed: 'latex-5-worked', lqId: 'latex-lq-5' }],
}
