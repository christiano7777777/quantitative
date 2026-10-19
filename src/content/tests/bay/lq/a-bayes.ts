// LQ-A: Bayes' theorem for a discrete parameter (posterior, evidence, predictive) and the Beta-binomial update with its shrinkage weight.
// Lectures 1 (Bayesian framework) and 2 (conjugate models).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { n: number; k: number; prior: number[]; a: number; b: number } // prior in tenths over theta = 0.2, 0.5, 0.8

export const THETA = [0.2, 0.5, 0.8]
export const choose = (n: number, k: number) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r }

export function sample(rng: Rng): Params {
  const n = rng.int(5, 12)
  const p1 = rng.int(2, 5), p2 = rng.int(2, 6)
  return { n, k: rng.int(1, n - 1), prior: [p1, p2, 10 - p1 - p2 > 0 ? 10 - p1 - p2 : 1], a: rng.pick([1, 2, 3, 5]), b: rng.pick([1, 2, 3, 5]) }
}

export function build({ n, k, prior, a, b }: Params): LQInstance {
  const pr = prior.map((v) => v / prior.reduce((s, x) => s + x, 0))
  const lik = THETA.map((t) => choose(n, k) * t ** k * (1 - t) ** (n - k))
  const ev = lik.reduce((s, l, i) => s + l * pr[i], 0)
  const post = lik.map((l, i) => (l * pr[i]) / ev)
  const pred = post.reduce((s, p, i) => s + p * THETA[i], 0)
  const pm = (a + k) / (a + b + n)
  const w = n / (a + b + n)

  return {
    intro: 'A coin has success probability ' + tex('\\theta') + ' equal to ' + tex('0.2,\\ 0.5') + ' or ' + tex('0.8') + ', with prior probabilities ' + tex(pr.map(dec).join(',')) + '. In ' + tex(n) + ' tosses there were ' + tex(k) + ' successes. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the posterior probability that ' + tex('\\theta=0.5') + '.',
        answer: post[1], tolerance: tol4, lecture: 1,
        explanation: 'Likelihoods ' + tex(lik.map(dec).join(',')) + ' times priors give the weights; dividing by their sum ' + dec(ev) + ' gives ' + dec(post[1]) + '.',
      },
      {
        prompt: 'Find the marginal likelihood (evidence) ' + tex('p(y)=\\sum_\\theta p(y\\mid\\theta)p(\\theta)') + ' of the data.',
        answer: ev, tolerance: tol4, lecture: 1,
        explanation: tex(lik.map((l, i) => dec(l) + '\\cdot' + dec(pr[i])).join('+')) + ' = ' + dec(ev) + '.',
      },
      {
        prompt: 'Find the posterior predictive probability that the next toss is a success, ' + tex('\\sum_\\theta\\theta\\,p(\\theta\\mid y)') + '.',
        answer: pred, tolerance: tol4, lecture: 1,
        explanation: 'Posterior ' + tex(post.map(dec).join(',')) + ', so ' + tex('0.2\\cdot' + dec(post[0]) + '+0.5\\cdot' + dec(post[1]) + '+0.8\\cdot' + dec(post[2])) + ' = ' + dec(pred) + '.',
      },
      {
        prompt: 'Now ' + tex('\\theta') + ' is continuous with a ' + tex('\\mathrm{Beta}(' + a + ',' + b + ')') + ' prior. Find the posterior mean after ' + tex(k) + ' successes in ' + tex(n) + ' tosses.',
        answer: pm, tolerance: tol4, lecture: 3,
        explanation: 'The posterior is ' + tex('\\mathrm{Beta}(' + (a + k) + ',' + (b + n - k) + ')') + ', with mean ' + tex((a + k) + '/' + (a + b + n)) + ' = ' + dec(pm) + '.',
      },
      {
        prompt: 'The posterior mean is a weighted average of the prior mean and the sample proportion ' + tex('k/n') + '. Find the weight on the sample proportion, ' + tex('n/(\\alpha+\\beta+n)') + '.',
        answer: w, tolerance: tol4, lecture: 3,
        explanation: tex(n + '/(' + a + '+' + b + '+' + n + ')') + ' = ' + dec(w) + '; check: ' + dec(w) + '\\cdot' + dec(k / n) + ' + ' + dec(1 - w) + '\\cdot' + dec(a / (a + b)) + ' = ' + dec(pm) + '.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'bay-lq-a-bayes', generate: (rng) => build(sample(rng)) }
