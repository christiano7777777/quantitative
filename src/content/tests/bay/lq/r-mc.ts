// LQ-R: standard Monte Carlo: standard error, required sample size, the circle estimate of pi and its error, and the grid size
// that the curse of dimensionality demands.
// Lecture 6 (Monte Carlo basics).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { n: number; sd: number; eps: number; N: number; inside: number; g: number; d: number }

export function sample(rng: Rng): Params {
  const N = rng.pick([100, 200, 400, 1000])
  return {
    n: rng.pick([100, 400, 900, 2500]), sd: rng.pick([1, 2, 3, 5]), eps: rng.pick([0.05, 0.1, 0.2]),
    N, inside: Math.round(N * (0.7 + rng.int(0, 15) / 100)), g: rng.pick([10, 20, 100]), d: rng.int(3, 6),
  }
}

export function build({ n, sd, eps, N, inside, g, d }: Params): LQInstance {
  const se = sd / Math.sqrt(n)
  const need = Math.ceil((1.96 * sd / eps) ** 2 - 1e-9)
  const phat = inside / N
  const piHat = 4 * phat
  const sePi = 4 * Math.sqrt((phat * (1 - phat)) / N)
  const grid = g ** d

  return {
    intro: 'Standard Monte Carlo estimates ' + tex('\\mu=E[h(X)]') + ' by the average ' + tex('\\hat\\mu_n=\\frac1n\\sum h(X_i)') + ' of independent draws; it is unbiased with variance ' + tex('\\mathrm{Var}[h(X)]/n') + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'A quantity ' + tex('h(X)') + ' has standard deviation ' + tex(sd) + '. Find the standard error of ' + tex('\\hat\\mu_n') + ' with ' + tex('n=' + n) + ' draws.',
        answer: se, tolerance: tol4, lecture: 4,
        explanation: tex(sd + '/\\sqrt{' + n + '}') + ' = ' + dec(se) + '.',
      },
      {
        prompt: 'How many draws make the 95% error margin ' + tex('1.96\\sigma/\\sqrt n') + ' at most ' + tex(dec(eps)) + ' when ' + tex('\\sigma=' + sd) + '? Give a whole number (round up).',
        answer: need, tolerance: tolInt, lecture: 4,
        explanation: tex('n\\ge(1.96\\times' + sd + '/' + dec(eps) + ')^2=' + dec((1.96 * sd / eps) ** 2)) + ', rounded up to ' + need + '.',
      },
      {
        prompt: 'To estimate ' + tex('\\pi') + ' draw ' + tex('(X_i,Y_i)') + ' uniformly on ' + tex('(-1,1)^2') + ' and use ' + tex('\\pi/4=P(X^2+Y^2\\le1)') + '. If ' + tex(inside) + ' of ' + tex(N) + ' points fall inside the unit circle, find the estimate ' + tex('\\hat\\pi=4\\times\\text{fraction inside}') + '.',
        answer: piHat, tolerance: tol4, lecture: 4,
        explanation: tex('4\\times' + inside + '/' + N) + ' = ' + dec(piHat) + '.',
      },
      {
        prompt: 'Find the estimated standard error of this estimate, ' + tex('4\\sqrt{\\hat p(1-\\hat p)/N}') + ' with ' + tex('\\hat p=' + inside + '/' + N) + '.',
        answer: sePi, tolerance: tol4, lecture: 4,
        explanation: 'The indicator has variance ' + tex('p(1-p)') + ', so the standard error of ' + tex('\\hat p') + ' is ' + tex('\\sqrt{' + dec(phat) + '\\times' + dec(1 - phat) + '/' + N + '}=' + dec(Math.sqrt((phat * (1 - phat)) / N))) + ' and ' + tex('\\hat\\pi') + ' multiplies it by 4: ' + dec(sePi) + '.',
      },
      {
        prompt: 'A grid method for a ' + tex(d) + '-dimensional integral uses ' + tex(g) + ' points per axis. How many grid points does it need? (Monte Carlo error does not depend on the dimension.) Give a whole number.',
        answer: grid, tolerance: tolInt, lecture: 4,
        explanation: tex(g + '^{' + d + '}') + ' = ' + grid + ': the number of grid points grows as ' + tex('g^d') + ', the curse of dimensionality.',
      },
    ],
  }
}

export const genR: LQGenerator = { id: 'bay-lq-r-mc', generate: (rng) => build(sample(rng)) }
