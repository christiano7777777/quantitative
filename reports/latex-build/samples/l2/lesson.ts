// Lesson for lecture 2 (Mathematical typesetting I). Verbatim format: `code` and ```blocks are shown as typed, $..$ is
// rendered. The ideas come in the order the long question asks them.
import type { Lesson } from '../../../../src/lib/types'

export const lessonLec2: Lesson = {
  verbatim: true,
  teach: [
    'You are writing the results section of a short note. Your co-author has sent the formulas as pictures, and your job is to type the code that draws each one. This is the everyday skill of mathematical typesetting: look at a formula, see its structure (what is raised, what is lowered, what is stacked, what is grouped), and write it down so that LaTeX draws exactly that.',
    '## Two ways to enter maths',
    'Inside a paragraph, maths goes between dollar signs: typing `the rate $r$ per year` prints the rate $r$ per year. A formula that deserves its own line goes in a display: `\\[ ... \\]` for an unnumbered one, or the `equation` environment for a numbered one that you can refer to later.',
    '```latex\nThe rate $r_t$ changes every day, and its average is\n\\[ \\bar{r} = \\frac{1}{T} \\sum_{t=1}^{T} r_t . \\]\n\\begin{equation}\n  V = \\sum_{t=1}^{T} \\frac{c_t}{(1+r)^{t}}\n\\end{equation}\n```',
    'Spaces inside maths are ignored: `a+b` and `a + b` draw the same thing, so space your code for readability. Letters are set in italics as variables, and digits and symbols upright. Never use `$$ ... $$` in a LaTeX document: it is plain TeX and spaces the display badly; use `\\[ ... \\]`.',
    '## Subscripts, superscripts and braces',
    'The underscore lowers and the caret raises: `x_t` gives $x_t$ and `x^2` gives $x^2$. Each of them takes exactly one token, which is one character or one command. So `x^10` gives $x^10$ (only the 1 is raised, then a normal 0). To raise or lower more than one token, group with braces: `x^{10}` gives $x^{10}$ and `x_{t-1}` gives $x_{t-1}$. Sub- and superscript can come in either order: `x_t^{10}` and `x^{10}_t` draw the same symbol.',
    'Braces are invisible grouping. They are never printed, and they cost nothing, so when in doubt add them: `x_{t}^{2}` is as good as `x_t^2`.',
    '## Fractions and Greek letters',
    'A stacked fraction is `\\frac{numerator}{denominator}`. Each argument is one token or a braced group, so `\\frac12` works for $\\frac12$, but anything longer needs braces: `\\frac{\\lambda}{\\sigma + 3}` gives $\\frac{\\lambda}{\\sigma + 3}$. A slash `a/b` is fine inside a paragraph, where a stacked fraction would push the lines apart.',
    'Greek letters are commands named after the letter: `\\alpha`, `\\beta`, `\\lambda`, `\\sigma`. A capital first letter gives the capital where it differs from Latin: `\\Sigma`, `\\Delta`, `\\Omega`. Without the backslash, `lambda` is six variables multiplied together.',
    '## Sums, integrals and limits',
    'Big operators take their limits as a subscript and a superscript: `\\sum_{i=1}^{n} x_i` gives $\\sum_{i=1}^{n} x_i$ and `\\int_0^1 f(x)\\,dx` gives $\\int_0^1 f(x)\\,dx$. The lower limit `i=1` has three tokens, so it must be braced. `\\Sigma` is only the capital letter; the operator, which grows in a display and carries limits, is `\\sum`. Infinity is `\\infty`, and `\\prod` is the product sign.',
    '## Roots',
    '`\\sqrt{...}` draws a root over its braced argument, and an optional argument gives the degree: `\\sqrt{a^2 + b^2}` gives $\\sqrt{a^2 + b^2}$ and `\\sqrt[3]{x}` gives $\\sqrt[3]{x}$. Round brackets do not delimit the argument: `\\sqrt(x+1)` puts only the opening bracket under the root.',
    '## Operator names',
    'Standard functions have commands that set them upright with the right spacing: `\\ln`, `\\log`, `\\exp`, `\\sin`, `\\cos`, `\\max`, `\\min`, `\\lim`. Compare `\\ln x` ($\\ln x$) with `ln x` ($ln x$), which reads as $l$ times $n$ times $x$. For a name without a command, such as Var or Cov, use `\\operatorname{Var}` from the amsmath package.',
    '## Brackets that grow',
    'Ordinary brackets keep their size. Around a fraction or a sum, put `\\left` and `\\right` in front of the pair and they stretch to fit: `\\left(\\frac{a}{b}\\right)^{2}` gives $\\left(\\frac{a}{b}\\right)^{2}$, while `(\\frac{a}{b})^2` gives $(\\frac{a}{b})^2$. Every `\\left` needs a matching `\\right`; the pair can use different symbols, and `\\right.` is an invisible closer.',
    '## Symbols you will meet constantly',
    'Relations: `\\le`, `\\ge`, `\\neq`, `\\approx`, `\\in`, `\\subset`. Operators: `\\pm`, `\\times`, `\\cdot`. Dots: `\\cdots` between operators ($x_1 + \\cdots + x_n$), `\\ldots` between commas ($x_1, \\ldots, x_n$). Accents: `\\hat{\\beta}`, `\\bar{x}`, `\\tilde{y}`. Fonts: `\\mathbb{R}` for the real numbers and `\\mathbf{v}` for a bold vector. `\\mathbb` needs the amssymb (or amsfonts) package in a real document.',
    '## How to work the whole problem',
    'For each picture, read the structure from the outside in. First the outermost shape: a fraction, a root, a sum, a bracketed power. Write that command with empty braces, for example `\\left(\\frac{}{}\\right)^{}`. Then fill each slot, adding braces whenever a slot holds more than one token. Finally check every name: a Greek letter, a function or a symbol needs a backslash. Read your code back token by token against the picture before moving on.',
    '## Typical mistakes',
    'Forgetting braces around a multi-token exponent, limit or fraction part (`x^10`, `\\sum_i=1`). Leaving out the backslash of a Greek letter or function (`lambda`, `ln`). Using the capital letter `\\Sigma` for a sum. Typing programming operators (`<=`, `!=`, `+-`) instead of `\\le`, `\\neq`, `\\pm`. Putting round brackets after `\\sqrt`. Forgetting that `\\left( ... \\right)` is needed for brackets that grow, and that every `\\left` has its `\\right`.',
  ],
  samples: [{ workedSeed: 'latex-2-worked', lqId: 'latex-lq-2' }],
  practice: [
    { prompt: 'A discounted cash flow.', blank: { mode: 'render', key: '\\frac{c_{t}}{(1+r)^{t}}' } },
    { prompt: 'A sample mean.', blank: { mode: 'render', key: '\\bar{x} = \\frac{1}{n} \\sum_{i=1}^{n} x_{i}' } },
    { prompt: 'A cube root.', blank: { mode: 'render', key: '\\sqrt[3]{\\lambda + 1}' } },
  ],
}
