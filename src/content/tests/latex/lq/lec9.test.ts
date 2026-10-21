import { describe, expect, it } from 'vitest'
import { checkGenerator, keysOf } from './checks'
import * as g from './lec9'
import type { Params } from './lec9'

// Hand-written alternatives: \frametitle instead of the title argument, spaces after commands and around the overlay.
const alternatives = (P: Params) => [
  '\\documentclass[ aspectratio = ' + P.ratio + ' ]{beamer}',
  '\\usetheme {' + P.theme + '} % look',
  '\\begin{frame}\n  \\frametitle{' + P.title + '}',
  '\\item<' + P.from + '->' + P.item,
  '\\begin {column} {' + P.width + '\\textwidth}',
  '\\begin{frame}[fragile]\n\\frametitle{' + P.codeTitle + '}',
]

describe('latex-lq-9 (slides and posters)', () => {
  it('keys, accepts and alternatives pass; traps fail; parameters vary', () =>
    checkGenerator(g, 9, alternatives, { parts: 6, varying: [0, 1, 2, 3, 4, 5], seed: 'lec9' }))

  it('builds the expected keys for three fixed parameter sets', () => {
    expect(keysOf(g, { ratio: '169', theme: 'Madrid', title: 'Data', item: 'Returns are predictable', from: 2, width: '0.5', codeTitle: 'The core loop' })).toEqual([
      '\\documentclass[aspectratio=169]{beamer}', '\\usetheme{Madrid}', '\\begin{frame}{Data}', '\\item<2-> Returns are predictable',
      '\\begin{column}{0.5\\textwidth}', '\\begin{frame}[fragile]{The core loop}',
    ])
    expect(keysOf(g, { ratio: '43', theme: 'Berlin', title: 'Takeaways', item: 'Results survive transaction costs', from: 4, width: '0.4', codeTitle: 'Estimation code' })).toEqual([
      '\\documentclass[aspectratio=43]{beamer}', '\\usetheme{Berlin}', '\\begin{frame}{Takeaways}', '\\item<4-> Results survive transaction costs',
      '\\begin{column}{0.4\\textwidth}', '\\begin{frame}[fragile]{Estimation code}',
    ])
    expect(keysOf(g, { ratio: '1610', theme: 'Warsaw', title: 'Robustness', item: 'The effect is larger for small firms', from: 3, width: '0.6', codeTitle: 'Replication script' })).toEqual([
      '\\documentclass[aspectratio=1610]{beamer}', '\\usetheme{Warsaw}', '\\begin{frame}{Robustness}', '\\item<3-> The effect is larger for small firms',
      '\\begin{column}{0.6\\textwidth}', '\\begin{frame}[fragile]{Replication script}',
    ])
  })
})
