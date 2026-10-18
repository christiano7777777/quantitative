// LQ-J (lecture quiz only): summaries of a Beta posterior: mean, MAP, spread, an interval, and a posterior probability.
// Lecture 4 (posterior summaries).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { n: number; k: number; c: number }

export function sample(rng: Rng): Params {
  const n = rng.int(6, 10)
  return { n, k: rng.int(2, n - 2), c: rng.pick([0.3, 0.4, 0.5, 0.6]) }
}

function binom(m: number, j: number): number {
  let c = 1
  for (let i = 1; i <= j; i++) c = (c * (m - j + i)) / i
  return c
}

export function build({ n, k, c }: Params): LQInstance {
  const a = k + 1, b = n - k + 1 // flat prior
  const mean = a / (a + b)
  const map = (a - 1) / (a + b - 2)
  const sd = Math.sqrt((a * b) / ((a + b) ** 2 * (a + b + 1)))
  const up = mean + 1.96 * sd
  // P(Beta(a,b) > c) = P(Bin(a+b-1, c) <= a-1)
  const m = a + b - 1
  let tail = 0
  for (let j = 0; j <= a - 1; j++) tail += binom(m, j) * c ** j * (1 - c) ** (m - j)

  return {
    intro: 'A coin-like process has success probability ' + tex('\\theta') + ' with a uniform ' + tex('\\mathrm{Beta}(1,1)') + ' prior. ' + tex(k) + ' successes are seen in ' + tex(n) + ' trials, so the posterior is ' + tex('\\mathrm{Beta}(' + a + ',' + b + ')') + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the posterior mean of ' + tex('\\theta') + ', ' + tex('a/(a+b)') + '. (It is the Bayes estimate under squared error loss.)',
        answer: mean, tolerance: tol4, lecture: 4,
        explanation: tex('\\dfrac{' + a + '}{' + (a + b) + '}') + ' = ' + dec(mean) + '.',
      },
      {
        prompt: 'Find the MAP estimate, the posterior mode ' + tex('(a-1)/(a+b-2)') + '.',
        answer: map, tolerance: tol4, lecture: 4,
        explanation: tex('\\dfrac{' + (a - 1) + '}{' + (a + b - 2) + '}') + ' = ' + dec(map) + ', which here is the sample proportion ' + tex('k/n') + ' because the prior is flat. It differs from the mean ' + dec(mean) + ' because the posterior is not symmetric.',
      },
      {
        prompt: 'Find the posterior standard deviation ' + tex('\\sqrt{ab/\\{(a+b)^2(a+b+1)\\}}') + '.',
        answer: sd, tolerance: tol4, lecture: 4,
        explanation: tex('\\sqrt{\\dfrac{' + a + '\\cdot' + b + '}{' + (a + b) + '^2\\cdot' + (a + b + 1) + '}}') + ' = ' + dec(sd) + '.',
      },
      {
        prompt: 'Using a normal approximation to the posterior, find the upper end of the 95% credible interval, posterior mean plus ' + tex('1.96') + ' posterior standard deviations.',
        answer: up, tolerance: tol4, lecture: 4,
        explanation: tex(dec(mean) + '+1.96\\times' + dec(sd)) + ' = ' + dec(up) + '. Unlike a confidence interval this is a probability statement about ' + tex('\\theta') + ' given the data.',
      },
      {
        prompt: 'Find the posterior probability ' + tex('P(\\theta>' + dec(c) + '\\mid y)') + '. (For integer ' + tex('a,b') + ' it equals ' + tex('P(\\mathrm{Bin}(a+b-1,' + dec(c) + ')\\le a-1)') + '.)',
        answer: tail, tolerance: tol4, lecture: 4,
        explanation: 'With ' + tex('a+b-1=' + m) + ' and ' + tex('a-1=' + (a - 1)) + ', sum the binomial probabilities for ' + tex('0,\\dots,' + (a - 1)) + ' successes at ' + tex('p=' + dec(c)) + ': ' + dec(tail) + '.',
      },
    ],
  }
}

export const genJ: LQGenerator = { id: 'bay-lq-j-summary', generate: (rng) => build(sample(rng)) }
