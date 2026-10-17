// LQ-H: large-sample theory for a sample mean: Chebyshev bound, Chebyshev and CLT sample sizes, CLT probability, normal approximation to a binomial.
// Lecture 2 (Markov/Chebyshev, weak law, central limit theorem).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, normalCdf, tex, tol2, tol3, tolInt } from '../../../shared/format'

export interface Params {
  n: number // sample size in parts (a), (c)
  sigma: number // standard deviation of one observation
  mu: number
  m: number // Chebyshev deviation, in standard errors, for part (a)
  z: number // CLT threshold, in standard errors, for part (c)
  eps: number // half-width for parts (b), (d)
  delta: number // allowed Chebyshev probability for part (b)
  bn: number // binomial trials for part (e)
  bp: number
  bk: number // P(X <= bk)
}

// (n, sigma) with sigma / sqrt(n) a short decimal
const SIZES: [number, number][] = [[16, 6], [25, 10], [36, 12], [64, 16], [100, 15], [25, 5], [100, 10]]
// (trials, p) with sqrt(n p (1 - p)) a short decimal
const BINS: [number, number][] = [[100, 0.5], [400, 0.5], [100, 0.2], [400, 0.2], [225, 0.2], [100, 0.8]]

export function sample(rng: Rng): Params {
  const [n, sigma] = rng.pick(SIZES)
  const mu = rng.pick([20, 50, 80, 100, 120])
  const m = rng.pick([1.5, 2, 2.5, 3])
  const z = rng.pick([0.5, 1, 1.5, 2, 2.5])
  let eps: number, delta: number
  for (;;) {
    eps = rng.pick([0.5, 1, 2, 2.5, 4])
    delta = rng.pick([0.05, 0.1])
    const a = (sigma * sigma) / (delta * eps * eps)
    const b = (1.96 * sigma) / eps
    const bb = b * b
    // stay away from integer boundaries so that rounding up is unambiguous, and keep n moderate
    if (a < 4000 && bb > 3 && Math.abs(bb - Math.round(bb)) > 0.02) break
  }
  const [bn, bp] = rng.pick(BINS)
  const mean = bn * bp, sd = Math.sqrt(bn * bp * (1 - bp))
  const bk = Math.round(mean + rng.pick([-1.5, -1, -0.5, 0.5, 1, 1.5, 2]) * sd)
  return { n, sigma, mu, m, z, eps, delta, bn, bp, bk }
}

export function build({ n, sigma, mu, m, z, eps, delta, bn, bp, bk }: Params): LQInstance {
  const se = sigma / Math.sqrt(n)
  const devA = m * se // deviation in part (a)
  const cheb = (sigma * sigma) / (n * devA * devA)
  const nCheb = Math.ceil((sigma * sigma) / (delta * eps * eps) - 1e-9)
  const c = mu + z * se
  const clt = 1 - normalCdf(z)
  const nClt = Math.ceil(((1.96 * sigma) / eps) ** 2 - 1e-9)
  const bmean = bn * bp, bsd = Math.sqrt(bn * bp * (1 - bp))
  const bz = (bk + 0.5 - bmean) / bsd
  const binom = normalCdf(bz)
  const Xb = tex('\\bar X')

  return {
    intro:
      'Measurements ' + tex('X_1,\\dots,X_n') + ' are i.i.d. from an unknown, skewed distribution with mean ' + tex('\\mu=' + mu) + ' and standard deviation ' + tex('\\sigma=' + sigma) +
      '. Let ' + Xb + ' be the sample mean. Use normal tables where needed; give probabilities to 3 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'For ' + tex('n=' + n) + ', use Chebyshev\'s inequality to give an upper bound for ' + tex('P(|\\bar X-\\mu|\\ge' + dec(devA) + ')') + '.',
        answer: cheb, tolerance: tol3, lecture: 2,
        explanation: tex('\\operatorname{Var}\\bar X=\\sigma^2/n=' + dec((sigma * sigma) / n) + '') + ', so the bound is ' + tex('\\dfrac{\\sigma^2/n}{' + dec(devA) + '^2}=\\dfrac{' + dec((sigma * sigma) / n) + '}{' + dec(devA * devA) + '}') + ' = ' + dec(cheb) + '. (This is ' + tex('1/' + dec(m) + '^2') + ': the deviation is ' + tex(dec(m)) + ' standard errors.)',
      },
      {
        prompt: 'What is the smallest sample size ' + tex('n') + ' for which Chebyshev\'s inequality guarantees ' + tex('P(|\\bar X-\\mu|\\ge' + dec(eps) + ')\\le' + dec(delta)) + '? (Whole number.)',
        answer: nCheb, tolerance: tolInt, lecture: 2,
        explanation: 'Need ' + tex('\\dfrac{\\sigma^2}{n\\varepsilon^2}\\le\\delta') + ', i.e. ' + tex('n\\ge\\dfrac{\\sigma^2}{\\delta\\varepsilon^2}=\\dfrac{' + sigma * sigma + '}{' + dec(delta * eps * eps) + '}=' + dec((sigma * sigma) / (delta * eps * eps))) + ', so ' + tex('n=' + nCheb) + '.',
      },
      {
        prompt: 'For ' + tex('n=' + n) + ', use the central limit theorem to approximate ' + tex('P(\\bar X>' + dec(c) + ')') + '.',
        answer: clt, tolerance: tol3, lecture: 2,
        explanation: tex('\\bar X\\approx N(\\mu,\\sigma^2/n)') + ' with standard error ' + tex('\\sigma/\\sqrt n=' + dec(se)) + '. Then ' + tex('z=(' + dec(c) + '-' + mu + ')/' + dec(se) + '=' + dec(z)) + ' and ' + tex('P(Z>' + dec(z) + ')') + ' = ' + dec(clt) + '.',
      },
      {
        prompt: 'Use the central limit theorem to find the smallest ' + tex('n') + ' for which ' + tex('P(|\\bar X-\\mu|<' + dec(eps) + ')\\ge0.95') + ', taking the 97.5% point of the standard normal as 1.96. (Whole number.)',
        answer: nClt, tolerance: tolInt, lecture: 2,
        explanation: tex('P(|Z|<\\varepsilon\\sqrt n/\\sigma)\\ge0.95') + ' needs ' + tex('\\varepsilon\\sqrt n/\\sigma\\ge1.96') + ', so ' + tex('n\\ge(1.96\\sigma/\\varepsilon)^2=(1.96\\cdot' + sigma + '/' + dec(eps) + ')^2=' + dec(((1.96 * sigma) / eps) ** 2)) + ' and ' + tex('n=' + nClt) + '. Chebyshev needs far more observations for a comparable guarantee.',
      },
      {
        prompt: tex('X') + ' counts the successes in ' + tex(bn) + ' independent trials with success probability ' + tex(dec(bp)) + '. Use the normal approximation with continuity correction to estimate ' + tex('P(X\\le' + bk + ')') + ', to 2 decimal places.',
        answer: binom, tolerance: tol2, lecture: 2,
        explanation: tex('X\\approx N(np,np(1-p))=N(' + dec(bmean) + ',' + dec(bsd * bsd) + ')') + ' and ' + tex('P(X\\le' + bk + ')\\approx P\\big(Z\\le(' + bk + '.5-' + dec(bmean) + ')/' + dec(bsd) + '\\big)=\\Phi(' + dec(bz) + ')') + ' = ' + dec(binom) + '.',
      },
    ],
  }
}

export const genH: LQGenerator = { id: 'p2-lq-h-clt', generate: (rng) => build(sample(rng)) }
