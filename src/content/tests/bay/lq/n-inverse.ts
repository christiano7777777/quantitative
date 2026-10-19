// LQ-N: inverse transform sampling for five distributions from one uniform draw (exponential, Weibull, logistic, Cauchy, Laplace).
// Lecture 7 (inverse transform sampling).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { u: number[]; lam: number; lamW: number }

export function sample(rng: Rng): Params {
  // five distinct uniform draws, none equal to 1/2 (the Laplace branch point)
  const pool = [0.08, 0.15, 0.22, 0.31, 0.37, 0.43, 0.58, 0.64, 0.72, 0.8, 0.88, 0.93]
  return { u: rng.sample(pool, 5), lam: rng.pick([0.5, 1, 2, 3]), lamW: rng.pick([0.5, 1, 2, 4]) }
}

export function build({ u, lam, lamW }: Params): LQInstance {
  const xe = -Math.log(u[0]) / lam
  const xw = Math.sqrt(-Math.log(u[1]) / lamW)
  const xl = Math.log(u[2] / (1 - u[2]))
  const xc = Math.tan(Math.PI * (u[3] - 0.5))
  const xp = u[4] < 0.5 ? Math.log(2 * u[4]) : -Math.log(2 * (1 - u[4]))

  return {
    intro: 'Inverse transform sampling turns a uniform draw ' + tex('U\\sim U(0,1)') + ' into a draw from a distribution with cdf ' + tex('F') + ' by ' + tex('X=F^{-1}(U)') + '. Use the natural logarithm and work in radians. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Exponential with rate ' + tex('\\lambda=' + dec(lam)) + ': ' + tex('F(x)=1-e^{-\\lambda x}') + ', so one may use ' + tex('X=-\\ln(U)/\\lambda') + ' (since ' + tex('1-U') + ' is also uniform). Find ' + tex('X') + ' for ' + tex('u=' + dec(u[0])) + '.',
        answer: xe, tolerance: tol4, lecture: 4,
        explanation: tex('-\\ln(' + dec(u[0]) + ')/' + dec(lam) + '=' + dec(-Math.log(u[0])) + '/' + dec(lam)) + ' = ' + dec(xe) + '.',
      },
      {
        prompt: 'Weibull with shape ' + tex('k=2') + ' and rate ' + tex('\\lambda=' + dec(lamW)) + ': ' + tex('F(t)=1-e^{-\\lambda t^2}') + '. Use ' + tex('T=\\{-\\ln(U)/\\lambda\\}^{1/2}') + ' for ' + tex('u=' + dec(u[1])) + '.',
        answer: xw, tolerance: tol4, lecture: 4,
        explanation: tex('\\{-\\ln(' + dec(u[1]) + ')/' + dec(lamW) + '\\}^{1/2}=\\sqrt{' + dec(-Math.log(u[1]) / lamW) + '}') + ' = ' + dec(xw) + '.',
      },
      {
        prompt: 'Standard logistic: ' + tex('F(x)=1/(1+e^{-x})') + ', so ' + tex('F^{-1}(u)=\\ln\\{u/(1-u)\\}') + '. Find ' + tex('X') + ' for ' + tex('u=' + dec(u[2])) + '.',
        answer: xl, tolerance: tol4, lecture: 4,
        explanation: tex('\\ln(' + dec(u[2]) + '/' + dec(1 - u[2]) + ')') + ' = ' + dec(xl) + '.',
      },
      {
        prompt: 'Standard Cauchy: ' + tex('F(x)=\\tfrac12+\\arctan(x)/\\pi') + ', so ' + tex('F^{-1}(u)=\\tan\\{\\pi(u-\\tfrac12)\\}') + '. Find ' + tex('X') + ' for ' + tex('u=' + dec(u[3])) + '.',
        answer: xc, tolerance: tol4, lecture: 4,
        explanation: tex('\\tan(\\pi\\times' + dec(u[3] - 0.5) + ')') + ' = ' + dec(xc) + '.',
      },
      {
        prompt: 'Standard Laplace (double exponential): ' + tex('F(x)=\\tfrac12e^{x}') + ' for ' + tex('x<0') + ' and ' + tex('1-\\tfrac12e^{-x}') + ' for ' + tex('x\\ge0') + ', so ' + tex('F^{-1}(u)=\\ln(2u)') + ' if ' + tex('u<\\tfrac12') + ' and ' + tex('-\\ln\\{2(1-u)\\}') + ' otherwise. Find ' + tex('X') + ' for ' + tex('u=' + dec(u[4])) + '.',
        answer: xp, tolerance: tol4, lecture: 4,
        explanation: (u[4] < 0.5 ? 'Since ' + tex('u<\\tfrac12') + ', ' + tex('\\ln(2\\times' + dec(u[4]) + ')') : 'Since ' + tex('u\\ge\\tfrac12') + ', ' + tex('-\\ln(2\\times' + dec(1 - u[4]) + ')')) + ' = ' + dec(xp) + '.',
      },
    ],
  }
}

export const genN: LQGenerator = { id: 'bay-lq-n-inverse', generate: (rng) => build(sample(rng)) }
