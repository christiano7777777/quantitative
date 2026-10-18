// LQ-A: the polynomial space P2, change of basis to powers of (x-a), and the operator T(p) = (x-a)p' + c p.
// Lectures 1 (bases, coordinates in function spaces), 2 (matrix of an operator, similarity), 3 (eigenvector).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { fixZero } from '../util'
import { dec, tex, tol3, tolInt } from '../../../shared/format'

export interface Params { a: number; c: number; p: [number, number, number]; q: [number, number, number] }

/** a polynomial written as p0 + p1 x + p2 x^2 */
const poly = (p: number[], v = 'x') => p.map((c, k) => (c === 0 ? '' : (c < 0 ? '-' : '+') + (Math.abs(c) === 1 && k > 0 ? '' : Math.abs(c)) + (k === 0 ? '' : k === 1 ? v : v + '^2'))).join('').replace(/^\+/, '') || '0'

export function sample(rng: Rng): Params {
  const a = rng.pick([-3, -2, -1, 1, 2, 3])
  const c = rng.pick([-5, -4, -3, 1, 2, 3, 4])
  const p = [rng.int(-4, 4), rng.int(-4, 4), rng.pick([-3, -2, -1, 1, 2, 3])] as [number, number, number]
  const q = [rng.int(-5, 5), rng.int(-5, 5), rng.int(-3, 3)] as [number, number, number]
  return { a, c, p, q }
}

function buildRaw({ a, c, p, q }: Params): LQInstance {
  const aTxt = a < 0 ? '(x+' + -a + ')' : '(x-' + a + ')'
  const beta = p[1] + 2 * p[2] * a // p'(a)
  const coefX = (1 + c) * p[1] - 2 * a * p[2]
  const trace = 3 * c + 3
  const qa = q[0] + q[1] * a + q[2] * a * a
  const pa = qa / c
  const gamma = a * a
  const op = tex('T(p)(x)=(x' + (a < 0 ? '+' + -a : '-' + a) + ')\\,p\'(x)' + (c < 0 ? c : '+' + c) + 'p(x)')
  return {
    intro: 'Let ' + tex('P_2') + ' be the real polynomials of degree at most 2 and define the linear operator ' + op + ' on ' + tex('P_2') + '. Let ' + tex('B=(1,x,x^2)') + ' and ' + tex("B'=(1,\\ " + aTxt + ",\\ " + aTxt + '^2)') + '. Give answers as numbers (3 decimal places where needed).',
    parts: [
      {
        prompt: 'Write ' + tex('p(x)=' + poly(p)) + ' as ' + tex('\\alpha+\\beta' + aTxt + '+\\gamma' + aTxt + '^2') + ', i.e. find its ' + tex("B'") + '-coordinates. What is ' + tex('\\beta') + '?',
        answer: beta, tolerance: tolInt, lecture: 1,
        explanation: 'Taylor expansion about ' + tex('x=' + a) + ': ' + tex('\\beta=p\'(' + a + ')=p_1+2ap_2=' + p[1] + '+2(' + a + ')(' + p[2] + ')=' + beta) + '.',
      },
      {
        prompt: 'For the same ' + tex('p') + ', ' + tex('T(p)') + ' is again a polynomial of degree at most 2. What is the coefficient of ' + tex('x') + ' in ' + tex('T(p)') + '?',
        answer: coefX, tolerance: tolInt, lecture: 2,
        explanation: tex('T(p)=(x' + (a < 0 ? '+' + -a : '-' + a) + ')(p_1+2p_2x)+c\\,p(x)') + ' with ' + tex('p_1=' + p[1] + ',\\ p_2=' + p[2]) + ', so the ' + tex('x') + '-coefficient is ' + tex('p_1-2ap_2+cp_1=' + coefX) + '.',
      },
      {
        prompt: 'The matrix ' + tex("[T]_{B'}") + ' of ' + tex('T') + ' in the basis ' + tex("B'") + ' is similar to ' + tex('[T]_B') + '. Find its trace.',
        answer: trace, tolerance: tolInt, lecture: 2,
        explanation: tex('T') + ' multiplies ' + tex(aTxt + '^k') + ' by ' + tex('k+c') + ', so ' + tex("[T]_{B'}=\\operatorname{diag}(" + c + ',' + (c + 1) + ',' + (c + 2) + ')') + ' with trace ' + tex(trace) + '. (The same trace comes from the diagonal of ' + tex('[T]_B') + '.)',
      },
      {
        prompt: 'Let ' + tex('q(x)=' + poly(q)) + '. Since ' + tex('T') + ' is invertible there is a unique ' + tex('p\\in P_2') + ' with ' + tex('T(p)=q') + '. Find ' + tex('p(' + a + ')') + ' to 3 decimal places.',
        answer: pa, tolerance: tol3, lecture: 2,
        explanation: 'Evaluate ' + tex('T(p)=q') + ' at ' + tex('x=' + a) + ': the term with ' + tex('p\'') + ' vanishes, leaving ' + tex('c\\,p(' + a + ')=q(' + a + ')=' + qa) + ', so ' + tex('p(' + a + ')=' + dec(qa) + '/' + (c < 0 ? '(' + c + ')' : c) + '=' + dec(pa)) + '.',
      },
      {
        prompt: tex('T') + ' has an eigenvector of the form ' + tex('x^2+\\beta x+\\gamma') + ' (monic, degree 2). Find ' + tex('\\gamma') + '.',
        answer: gamma, tolerance: tolInt, lecture: 3,
        explanation: 'The eigenvectors of ' + tex('T') + ' are the basis vectors of ' + tex("B'") + ': ' + tex(aTxt + '^2=x^2' + (a < 0 ? '+' + -2 * a : '-' + 2 * a) + 'x+' + a * a) + ' has eigenvalue ' + tex(c + 2) + ', so ' + tex('\\gamma=a^2=' + gamma) + '.',
      },
    ],
  }
}

export const build = (prm: Params): LQInstance => fixZero(buildRaw(prm))

export const genA: LQGenerator = { id: 'la2-lq-a-spaces', generate: (rng) => build(sample(rng)) }
