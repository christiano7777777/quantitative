// LQ-Q: the coordinate-ascent update for the cluster assignments of a two-component Poisson mixture (with the weights and rates
// held fixed), then the update of the Dirichlet (Beta) posterior of the mixing weight.
// Lecture 14 (variational Bayes: ELBO and coordinate ascent).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { y: number[]; pi1: number; l1: number; l2: number; a1: number; a2: number }

export function sample(rng: Rng): Params {
  const l1 = rng.pick([1, 2]), l2 = rng.pick([5, 6, 8])
  return {
    y: Array.from({ length: 4 }, () => rng.int(0, 10)), pi1: rng.pick([0.3, 0.4, 0.5, 0.6]), l1, l2,
    a1: rng.pick([1, 2, 3]), a2: rng.pick([1, 2, 3]),
  }
}

const fact = (k: number) => { let f = 1; for (let i = 2; i <= k; i++) f *= i; return f }
const pois = (lam: number, y: number) => Math.exp(-lam) * lam ** y / fact(y)

export function build({ y, pi1, l1, l2, a1, a2 }: Params): LQInstance {
  const r = y.map((v) => (pi1 * pois(l1, v)) / (pi1 * pois(l1, v) + (1 - pi1) * pois(l2, v)))
  const N1 = r.reduce((s, v) => s + v, 0)
  const aq = a1 + N1
  const mean = aq / (a1 + a2 + y.length)

  return {
    intro: 'Four counts ' + tex('y=' + y.join(',\\ ')) + ' come from a two-component Poisson mixture: with probability ' + tex('\\pi_1=' + dec(pi1)) + ' from Poisson(' + tex(l1) + ') and otherwise from Poisson(' + tex(l2) + '). Let ' + tex('z_i\\in\\{1,2\\}') + ' be the component of ' + tex('y_i') + '. Holding ' + tex('\\pi') + ' and the rates fixed, the coordinate-ascent update is ' + tex('q(z_i=1)=r_{i}\\propto\\pi_1p(y_i\\mid\\lambda_1)') + ' normalised over the two components. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find ' + tex('r_1=q(z_1=1)') + ' for ' + tex('y_1=' + y[0]) + '.',
        answer: r[0], tolerance: tol4, lecture: 14,
        explanation: tex('\\dfrac{' + dec(pi1) + '\\times' + dec(pois(l1, y[0])) + '}{' + dec(pi1) + '\\times' + dec(pois(l1, y[0])) + '+' + dec(1 - pi1) + '\\times' + dec(pois(l2, y[0])) + '}') + ' = ' + dec(r[0]) + '.',
      },
      {
        prompt: 'Find ' + tex('r_2=q(z_2=1)') + ' for ' + tex('y_2=' + y[1]) + '.',
        answer: r[1], tolerance: tol4, lecture: 14,
        explanation: 'With ' + tex('y_2=' + y[1]) + ': ' + tex('\\dfrac{' + dec(pi1) + '\\times' + dec(pois(l1, y[1])) + '}{' + dec(pi1) + '\\times' + dec(pois(l1, y[1])) + '+' + dec(1 - pi1) + '\\times' + dec(pois(l2, y[1])) + '}') + ' = ' + dec(r[1]) + '.',
      },
      {
        prompt: 'Find the expected number of observations in component 1, ' + tex('N_1=\\sum_{i=1}^4r_i') + ', using all four counts.',
        answer: N1, tolerance: tol4, lecture: 14,
        explanation: 'The responsibilities are ' + r.map(dec).join(', ') + ', which add to ' + dec(N1) + '.',
      },
      {
        prompt: 'With a ' + tex('\\mathrm{Beta}(' + a1 + ',' + a2 + ')') + ' prior on ' + tex('\\pi_1') + ', the variational update of its first parameter is ' + tex('\\alpha_1+N_1') + '. Find it.',
        answer: aq, tolerance: tol4, lecture: 14,
        explanation: tex(a1 + '+' + dec(N1)) + ' = ' + dec(aq) + ' (the second parameter becomes ' + tex(a2 + '+' + dec(y.length - N1) + '=' + dec(a2 + y.length - N1)) + ').',
      },
      {
        prompt: 'Find the updated mean of ' + tex('\\pi_1') + ' under ' + tex('q') + ', ' + tex('(\\alpha_1+N_1)/(\\alpha_1+\\alpha_2+4)') + '.',
        answer: mean, tolerance: tol4, lecture: 14,
        explanation: tex(dec(aq) + '/(' + a1 + '+' + a2 + '+4)') + ' = ' + dec(mean) + '. In full CAVI the update of ' + tex('q(z_i)') + ' uses ' + tex('E_q[\\ln\\pi_k]') + ' in place of the fixed ' + tex('\\ln\\pi_k') + ' and the two updates alternate until the ELBO stops increasing.',
      },
    ],
  }
}

export const genQ: LQGenerator = { id: 'bay-lq-q-cavi', generate: (rng) => build(sample(rng)) }
