// Short typed questions for lecture 10 (Collaboration): the LaTeX side (project files, \graphicspath) in tokens mode and
// single command-line tokens (latexmk, git, .gitignore, file names) in exact mode.
import { BOX } from '../../../shared/typed'
import type { BlankQuestion } from '../../../../lib/types'

export const blanksLec10: BlankQuestion[] = [
  {
    id: 'latex-10-01', lecture: 10, kind: 'template',
    prompt: 'Recompile the paper automatically every time a source file is saved, previewing the PDF.',
    template: 'latexmk -pdf ' + BOX + ' main.tex',
    blank: {
      mode: 'exact', key: '-pvc', accept: ['--pvc'],
      traps: [{ text: '-watch', misconception: 'latexmk\'s continuous preview mode is -pvc' }],
    },
    explanation: '`-pvc` keeps latexmk running and rebuilds whenever a file it depends on changes.',
  },
  {
    id: 'latex-10-02', lecture: 10, kind: 'template',
    prompt: 'Keep the log files of every build out of the repository.',
    template: '# .gitignore\n' + BOX,
    blank: {
      mode: 'exact', key: '*.log',
      traps: [{ text: '.log', misconception: 'without * the pattern matches only a file named .log' }],
    },
    explanation: 'A `*` matches any file name, so `*.log` ignores every log file.',
  },
  {
    id: 'latex-10-03', lecture: 10, kind: 'template',
    prompt: 'Show which files have changed since the last commit.',
    template: 'git ' + BOX,
    blank: {
      mode: 'exact', key: 'status',
      traps: [{ text: 'log', misconception: 'git log lists past commits, not the current changes' }],
    },
    explanation: '`git status` lists modified, staged and untracked files.',
  },
  {
    id: 'latex-10-04', lecture: 10, kind: 'template',
    prompt: 'Show the changed lines of your files, line by line, before staging them.',
    template: 'git ' + BOX,
    blank: {
      mode: 'exact', key: 'diff',
      traps: [{ text: 'status', misconception: 'status lists the files; diff shows the changed lines' }],
    },
    explanation: '`git diff` shows unstaged changes. One sentence per line in the `.tex` source keeps these diffs readable.',
  },
  {
    id: 'latex-10-05', lecture: 10, kind: 'template',
    prompt: 'Record the staged changes with a message.',
    template: 'git ' + BOX + ' -m "Rewrite the data section"',
    blank: {
      mode: 'exact', key: 'commit',
      traps: [{ text: 'push', misconception: 'push sends commits that already exist; commit creates one' }],
    },
    explanation: '`git commit -m "..."` records the staged changes locally.',
  },
  {
    id: 'latex-10-06', lecture: 10, kind: 'template',
    prompt: 'Make a local copy of the shared repository for the first time.',
    template: 'git ' + BOX + ' https://git.example.org/paper.git',
    blank: {
      mode: 'exact', key: 'clone',
      traps: [{ text: 'pull', misconception: 'pull updates a copy you already have; clone creates it' }],
    },
    explanation: '`git clone url` copies the whole repository with its history.',
  },
  {
    id: 'latex-10-07', lecture: 10, kind: 'template',
    prompt: 'Let \\includegraphics find images in the folder figures without writing the folder each time.',
    template: '\\graphicspath{' + BOX + '}',
    blank: {
      mode: 'tokens', key: '{figures/}',
      traps: [{ text: 'figures/', misconception: 'each folder in \\graphicspath is in its own braces, inside the outer ones' }],
    },
    explanation: '`\\graphicspath{{figures/}}`: each folder in its own braces, ending with a slash.',
  },
  {
    id: 'latex-10-08', lecture: 10, kind: 'name',
    prompt: 'Give the name of latexmk\'s per-project configuration file, placed next to main.tex.',
    blank: {
      mode: 'exact', key: '.latexmkrc', accept: ['latexmkrc'],
      traps: [{ text: 'latexmk.cfg', misconception: 'latexmk reads latexmkrc or .latexmkrc' }],
    },
    explanation: 'A `.latexmkrc` (or `latexmkrc`) in the project folder sets the engine and options for everyone who builds it.',
  },
  {
    id: 'latex-10-09', lecture: 10, kind: 'template',
    prompt: 'Your co-author\'s section is the file intro.tex in the folder sections. Read it into main.tex.',
    template: BOX + '{sections/intro}',
    blank: {
      mode: 'tokens', key: '\\input',
      traps: [{ text: '\\usepackage', misconception: '\\usepackage loads a .sty package; \\input reads a .tex file' }],
    },
    explanation: '`\\input{file}` reads the text of another file at that point.',
  },
  {
    id: 'latex-10-10', lecture: 10, kind: 'template',
    prompt: 'Your co-author pushed new commits. Bring them into your copy and merge them with your work.',
    template: 'git ' + BOX,
    blank: {
      mode: 'exact', key: 'pull',
      traps: [{ text: 'fetch', misconception: 'fetch downloads the commits but does not merge them' }],
    },
    explanation: '`git pull` is `git fetch` followed by a merge.',
  },
  {
    id: 'latex-10-11', lecture: 10, kind: 'template',
    prompt: 'The PDF is rebuilt from the sources by every compile. Keep it out of the repository.',
    template: '# .gitignore\n' + BOX,
    blank: {
      mode: 'exact', key: 'main.pdf',
      traps: [{ text: 'main.tex', misconception: 'the source must be committed; it is the output that is ignored' }],
    },
    explanation: 'Commit the sources, never the build output. Name the paper\'s own PDF rather than `*.pdf`, which would also hide the PDF figures you include.',
  },
]
