// Lesson for lecture 10 (Collaboration). Verbatim format. Order of the long question: latexmk and its engine option,
// splitting the paper into files, .gitignore, cleaning, staging and committing, pushing and pulling.
import type { Lesson } from '../../../lib/types'

export const lessonLec10: Lesson = {
  verbatim: true,
  teach: [
    'You and a co-author write one paper. The tools of this lecture keep that painless: a build tool that compiles the paper correctly every time, a project laid out so that two people rarely touch the same file, and git to record and exchange changes. Overleaf, the online editor, can sync a project with a git repository, so one author can work in the browser and the other locally.',
    '## Building with latexmk',
    'A paper with references and cross-references needs several runs: LaTeX, then BibTeX or biber, then LaTeX twice more. latexmk works out which runs are needed and repeats them until everything is resolved. `latexmk -pdf main.tex` uses pdflatex; `-xelatex` or `-lualatex` choose the engines that can use system fonts through fontspec. `-pvc` keeps watching and recompiles after every save. `latexmk -c` deletes the auxiliary files and keeps the PDF, and `-C` deletes the PDF as well. Settings shared by everyone go in a `.latexmkrc` file next to `main.tex`.',
    '```text\nlatexmk -pdf main.tex      # build once\nlatexmk -pdf -pvc main.tex # rebuild on every save\nlatexmk -c                 # remove auxiliary files\n```',
    '## Laying out the project',
    'Keep `main.tex` at the root with the preamble and the order of the sections, and put each section in its own file, read in with `\\input{sections/data}` (lecture 8). Put figures in a folder and tell LaTeX where they are with `\\graphicspath{{figures/}}`. Keep the bibliography in one `.bib` file. Write one sentence per line in the source: LaTeX does not care, but git compares lines, so a changed sentence shows up as one changed line, not a changed paragraph.',
    '## What goes into git',
    'Commit the sources (`.tex`, `.bib`, figures, `.latexmkrc`), never what a compile produces. A `.gitignore` file lists patterns of files git should ignore: `*.aux`, `*.log`, `*.bbl`, `*.blg`, `*.toc`, `*.out` and the paper\'s own PDF. A `*` matches any name, so `*.aux` ignores every aux file. A pattern `.aux` would match only a file named exactly `.aux`. Ignoring generated files avoids conflicts that are not about the text at all.',
    '## The daily cycle',
    '```text\ngit pull                         # bring in your co-author\'s commits\n# ... edit sections/data.tex ...\ngit status                       # which files changed?\ngit diff                         # which lines changed?\ngit add sections/data.tex        # stage this file only\ngit commit -m "Rewrite the data section"\ngit push                         # send your commits to the shared repository\n```',
    '`git clone url` makes your first copy. Pull before you start, so that you edit the latest text. `git pull` fetches the other side\'s commits and merges them; `git fetch` alone only downloads them. Stage exactly the files you mean to commit (`git add path`, with the path from where you run the command), because `git add .` stages every change in the folder. A commit records the change locally, and only `push` makes it visible to your co-author and to Overleaf.',
    '## How to work the whole problem',
    'Pick the latexmk option from the engine the paper needs. Read each co-author\'s section into `main.tex` with `\\input` and its path from the root. For every kind of generated file, add a `*.ext` line to `.gitignore`. Clean with `-c` to keep the PDF, or `-C` to remove it. Then follow the cycle: pull, edit, stage the one file, commit, push.',
    '## Typical mistakes',
    'Forgetting the hyphen of a latexmk option, or choosing `-pdf` for a paper that needs fontspec. Leaving the folder out of a path. Committing auxiliary files or the PDF, or writing `.aux` instead of `*.aux` in `.gitignore`. Confusing `-c` and `-C`. Staging everything with `git add .`. Committing and forgetting to push, or fetching and forgetting to merge. Editing without pulling first.',
  ],
  samples: [{ workedSeed: 'latex-10-worked', lqId: 'latex-lq-10' }],
}
