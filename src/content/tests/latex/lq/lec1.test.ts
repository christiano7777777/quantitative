import { describe, expect, it } from 'vitest'
import { checkGenerator, keysOf } from './checks'
import * as g from './lec1'
import { PHRASES, type Params } from './lec1'

// Hand-written alternatives: options and packages in the other order, spaces after commands, a trailing comment.
const alternatives = (P: Params) => [
  '\\documentclass[' + P.paper + ', ' + P.size + ']{' + P.cls + '}',
  '\\usepackage{' + P.pkgs[1] + ', ' + P.pkgs[0] + '}',
  '\\title {' + P.title + '}  % shown by \\maketitle',
  '\\author{' + P.authors[0] + '\\and ' + P.authors[1] + '}',
  '\\' + P.level + (P.starred ? '*' : '') + ' {' + P.heading + '}',
  PHRASES[P.phrase].tex + ' % escaped',
]

describe('latex-lq-1 (document structure)', () => {
  it('keys, accepts and alternatives pass; traps fail; parameters vary', () =>
    checkGenerator(g, 1, alternatives, { parts: 6, varying: [0, 1, 2, 3, 4, 5], seed: 'lec1' }))

  it('builds the expected keys for three fixed parameter sets', () => {
    expect(keysOf(g, { cls: 'article', size: '11pt', paper: 'a4paper', pkgs: ['amsmath', 'graphicx'], title: 'Results', authors: ['Ann Lee', 'Bo Chen'], heading: 'Results', level: 'section', starred: false, phrase: 0 }))
      .toEqual(['\\documentclass[11pt,a4paper]{article}', '\\usepackage{amsmath,graphicx}', '\\title{Results}', '\\author{Ann Lee \\and Bo Chen}', '\\section{Results}', 'R\\&D spending rose 5\\% in 2024'])
    expect(keysOf(g, { cls: 'report', size: '12pt', paper: 'letterpaper', pkgs: ['xcolor', 'booktabs'], title: 'A Note', authors: ['Eva Novak', 'Dev Patel'], heading: 'Model Setup', level: 'subsection', starred: true, phrase: 2 }))
      .toEqual(['\\documentclass[12pt,letterpaper]{report}', '\\usepackage{xcolor,booktabs}', '\\title{A Note}', '\\author{Eva Novak \\and Dev Patel}', '\\subsection*{Model Setup}', 'Costs fell by \\$2 million'])
    expect(keysOf(g, { cls: 'article', size: '10pt', paper: 'letterpaper', pkgs: ['geometry', 'amssymb'], title: 'X', authors: ['Femi Okoro', 'Carla Diaz'], heading: 'Related Work', level: 'section', starred: true, phrase: 4 }))
      .toEqual(['\\documentclass[10pt,letterpaper]{article}', '\\usepackage{geometry,amssymb}', '\\title{X}', '\\author{Femi Okoro \\and Carla Diaz}', '\\section*{Related Work}', 'Profit \\& loss for Q1\\_2025'])
  })
})
