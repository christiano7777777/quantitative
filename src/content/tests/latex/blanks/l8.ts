// Short typed questions for lecture 8 (Paper structure): structure commands in tokens mode.
import { BOX } from '../../../shared/typed'
import type { BlankQuestion } from '../../../../lib/types'

export const blanksLec8: BlankQuestion[] = [
  {
    id: 'latex-8-01', lecture: 8, kind: 'template',
    prompt: 'Close the summary that follows the title block.',
    template: '\\begin{abstract}\n  We show that ...\n' + BOX,
    blank: {
      mode: 'tokens', key: '\\end{abstract}',
      traps: [{ text: '\\end{summary}', misconception: 'an environment is closed with the same name it was opened with' }],
    },
    explanation: 'The `abstract` environment ends with `\\end{abstract}`.',
  },
  {
    id: 'latex-8-02', lecture: 8, kind: 'template',
    prompt: 'Read in the file intro.tex, which lives in the folder sections next to main.tex.',
    template: '\\input{' + BOX + '}',
    blank: {
      mode: 'tokens', key: 'sections/intro', accept: ['sections/intro.tex'],
      traps: [{ text: 'intro', misconception: 'the path is relative to main.tex, so the folder is part of it' }],
    },
    explanation: 'The `.tex` extension may be left out; the folder may not.',
  },
  {
    id: 'latex-8-03', lecture: 8, kind: 'template',
    prompt: 'In a thesis, each chapter file should start on a new page and be leavable out of a trial compile.',
    template: BOX + '{chapters/results}',
    blank: {
      mode: 'tokens', key: '\\include',
      traps: [{ text: '\\input', misconception: '\\input inserts the text in place, with no page break, and cannot be switched off by \\includeonly' }],
    },
    explanation: '`\\include` starts a new page and works with `\\includeonly`; it cannot be nested.',
  },
  {
    id: 'latex-8-04', lecture: 8, kind: 'template',
    prompt: 'In the preamble of the thesis, compile only the results chapter, keeping the page numbers of the full document.',
    template: BOX + '{chapters/results}',
    blank: {
      mode: 'tokens', key: '\\includeonly',
      traps: [{ text: '\\include', misconception: '\\include reads a file in the body; \\includeonly in the preamble selects which ones are read' }],
    },
    explanation: '`\\includeonly{...}` lists the `\\include`d files to process; the others keep their page and reference numbers.',
  },
  {
    id: 'latex-8-05', lecture: 8, kind: 'name',
    prompt: 'Which command, placed before the appendix sections, makes them lettered A, B, ...?',
    blank: {
      mode: 'tokens', key: '\\appendix',
      traps: [{ text: '\\section{Appendix}', misconception: 'that is one more numbered section' }],
    },
    explanation: '`\\appendix` takes no argument and prints nothing; it switches the numbering.',
  },
  {
    id: 'latex-8-06', lecture: 8, kind: 'fix',
    prompt: 'References to this section print the number of the previous one. Type the two lines in the right order (on one line or two).',
    broken: '\\label{sec:results}\n\\section{Results}',
    blank: {
      mode: 'tokens', key: '\\section{Results}\\label{sec:results}', accept: ['\\section{Results}\n\\label{sec:results}'],
      traps: [{ text: '\\label{sec:results}\\section{Results}', misconception: 'the label must follow the heading that steps the counter' }],
    },
    explanation: 'A label records the last number stepped before it, so it goes after `\\section`.',
  },
  {
    id: 'latex-8-07', lecture: 8, kind: 'template',
    prompt: 'Start a heading run into its paragraph, one level below \\subsubsection.',
    template: BOX + '{Robustness.} We repeat the test with ...',
    blank: {
      mode: 'tokens', key: '\\paragraph',
      traps: [{ text: '\\subsubsection', misconception: 'a subsubsection heading stands on its own line' }],
    },
    explanation: '`\\paragraph{...}` sets a bold heading at the start of the paragraph text.',
  },
  {
    id: 'latex-8-08', lecture: 8, kind: 'template',
    prompt: 'Start the appendix on a new page, after every figure and table still waiting has been printed.',
    template: '\\section{Conclusion}\n...\n' + BOX + '\n\\appendix',
    blank: {
      mode: 'tokens', key: '\\clearpage',
      traps: [{ text: '\\newpage', misconception: '\\newpage ends the page but leaves waiting floats for later' }],
    },
    explanation: '`\\clearpage` ends the page and prints all pending floats first.',
  },
  {
    id: 'latex-8-09', lecture: 8, kind: 'template',
    prompt: 'Add a footnote to the author\'s name in the title block saying "Funded by grant 12."',
    template: '\\author{Ann Lee' + BOX + '}',
    blank: {
      mode: 'tokens', key: '\\thanks{Funded by grant 12.}',
      traps: [{ text: '\\footnote{Funded by grant 12.}', misconception: 'inside the title block, notes are made with \\thanks' }],
    },
    explanation: '`\\thanks{...}` inside `\\author` or `\\title` gives a footnote in the title block.',
  },
  {
    id: 'latex-8-10', lecture: 8, kind: 'template',
    prompt: 'Start a numbered heading two levels below a section.',
    template: BOX + '{Sample construction}',
    blank: {
      mode: 'tokens', key: '\\subsubsection',
      traps: [{ text: '\\subsection', misconception: '\\subsection is only one level below a section' }],
    },
    explanation: 'In article: `\\section`, `\\subsection`, `\\subsubsection` (all numbered by default), then `\\paragraph`.',
  },
  {
    id: 'latex-8-11', lecture: 8, kind: 'template',
    prompt: 'In the introduction, refer to the Data section (label sec:data) so that the word and the number cannot be split across lines.',
    template: 'as described in ' + BOX + '.',
    blank: {
      mode: 'tokens', key: 'Section~\\ref{sec:data}', accept: ['\\cref{sec:data}'],
      traps: [{ text: 'Section \\ref{sec:data}', misconception: 'a normal space allows a line break before the number' }],
    },
    explanation: 'A tie `~` joins the word to the number (or `\\cref` writes both).',
  },
]
