// LQ-D: a one-sided exact binomial test: size, power, p-value, and Wald interval and sample size for a proportion.
// Lectures 8 (errors, power, p-values) and 7 (confidence intervals for a proportion).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tolInt } from '../../../shared/format'

export interface Params {
  n: number
  p0: number
  p1: number
  c: number // reject H0 when X >= c
  xObs: number
  margin: number // desired half-width of the Wald interval
}

const Z = 1.96
export const choose = (n: number, k: number) => {
  let r = 1
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i
  return r
}
const pmf = (n: number, k: number, p: number) => choose(n, k) * p ** k * (1 - p) ** (n - k)
const upper = (n: number, c: number, p: number) => {
  let s = 0
  for (let k = c; k <= n; k++) s += pmf(n, k, p)
  return s
}

export function sample(rng: Rng): Params {
  const n = rng.pick([8, 10, 12])
  const p0 = rng.pick([0.5, 0.6, 0.7])
  const p1 = rng.pick([0.8, 0.85, 0.9].filter((p) => p > p0 + 0.09))
  const c = n - rng.pick([2, 3])
  const xObs = rng.int(c - 1, n - 1)
  let margin: number
  let need: number
  do {
    margin = rng.pick([0.04, 0.05, 0.1])
    need = (Z * Z * (xObs / n) * (1 - xObs / n)) / (margin * margin)
  } while (Math.abs(need - Math.round(need)) < 1e-6 || Math.abs(need - Math.round(need)) > 0.499999)
  return { n, p0, p1, c, xObs, margin }
}

export function build({ n, p0, p1, c, xObs, margin }: Params): LQInstance {
  const alpha = upper(n, c, p0)
  const power = upper(n, c, p1)
  const pval = upper(n, xObs, p0)
  const ph = xObs / n
  const lower = ph - Z * Math.sqrt((ph * (1 - ph)) / n)
  const need = Math.ceil((Z * Z * ph * (1 - ph)) / (margin * margin))
  const X = tex('X')

  return {
    intro:
      X + ' is the number of successes in ' + tex(n) + ' independent trials with success probability ' + tex('p') + '. We test ' + tex('H_0:p=' + dec(p0)) + ' against ' + tex('H_1:p>' + dec(p0)) +
      ' by rejecting ' + tex('H_0') + ' when ' + tex('X\\ge' + c) + '. Give answers to 3 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the size ' + tex('\\alpha=P(X\\ge' + c + '\\mid p=' + dec(p0) + ')') + ' of this test.',
        answer: alpha, tolerance: tol3, lecture: 8,
        explanation: tex('\\alpha=\\sum_{k=' + c + '}^{' + n + '}\\binom{' + n + '}{k}' + dec(p0) + '^k' + dec(1 - p0) + '^{' + n + '-k}') + ' = ' + dec(alpha) + '.',
      },
      {
        prompt: 'Find the power of the test when the true value is ' + tex('p=' + dec(p1)) + '.',
        answer: power, tolerance: tol3, lecture: 8,
        explanation: 'Power is ' + tex('P(X\\ge' + c + '\\mid p=' + dec(p1) + ')=\\sum_{k=' + c + '}^{' + n + '}\\binom{' + n + '}{k}' + dec(p1) + '^k' + dec(1 - p1) + '^{' + n + '-k}') + ' = ' + dec(power) + '.',
      },
      {
        prompt: 'The data show ' + tex('X=' + xObs) + '. Find the p-value of the test (the probability under ' + tex('H_0') + ' of ' + tex('X\\ge' + xObs) + ').',
        answer: pval, tolerance: tol3, lecture: 8,
        explanation: tex('P(X\\ge' + xObs + '\\mid p=' + dec(p0) + ')') + ' = ' + dec(pval) + '. It is ' + (pval <= 0.05 ? 'below' : 'above') + ' 0.05.',
      },
      {
        prompt: 'With ' + tex('\\hat p=X/n=' + dec(ph)) + ', find the lower endpoint of the 95% Wald interval ' + tex('\\hat p\\pm1.96\\sqrt{\\hat p(1-\\hat p)/n}') + '.',
        answer: lower, tolerance: tol3, lecture: 7,
        explanation: tex('\\sqrt{\\hat p(1-\\hat p)/n}=\\sqrt{' + dec(ph) + '\\cdot' + dec(1 - ph) + '/' + n + '}=' + dec(Math.sqrt((ph * (1 - ph)) / n)) + '') + ', so the lower endpoint is ' + tex(dec(ph) + '-1.96\\cdot' + dec(Math.sqrt((ph * (1 - ph)) / n))) + ' = ' + dec(lower) + '.',
      },
      {
        prompt: 'Treating ' + tex('\\hat p=' + dec(ph)) + ' as the true proportion, what is the smallest sample size for which the 95% Wald interval has half-width at most ' + tex(dec(margin)) + '? Give a whole number.',
        answer: need, tolerance: tolInt, lecture: 7,
        explanation: 'Need ' + tex('1.96\\sqrt{\\hat p(1-\\hat p)/n}\\le' + dec(margin)) + ', i.e. ' + tex('n\\ge1.96^2\\cdot' + dec(ph) + '\\cdot' + dec(1 - ph) + '/' + dec(margin) + '^2=' + dec((Z * Z * ph * (1 - ph)) / (margin * margin))) + '. The smallest integer is ' + tex(need) + '.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'inf-lq-d-binomial', generate: (rng) => build(sample(rng)) }
