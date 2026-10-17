// LQ-B: rejection efficiency, Box-Muller, composition (mixtures) and Cholesky sampling.
// Lectures 2 (acceptance-rejection) and 3 (special methods).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { a: number; b: number; u1: number; u2: number; p: number; m1: number; s1: number; m2: number; s2: number; sa: number; sb: number; rho: number; z1: number; z2: number }

export function sample(rng: Rng): Params {
  const p = rng.int(2, 8) / 10
  return {
    a: rng.int(2, 5), b: rng.int(2, 5), u1: rng.int(10, 90) / 100, u2: rng.int(1, 99) / 100,
    p, m1: rng.int(-3, 0), s1: rng.int(1, 3), m2: rng.int(1, 4), s2: rng.int(1, 3),
    sa: rng.int(1, 4), sb: rng.int(1, 4), rho: rng.int(-8, 8) / 10, z1: rng.int(-20, 20) / 10, z2: rng.int(-20, 20) / 10,
  }
}

const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1))

export function build({ a, b, u1, u2, p, m1, s1, m2, s2, sa, sb, rho, z1, z2 }: Params): LQInstance {
  const beta = (fact(a - 1) * fact(b - 1)) / fact(a + b - 1)
  const mode = (a - 1) / (a + b - 2)
  const M = (mode ** (a - 1) * (1 - mode) ** (b - 1)) / beta
  const r = Math.sqrt(-2 * Math.log(u1))
  const bm = r * Math.cos(2 * Math.PI * u2)
  const mixVar = p * s1 * s1 + (1 - p) * s2 * s2 + p * (1 - p) * (m1 - m2) ** 2
  const l22 = sb * Math.sqrt(1 - rho * rho)
  const l21 = rho * sb
  const y2 = l21 * z1 + l22 * z2

  return {
    intro: 'Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'To sample ' + tex('\\mathrm{Beta}(' + a + ',' + b + ')') + ' by acceptance-rejection, propose from ' + tex('U(0,1)') + ' with the smallest constant envelope ' + tex('M=\\max_x f(x)') + '. Find the acceptance probability ' + tex('1/M') + '. (' + tex('f(x)=x^{' + (a - 1) + '}(1-x)^{' + (b - 1) + '}/B(' + a + ',' + b + ')') + ', maximised at ' + tex('x=\\frac{a-1}{a+b-2}') + '.)',
        answer: 1 / M, tolerance: tol4, lecture: 2,
        explanation: 'The mode is ' + tex(dec(mode)) + ', ' + tex('B(' + a + ',' + b + ')=' + dec(beta)) + ', so ' + tex('M=' + dec(M)) + ' and the acceptance probability is ' + tex('1/M=' + dec(1 / M)) + '.',
      },
      {
        prompt: 'Box-Muller: from ' + tex('U_1=' + dec(u1) + ',\\ U_2=' + dec(u2)) + ' compute ' + tex('Z_1=\\sqrt{-2\\ln U_1}\\cos(2\\pi U_2)') + ' (radians).',
        answer: bm, tolerance: tol4, lecture: 3,
        explanation: tex('R=\\sqrt{-2\\ln ' + dec(u1) + '}=' + dec(r) + ',\\ \\cos(2\\pi\\cdot' + dec(u2) + ')=' + dec(Math.cos(2 * Math.PI * u2))) + ', so ' + tex('Z_1=' + dec(bm)) + '.',
      },
      {
        prompt: 'By composition, ' + tex('X') + ' is drawn from ' + tex('N(' + m1 + ',' + s1 * s1 + ')') + ' with probability ' + tex(dec(p)) + ' and from ' + tex('N(' + m2 + ',' + s2 * s2 + ')') + ' otherwise. Find ' + tex('\\mathrm{Var}(X)') + '.',
        answer: mixVar, tolerance: tol4, lecture: 3,
        explanation: 'Law of total variance: ' + tex(dec(p) + '\\cdot' + s1 * s1 + '+' + dec(1 - p) + '\\cdot' + s2 * s2 + '+' + dec(p * (1 - p)) + '\\cdot' + (m1 - m2) ** 2 + '=' + dec(mixVar)) + '.',
      },
      {
        prompt: 'To simulate ' + tex('(Y_1,Y_2)') + ' with ' + tex('\\mathrm{Var}(Y_1)=' + sa * sa + ',\\ \\mathrm{Var}(Y_2)=' + sb * sb + ',\\ \\mathrm{Corr}=' + dec(rho)) + ', use the Cholesky factor ' + tex('\\Sigma=LL^\\top') + ' with ' + tex('L=\\begin{pmatrix}L_{11}&0\\\\L_{21}&L_{22}\\end{pmatrix}') + '. Find ' + tex('L_{22}') + '.',
        answer: l22, tolerance: tol4, lecture: 3,
        explanation: tex('L_{11}=' + sa + ',\\ L_{21}=\\rho\\sigma_2=' + dec(l21) + ',\\ L_{22}=\\sqrt{\\sigma_2^2-L_{21}^2}=' + sb + '\\sqrt{1-' + dec(rho * rho) + '}=' + dec(l22)) + '.',
      },
      {
        prompt: 'With independent standard normals ' + tex('Z_1=' + dec(z1) + ',\\ Z_2=' + dec(z2)) + ', compute ' + tex('Y_2=L_{21}Z_1+L_{22}Z_2') + '.',
        answer: y2, tolerance: tol4, lecture: 3,
        explanation: tex(dec(l21) + '\\times' + dec(z1) + '+' + dec(l22) + '\\times' + dec(z2) + '=' + dec(y2)) + '.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'mc-lq-b-special', generate: (rng) => build(sample(rng)) }
