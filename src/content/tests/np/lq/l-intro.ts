// LQ-L: why nonparametric: efficiency-based sample sizes and the smallest attainable p-value of the exact sign test.
// Lecture 1 (parametric versus nonparametric methods).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { nt: number; ns: number; alpha: number }

export function sample(rng: Rng): Params {
  return { nt: rng.pick([40, 60, 80, 100, 120, 150, 200]), ns: rng.int(5, 9), alpha: rng.pick([0.1, 0.05, 0.02, 0.01]) }
}

export function build({ nt, ns, alpha }: Params): LQInstance {
  const nW = Math.ceil((nt * Math.PI) / 3)
  const nS = Math.ceil((nt * Math.PI) / 2)
  const nL = Math.ceil(nt / 2)
  const pmin = 2 ** (1 - ns)
  let nmin = 1
  while (2 ** (1 - nmin) > alpha + 1e-12) nmin++

  return {
    intro: 'The asymptotic relative efficiency (ARE) of test A against test B is the limit of ' + tex('n_B/n_A') + ', the ratio of the sample sizes the two tests need for the same power, so a test with ARE ' + tex('e') + ' against the ' + tex('t') + ' test needs about ' + tex('n_t/e') + ' observations when the ' + tex('t') + ' test needs ' + tex('n_t') + '. Give sample sizes as whole numbers (round up) and other answers to 4 decimal places.',
    parts: [
      {
        prompt: 'For normal data the Wilcoxon signed-rank test has ARE ' + tex('3/\\pi') + ' against the ' + tex('t') + ' test. If the ' + tex('t') + ' test needs ' + tex(nt) + ' observations, how many does the Wilcoxon test need?',
        answer: nW, tolerance: tolInt, lecture: 1,
        explanation: tex(nt + '\\times\\pi/3=' + dec(nt * Math.PI / 3)) + ', rounded up to ' + nW + '.',
      },
      {
        prompt: 'For normal data the sign test has ARE ' + tex('2/\\pi') + ' against the ' + tex('t') + ' test. How many observations does the sign test need when the ' + tex('t') + ' test needs ' + tex(nt) + '?',
        answer: nS, tolerance: tolInt, lecture: 1,
        explanation: tex(nt + '\\times\\pi/2=' + dec(nt * Math.PI / 2)) + ', rounded up to ' + nS + '. Using only the signs costs about ' + tex('\\pi/2\\approx1.57') + ' times the data.',
      },
      {
        prompt: 'For double exponential (Laplace) data the sign test has ARE ' + tex('2') + ' against the ' + tex('t') + ' test. How many observations does the sign test need when the ' + tex('t') + ' test needs ' + tex(nt) + '?',
        answer: nL, tolerance: tolInt, lecture: 1,
        explanation: tex(nt + '/2=' + dec(nt / 2)) + ', rounded up to ' + nL + '. With heavy tails the nonparametric test is the more efficient one.',
      },
      {
        prompt: 'The exact two-sided sign test with ' + tex('n=' + ns) + ' nonzero observations uses ' + tex('B\\sim\\mathrm{Bin}(' + ns + ',\\tfrac12)') + ' under ' + tex('H_0') + '. The most extreme outcomes are ' + tex('B=0') + ' and ' + tex('B=' + ns) + '. Find the smallest p-value the test can give, ' + tex('2\\times(1/2)^{' + ns + '}') + '.',
        answer: pmin, tolerance: tol4, lecture: 1,
        explanation: tex('2/2^{' + ns + '}=2/' + 2 ** ns) + ' = ' + dec(pmin) + '. The sign test has only ' + tex('2^{' + ns + '}') + ' equally likely patterns, so its p-values are coarse.',
      },
      {
        prompt: 'What is the smallest sample size ' + tex('n') + ' for which the exact two-sided sign test can reject at level ' + tex('\\alpha=' + dec(alpha)) + '? (Smallest ' + tex('n') + ' with ' + tex('2^{1-n}\\le\\alpha') + '.) Give a whole number.',
        answer: nmin, tolerance: tolInt, lecture: 1,
        explanation: tex('2^{1-' + nmin + '}=' + dec(2 ** (1 - nmin))) + ' is at most ' + dec(alpha) + ', while ' + tex('2^{1-' + (nmin - 1) + '}=' + dec(2 ** (2 - nmin))) + ' is above it, so ' + tex('n=' + nmin) + '.',
      },
    ],
  }
}

export const genL: LQGenerator = { id: 'np-lq-l-intro', generate: (rng) => build(sample(rng)) }
