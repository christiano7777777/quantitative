// bay lecture 9 (Laplace approximation and variational Bayes): one story. An unnormalised Gamma posterior g(theta) = theta^(A-1) exp(-B theta):
// the mode, the curvature, the Laplace standard deviation, the Laplace approximation to the normalising integral, and its ratio to the exact integral.
// Lecture 9.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { A: number; B: number }

export function sample(rng: Rng): Params {
  return { A: rng.int(3, 8), B: rng.int(1, 4) }
}

export function build({ A, B }: Params): LQInstance {
  const mode = (A - 1) / B
  const curv = (A - 1) / (mode * mode)
  const sd = 1 / Math.sqrt(curv)
  const gm = mode ** (A - 1) * Math.exp(-B * mode)
  const approx = gm * Math.sqrt((2 * Math.PI) / curv)
  let f = 1
  for (let i = 2; i <= A - 1; i++) f *= i
  const exact = f / B ** A
  const ratio = approx / exact

  return {
    intro: 'An unnormalised posterior density is ' + tex('g(\\theta)=\\theta^{' + (A - 1) + '}e^{-' + B + '\\theta}') + ' for ' + tex('\\theta>0') + ' (a Gamma shape ' + tex(A) + ', rate ' + tex(B) + ' posterior without its constant). Its normalising integral ' + tex('Z=\\int_0^\\infty g(\\theta)d\\theta') + ' is the marginal likelihood. The Laplace approximation replaces ' + tex('\\ln g') + ' near its mode by a quadratic. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the mode ' + tex('\\hat\\theta') + ' of ' + tex('g') + ', where ' + tex('(\\ln g)\'=(' + (A - 1) + ')/\\theta-' + B + '=0') + '.',
        answer: mode, tolerance: tol4, lecture: 9,
        explanation: tex('\\hat\\theta=' + (A - 1) + '/' + B) + ' = ' + dec(mode) + '.',
      },
      {
        prompt: 'Find the curvature ' + tex('c=-(\\ln g)\'\'(\\hat\\theta)=(' + (A - 1) + ')/\\hat\\theta^2') + ' at the mode.',
        answer: curv, tolerance: tol4, lecture: 9,
        explanation: tex('(\\ln g)\'\'=-(' + (A - 1) + ')/\\theta^2') + ', so ' + tex('c=' + (A - 1) + '/' + dec(mode) + '^2') + ' = ' + dec(curv) + '.',
      },
      {
        prompt: 'The Laplace approximation is ' + tex('N(\\hat\\theta,1/c)') + '. Find its standard deviation ' + tex('1/\\sqrt c') + '.',
        answer: sd, tolerance: tol4, lecture: 9,
        explanation: tex('1/\\sqrt{' + dec(curv) + '}') + ' = ' + dec(sd) + '. The exact Gamma posterior is skewed to the right, which a normal cannot capture.',
      },
      {
        prompt: 'The Laplace approximation to the normalising integral is ' + tex('Z\\approx g(\\hat\\theta)\\sqrt{2\\pi/c}') + '. Find it.',
        answer: approx, tolerance: tol4, lecture: 9,
        explanation: tex('g(\\hat\\theta)=' + dec(mode) + '^{' + (A - 1) + '}e^{-' + B + '\\times' + dec(mode) + '}=' + dec(gm)) + ' and ' + tex('\\sqrt{2\\pi/' + dec(curv) + '}=' + dec(Math.sqrt((2 * Math.PI) / curv))) + ', so ' + tex('Z\\approx' + dec(approx)) + '.',
      },
      {
        prompt: 'The exact integral is ' + tex('\\Gamma(A)/B^A=(A-1)!/B^A') + '. Find the ratio (Laplace approximation) / (exact integral).',
        answer: ratio, tolerance: tol4, lecture: 9,
        explanation: tex('Z=' + (A - 1) + '!/' + B + '^{' + A + '}=' + dec(exact)) + ', so the ratio is ' + tex(dec(approx) + '/' + dec(exact)) + ' = ' + dec(ratio) + '. It is close to ' + tex(1) + ' (the error is Stirling\'s) and improves as the shape grows. Variational Bayes would instead choose the best factorised ' + tex('q') + ' by maximising the ELBO, and tends to underestimate posterior variances.',
      },
    ],
  }
}

export const genLec9: LQGenerator = { id: 'bay-lq-lec9', generate: (rng) => build(sample(rng)) }
