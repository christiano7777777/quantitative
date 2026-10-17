// LQ-G: multiple testing on a list of ordered p-values: Bonferroni, Holm, Benjamini-Hochberg rejections and adjusted p-values.
// Lecture 9 (multiple testing).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { ps: number[]; q: number; k: number } // p-values in thousandths, sorted ascending

export function sample(rng: Rng): Params {
  const m = rng.pick([8, 10, 12])
  const small = Array.from({ length: rng.int(2, 5) }, () => rng.int(1, 30))
  const rest = Array.from({ length: m - small.length }, () => rng.int(20, 900))
  const ps = [...small, ...rest].sort((a, b) => a - b)
  return { ps, q: rng.pick([0.05, 0.1]), k: rng.int(2, 5) }
}

export function bh(P: number[], q: number) {
  const m = P.length
  let k = 0
  for (let i = 1; i <= m; i++) if (P[i - 1] <= (i * q) / m) k = i
  return k
}

export function build({ ps, q, k }: Params): LQInstance {
  const P = ps.map((v) => v / 1000)
  const m = P.length
  const bonf = P.filter((v) => v <= q / m).length
  let holm = 0
  for (let i = 1; i <= m; i++) { if (P[i - 1] <= q / (m - i + 1)) holm = i; else break }
  const kb = bh(P, q)
  const thr = kb > 0 ? P[kb - 1] : 0
  const adj = (() => { const a: number[] = new Array(m); let run = 1; for (let i = m; i >= 1; i--) { run = Math.min(run, (m * P[i - 1]) / i); a[i - 1] = run } return a })()

  return {
    intro: tex(m) + ' hypotheses are tested, and the ordered p-values are ' + tex(P.map(dec).join(', ')) + '. The target level is ' + tex('q=' + dec(q)) + '.',
    parts: [
      {
        prompt: 'How many hypotheses does the Bonferroni procedure (reject if ' + tex('p\\le q/m') + ') reject?',
        answer: bonf, tolerance: tolInt, lecture: 9,
        explanation: 'The threshold is ' + tex(dec(q) + '/' + m + '=' + dec(q / m)) + '; ' + bonf + ' p-values are at or below it.',
      },
      {
        prompt: 'How many does Holm\'s step-down procedure reject? (Compare the ' + tex('i') + 'th smallest ' + tex('p') + ' with ' + tex('q/(m-i+1)') + ' and stop at the first failure.)',
        answer: holm, tolerance: tolInt, lecture: 9,
        explanation: 'Thresholds ' + tex('q/m,q/(m-1),\\dots') + ' are checked in order until one is exceeded: ' + holm + ' rejections.',
      },
      {
        prompt: 'How many does the Benjamini-Hochberg procedure reject? (Find the largest ' + tex('i') + ' with ' + tex('p_{(i)}\\le iq/m') + '.)',
        answer: kb, tolerance: tolInt, lecture: 9,
        explanation: 'The thresholds are ' + tex('iq/m=' + dec(q / m) + ',' + dec((2 * q) / m) + ',\\dots') + '; the largest index with ' + tex('p_{(i)}\\le iq/m') + ' is ' + kb + '.',
      },
      {
        prompt: 'What is the largest p-value that Benjamini-Hochberg rejects (enter 0 if it rejects nothing)? (3 decimal places)',
        answer: thr, tolerance: { abs: 0.0005 }, lecture: 9,
        explanation: 'It is ' + tex('p_{(' + kb + ')}') + ' = ' + dec(thr) + '.',
      },
      {
        prompt: 'Find the Benjamini-Hochberg adjusted p-value of the ' + tex(Math.min(k, m)) + (k === 2 ? 'nd' : k === 3 ? 'rd' : 'th') + ' smallest p-value: ' + tex('\\min_{j\\ge i}\\,\\{m\\,p_{(j)}/j\\}') + ', capped at 1 (4 decimal places).',
        answer: adj[Math.min(k, m) - 1], tolerance: tol4, lecture: 9,
        explanation: 'The adjusted values are ' + tex(adj.map(dec).join(',')) + '; the one asked for is ' + dec(adj[Math.min(k, m) - 1]) + '. Rejecting all with adjusted value at most ' + tex('q') + ' reproduces the BH rule.',
      },
    ],
  }
}

export const genG: LQGenerator = { id: 'hd-lq-g-testing', generate: (rng) => build(sample(rng)) }
