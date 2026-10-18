// LQ-H: product measure and iterated integrals: areas of unions of rectangles, Fubini on polynomials, a triangle, the classic failure of Fubini, and Cavalieri slices.
// Lecture 10 (integration on measure spaces).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Rect { x0: number; x1: number; y0: number; y1: number }
export interface Params { r1: Rect; r2: Rect; a: number; b: number; m: number; n: number; c: number; ta: number; tm: number; tn: number; k: number; order: number; A: number; B: number; s: number }

const rect = (rng: Rng): Rect => {
  const x0 = rng.int(0, 5), y0 = rng.int(0, 5)
  return { x0, x1: x0 + rng.int(2, 5), y0, y1: y0 + rng.int(2, 5) }
}

export function sample(rng: Rng): Params {
  const A = rng.int(2, 6), B = rng.int(2, 6)
  return {
    r1: rect(rng), r2: rect(rng), a: rng.int(1, 4), b: rng.int(1, 4), m: rng.int(1, 3), n: rng.int(1, 3), c: rng.int(1, 5),
    ta: rng.int(1, 4), tm: rng.int(0, 3), tn: rng.int(0, 3), k: rng.int(1, 4), order: rng.int(0, 1), A, B, s: rng.int(1, A + B - 1),
  }
}

export function build({ r1, r2, a, b, m, n, c, ta, tm, tn, k, order, A, B, s }: Params): LQInstance {
  const area = (r: Rect) => (r.x1 - r.x0) * (r.y1 - r.y0)
  const ox = Math.max(0, Math.min(r1.x1, r2.x1) - Math.max(r1.x0, r2.x0))
  const oy = Math.max(0, Math.min(r1.y1, r2.y1) - Math.max(r1.y0, r2.y0))
  const union = area(r1) + area(r2) - ox * oy
  const poly = (a ** (m + 1) * b ** (n + 1)) / ((m + 1) * (n + 1)) + c * a * b
  const tri = ta ** (tm + tn + 2) / ((tn + 1) * (tm + tn + 2))
  const fub = (order === 0 ? 1 : -1) * k * Math.PI / 4
  // area of {x + y <= s} in [0,A]x[0,B], by the three cases for s relative to the shorter and longer side
  const exactSlab = s <= Math.min(A, B) ? (s * s) / 2 : s <= Math.max(A, B) ? (s * Math.min(A, B)) - (Math.min(A, B) ** 2) / 2 : A * B - (A + B - s) ** 2 / 2
  const rtex = (r: Rect) => '[' + r.x0 + ',' + r.x1 + ']\\times[' + r.y0 + ',' + r.y1 + ']'
  const f = k === 1 ? '' : String(k)
  const fc = k === 1 ? '' : k + '\\cdot'

  return {
    intro: 'Let ' + tex('\\lambda^2') + ' be Lebesgue measure on ' + tex('\\mathbb R^2') + ' (the product of two copies of one-dimensional Lebesgue measure). Give every answer to 4 decimal places.',
    parts: [
      {
        prompt: 'Find ' + tex('\\lambda^2(R_1\\cup R_2)') + ' for the rectangles ' + tex('R_1=' + rtex(r1)) + ' and ' + tex('R_2=' + rtex(r2)) + '.',
        answer: union, tolerance: tol4, lecture: 10,
        explanation: tex('\\lambda^2(R_i)') + ' is the product of the side lengths: ' + tex(String(area(r1))) + ' and ' + tex(String(area(r2))) + '. The overlap is a rectangle of sides ' + tex(ox + '\\times' + oy) + ', so ' + tex('\\lambda^2(R_1\\cup R_2)=' + area(r1) + '+' + area(r2) + '-' + ox * oy + '=' + union) + '.',
      },
      {
        prompt: 'Use Fubini\'s theorem to evaluate ' + tex('\\int_0^{' + a + '}\\!\\int_0^{' + b + '}\\big(x^{' + m + '}y^{' + n + '}+' + c + '\\big)\\,dy\\,dx') + '.',
        answer: poly, tolerance: tol4, lecture: 10,
        explanation: 'The integrand is continuous and bounded on a rectangle of finite measure, so the order does not matter: ' + tex('\\frac{' + a + '^{' + (m + 1) + '}}{' + (m + 1) + '}\\cdot\\frac{' + b + '^{' + (n + 1) + '}}{' + (n + 1) + '}+' + c + '\\cdot' + a + '\\cdot' + b + '=' + dec(poly)) + '.',
      },
      {
        prompt: 'Find ' + tex('\\iint_T x^{' + tm + '}y^{' + tn + '}\\,d\\lambda^2') + ' over the triangle ' + tex('T=\\{(x,y):0\\le y\\le x\\le' + ta + '\\}') + '.',
        answer: tri, tolerance: tol4, lecture: 10,
        explanation: 'By Tonelli integrate ' + tex('y') + ' from 0 to ' + tex('x') + ' first: ' + tex('\\int_0^{' + ta + '}x^{' + tm + '}\\frac{x^{' + (tn + 1) + '}}{' + (tn + 1) + '}dx=\\frac{' + ta + '^{' + (tm + tn + 2) + '}}{' + (tn + 1) + '(' + (tm + tn + 2) + ')}=' + dec(tri)) + '.',
      },
      {
        prompt: 'Let ' + tex('f(x,y)=' + f + '\\,\\dfrac{x^2-y^2}{(x^2+y^2)^2}') + ' on ' + tex('(0,1)^2') + '. Evaluate the iterated integral ' + (order === 0 ? tex('\\int_0^1\\Big(\\int_0^1f(x,y)\\,dy\\Big)dx') + ' (inner integral over ' + tex('y') + ')' : tex('\\int_0^1\\Big(\\int_0^1f(x,y)\\,dx\\Big)dy') + ' (inner integral over ' + tex('x') + ')') + '. (The two orders give different answers, because ' + tex('f') + ' is not integrable on the square.)',
        answer: fub, tolerance: tol4, lecture: 10,
        explanation: order === 0
          ? 'Since ' + tex('\\frac{\\partial}{\\partial y}\\frac{y}{x^2+y^2}=\\frac{x^2-y^2}{(x^2+y^2)^2}') + ', the inner integral is ' + tex(fc + '\\frac1{1+x^2}') + ' and the outer integral is ' + tex(fc + '\\frac\\pi4=' + dec(fub)) + '.'
          : 'Since ' + tex('\\frac{\\partial}{\\partial x}\\frac{x}{x^2+y^2}=\\frac{y^2-x^2}{(x^2+y^2)^2}') + ', the inner integral over ' + tex('x') + ' is ' + tex('-' + fc + '\\frac1{1+y^2}') + ' and the outer integral is ' + tex('-' + fc + '\\frac\\pi4=' + dec(fub)) + '.',
      },
      {
        prompt: 'Let ' + tex('E=\\{(x,y)\\in[0,' + A + ']\\times[0,' + B + ']:x+y\\le' + s + '\\}') + '. Use the slices ' + tex('E_x=\\{y:(x,y)\\in E\\}') + ' (Cavalieri) to find ' + tex('\\lambda^2(E)=\\int\\lambda(E_x)\\,dx') + '.',
        answer: exactSlab, tolerance: tol4, lecture: 10,
        explanation: 'The slice at ' + tex('x') + ' has length ' + tex('\\min\\{' + B + ',\\max\\{0,' + s + '-x\\}\\}') + '; integrating over ' + tex('[0,' + A + ']') + ' (a piecewise linear function) gives ' + tex(dec(exactSlab)) + '.',
      },
    ],
  }
}

export const genH: LQGenerator = { id: 'ra-lq-h-fubini', generate: (rng) => build(sample(rng)) }
