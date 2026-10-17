// LQ-G: the nonparametric bootstrap: number of distinct resamples, inclusion probabilities, the exact bootstrap standard error of the mean, and bias correction.
// Lecture 11.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { x: number[]; theta: number; boot: number }

export function sample(rng: Rng): Params {
  const n = rng.int(4, 6)
  for (;;) {
    const x = Array.from({ length: n }, () => rng.int(1, 20))
    if (new Set(x).size > 1) {
      const theta = rng.int(10, 50) / 10
      return { x, theta, boot: theta + rng.int(-8, 8) / 10 }
    }
  }
}

const choose = (n: number, k: number): number => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r) }

export function build({ x, theta, boot }: Params): LQInstance {
  const n = x.length
  const distinct = choose(2 * n - 1, n)
  const out = (1 - 1 / n) ** n
  const expDistinct = n * (1 - out)
  const mean = x.reduce((s, v) => s + v, 0) / n
  const se = Math.sqrt(x.reduce((s, v) => s + (v - mean) ** 2, 0) / n / n)
  const corrected = 2 * theta - boot

  return {
    intro: 'The observed sample is ' + tex(x.join(',\\ ')) + ' (' + tex('n=' + n) + '). Bootstrap resamples are drawn with replacement, each of size ' + tex('n') + '. Give answers to 4 decimal places except the integer count.',
    parts: [
      {
        prompt: 'How many distinct resamples exist when we ignore the order of draws (multisets of size ' + tex('n') + ' from ' + tex('n') + ' labelled observations), ' + tex('\\binom{2n-1}{n}') + '? (An integer.)',
        answer: distinct, tolerance: tolInt, lecture: 11,
        explanation: tex('\\binom{' + (2 * n - 1) + '}{' + n + '}=' + distinct) + '. These are not equally likely, which is why we simulate rather than enumerate for large ' + tex('n') + '.',
      },
      {
        prompt: 'Find the probability that a particular observation does not appear at all in a bootstrap resample, ' + tex('(1-1/n)^n') + '.',
        answer: out, tolerance: tol4, lecture: 11,
        explanation: tex('(1-1/' + n + ')^{' + n + '}=' + dec(out)) + ', which tends to ' + tex('e^{-1}\\approx0.368') + ' as ' + tex('n') + ' grows.',
      },
      {
        prompt: 'Find the expected number of distinct original observations in one resample, ' + tex('n\\{1-(1-1/n)^n\\}') + '.',
        answer: expDistinct, tolerance: tol4, lecture: 11,
        explanation: tex(n + '\\times(1-' + dec(out) + ')=' + dec(expDistinct)) + '.',
      },
      {
        prompt: 'The exact bootstrap standard error of the sample mean is ' + tex('\\hat\\sigma/\\sqrt n') + ' where ' + tex('\\hat\\sigma^2=\\frac1n\\sum(x_i-\\bar x)^2') + ' (divisor ' + tex('n') + ', the plug-in variance). Find it.',
        answer: se, tolerance: tol4, lecture: 11,
        explanation: tex('\\bar x=' + dec(mean) + ',\\ \\hat\\sigma^2=' + dec(se * se * n) + ',\\ \\hat\\sigma/\\sqrt{' + n + '}=' + dec(se)) + '.',
      },
      {
        prompt: 'A statistic has sample value ' + tex('\\hat\\theta=' + dec(theta)) + ' and the mean of its bootstrap replicates is ' + tex('\\bar\\theta^*=' + dec(boot)) + '. Find the bias-corrected estimate ' + tex('2\\hat\\theta-\\bar\\theta^*') + '.',
        answer: corrected, tolerance: tol4, lecture: 11,
        explanation: 'Estimated bias ' + tex('\\bar\\theta^*-\\hat\\theta=' + dec(boot - theta)) + '; subtracting it gives ' + tex(dec(corrected)) + '.',
      },
    ],
  }
}

export const genG: LQGenerator = { id: 'mc-lq-g-bootstrap', generate: (rng) => build(sample(rng)) }
