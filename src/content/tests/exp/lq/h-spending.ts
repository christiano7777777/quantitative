// LQ-H: alpha spent at interim looks with the O'Brien-Fleming-type spending function, then a sample ratio mismatch check.
// Lectures 9 (alpha spending) and 11 (diagnosing sample ratio mismatch).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, normalCdf, tex } from '../../../shared/format'

/** t1 < t2 information fractions; r = designed treatment share; N users in total; nT observed treatment users */
export interface Params { t1: number; t2: number; r: number; N: number; nT: number }

export const spent = (t: number) => 2 - 2 * normalCdf(1.96 / Math.sqrt(t))

export function sample(rng: Rng): Params {
  const r = rng.pick([0.5, 0.4, 0.2])
  const N = rng.pick([20000, 40000, 50000, 80000, 100000])
  const dev = (rng.int(22, 34) / 10) * Math.sqrt(N * r * (1 - r)) * rng.pick([1, -1])
  return { t1: rng.pick([0.4, 0.5]), t2: rng.pick([0.7, 0.8, 0.9]), r, N, nT: Math.round(N * r + dev) }
}

export function build({ t1, t2, r, N, nT }: Params): LQInstance {
  const nC = N - nT
  const a1 = spent(t1), a2 = spent(t2)
  const eT = N * r, eC = N * (1 - r)
  const chi = (nT - eT) ** 2 / eT + (nC - eC) ** 2 / eC
  const p = 2 * (1 - normalCdf(Math.sqrt(chi)))
  const lost = 1 - (nT * (1 - r)) / (nC * r)
  const alphaTol = { abs: 0.0003, rel: 0.05 }

  return {
    intro:
      'A test is analysed at two interim looks, at information fractions ' + tex(dec(t1)) + ' and ' + tex(dec(t2)) + ', with the spending function ' + tex('\\alpha^*(t)=2-2\\Phi\\!\\left(z_{0.975}/\\sqrt t\\right)') + ', ' + tex('z_{0.975}=1.96') + ' (overall level 5%, two-sided). Then the final counts are checked. Answers marked with a tolerance accept a 5% relative error (tables round).',
    parts: [
      {
        prompt: 'How much alpha has been spent in total by the first look, ' + tex('\\alpha^*(' + dec(t1) + ')') + '? (4 decimal places)',
        answer: a1, tolerance: alphaTol, lecture: 9,
        explanation: tex('1.96/\\sqrt{' + dec(t1) + '}=' + dec(1.96 / Math.sqrt(t1)) + ',\\ 2-2\\Phi=' + dec(a1)) + '. Very little alpha is spent early, which is the O\'Brien-Fleming idea.',
      },
      {
        prompt: 'How much new alpha may be spent at the second look, ' + tex('\\alpha^*(' + dec(t2) + ')-\\alpha^*(' + dec(t1) + ')') + '? (4 decimal places)',
        answer: a2 - a1, tolerance: alphaTol, lecture: 9,
        explanation: tex('\\alpha^*(' + dec(t2) + ')=' + dec(a2)) + ', so the increment over ' + tex(dec(a1)) + ' is ' + tex(dec(a2 - a1)) + '.',
      },
      {
        prompt: 'The design assigns a share ' + tex(dec(r)) + ' of users to treatment. At the end, ' + tex(N) + ' users were counted: ' + tex(nT) + ' in treatment and ' + tex(nC) + ' in control. Find the chi-square statistic ' + tex('\\sum(O-E)^2/E') + ' for the sample ratio check (2 decimal places; 1% accepted).',
        answer: chi, tolerance: { abs: 0.02, rel: 0.01 }, lecture: 11,
        explanation: 'Expected ' + tex(dec(eT) + '\\text{ and }' + dec(eC)) + '. ' + tex('\\chi^2=' + dec((nT - eT) ** 2 / eT) + '+' + dec((nC - eC) ** 2 / eC) + '=' + dec(chi)) + ' on 1 degree of freedom.',
      },
      {
        prompt: 'With one degree of freedom, the p-value of the chi-square statistic is ' + tex('2\\{1-\\Phi(\\sqrt{\\chi^2})\\}') + '. Find it (4 decimal places; 5% relative error accepted).',
        answer: p, tolerance: alphaTol, lecture: 11,
        explanation: tex('\\sqrt{' + dec(chi) + '}=' + dec(Math.sqrt(chi)) + ',\\ p=' + dec(p)) + '. A p-value below about 0.001 is the usual alarm level for a sample ratio mismatch: the assignment or logging is broken and the effect estimates cannot be trusted.',
      },
      {
        prompt: 'Assume the control count is correct, so the designed treatment count is ' + tex('n_C\\,r/(1-r)') + '. By what fraction does the observed treatment count fall short of it, ' + tex('1-\\dfrac{n_T(1-r)}{n_C\\,r}') + '? A negative value means treatment has extra users (3 decimal places).',
        answer: lost, tolerance: { abs: 0.001 }, lecture: 11,
        explanation: 'Designed treatment count given ' + tex('n_C') + ' is ' + tex(dec((nC * r) / (1 - r))) + ', observed ' + tex(nT) + ', so the missing fraction is ' + tex(dec(lost)) + '.',
      },
    ],
  }
}

export const genH: LQGenerator = { id: 'exp-lq-h-spending', generate: (rng) => build(sample(rng)) }
