// LQ-D: the inner product <f,g> = integral of f g over [lo,hi] on polynomials: norm, angle, projection onto P1, distance.
// Lectures 5 (inner products, norms, angles) and 6 (orthogonal projection).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { fixZero } from '../util'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params { lo: number; f: [number, number]; g: [number, number]; h: [number, number, number] }

/** moment of x^k over [lo, 1]: lo is -1 or 0 */
const mom = (lo: number, k: number) => (1 - lo ** (k + 1)) / (k + 1)
const poly = (c: number[]) => c.map((v, k) => (v === 0 ? '' : (v < 0 ? '-' : '+') + (Math.abs(v) === 1 && k > 0 ? '' : Math.abs(v)) + (k === 0 ? '' : k === 1 ? 'x' : 'x^' + k))).join('').replace(/^\+/, '') || '0'
const ip = (lo: number, f: number[], g: number[]) => f.reduce((s, fi, i) => s + g.reduce((t, gj, j) => t + fi * gj * mom(lo, i + j), 0), 0)

export function sample(rng: Rng): Params {
  const nz = [-3, -2, -1, 1, 2, 3]
  return {
    lo: rng.pick([-1, 0]),
    f: [rng.pick(nz), rng.pick(nz)], g: [rng.int(-3, 3), rng.pick(nz)],
    h: [rng.int(-3, 3), rng.int(-3, 3), rng.pick(nz)],
  }
}

function buildRaw({ lo, f, g, h }: Params): LQInstance {
  // g is the quadratic g0 + g2 x^2 (stored as [g0, g2])
  const gq = [g[0], 0, g[1]]
  const fg = ip(lo, f, gq)
  const nf = Math.sqrt(ip(lo, f, f))
  const ng = Math.sqrt(ip(lo, gq, gq))
  const cosv = fg / (nf * ng)
  // projection of h onto span{1, x}: solve the 2x2 normal equations
  const m0 = mom(lo, 0), m1 = mom(lo, 1), m2 = mom(lo, 2)
  const r0 = ip(lo, h, [1]), r1 = ip(lo, h, [0, 1])
  const det = m0 * m2 - m1 * m1
  const al = (r0 * m2 - r1 * m1) / det, be = (m0 * r1 - m1 * r0) / det
  const res = [h[0] - al, h[1] - be, h[2]]
  const dist = Math.sqrt(ip(lo, res, res))
  const I = lo === -1 ? '\\int_{-1}^{1}' : '\\int_{0}^{1}'
  return {
    intro: 'On the real polynomials define ' + tex('\\langle f,g\\rangle=' + I + ' f(x)g(x)\\,dx') + '. You may use ' + tex(lo === -1 ? '\\int_{-1}^1x^k\\,dx=0' : '\\int_0^1x^k\\,dx=\\frac1{k+1}') + (lo === -1 ? ' for odd ' + tex('k') + ' and ' + tex('\\frac{2}{k+1}') + ' for even ' + tex('k') : '') + '. Give decimals to 3 places.',
    parts: [
      {
        prompt: 'Let ' + tex('f(x)=' + poly(f)) + ' and ' + tex('g(x)=' + poly(gq)) + '. Compute ' + tex('\\langle f,g\\rangle') + '.',
        answer: fg, tolerance: tol3, lecture: 5,
        explanation: 'Expand the product and integrate term by term, using the moments ' + tex('m_k=\\int x^k\\,dx') + ' (' + tex('m_0=' + dec(mom(lo, 0)) + ',\\ m_1=' + dec(mom(lo, 1)) + ',\\ m_2=' + dec(mom(lo, 2)) + ',\\ m_3=' + dec(mom(lo, 3))) + '): ' + tex('\\langle f,g\\rangle=f_0g_0m_0+f_0g_2m_2+f_1g_0m_1+f_1g_2m_3=' + dec(fg)) + '.',
      },
      {
        prompt: 'Compute the norm ' + tex('\\|f\\|=\\sqrt{\\langle f,f\\rangle}') + ' of the same ' + tex('f') + '.',
        answer: nf, tolerance: tol3, lecture: 5,
        explanation: tex('\\langle f,f\\rangle=' + dec(nf * nf)) + ', so ' + tex('\\|f\\|=' + dec(nf)) + '.',
      },
      {
        prompt: 'Find the cosine of the angle between ' + tex('f') + ' and ' + tex('g') + '.',
        answer: cosv, tolerance: tol3, lecture: 5,
        explanation: tex('\\cos\\theta=\\langle f,g\\rangle/(\\|f\\|\\|g\\|)=' + dec(fg) + '/(' + dec(nf) + '\\cdot' + dec(ng) + ')=' + dec(cosv)) + '. It lies in ' + tex('[-1,1]') + ', as Cauchy-Schwarz requires.',
      },
      {
        prompt: 'Let ' + tex('h(x)=' + poly(h)) + ' and let ' + tex('p') + ' be its orthogonal projection onto the subspace ' + tex('\\operatorname{span}\\{1,x\\}') + '. Find ' + tex('p(1)') + '.',
        answer: al + be, tolerance: tol3, lecture: 6,
        explanation: 'Write ' + tex('p=\\alpha+\\beta x') + ' and require ' + tex('\\langle h-p,1\\rangle=\\langle h-p,x\\rangle=0') + ': ' + tex(dec(m0) + '\\alpha+' + dec(m1) + '\\beta=' + dec(r0) + ',\\ ' + dec(m1) + '\\alpha+' + dec(m2) + '\\beta=' + dec(r1)) + '. Hence ' + tex('\\alpha=' + dec(al) + ',\\ \\beta=' + dec(be)) + ' and ' + tex('p(1)=' + dec(al + be)) + '.',
      },
      {
        prompt: 'Find the distance ' + tex('\\|h-p\\|') + ' from ' + tex('h') + ' to the subspace ' + tex('\\operatorname{span}\\{1,x\\}') + ' (the same ' + tex('h') + ' and ' + tex('p') + ').',
        answer: dist, tolerance: tol3, lecture: 6,
        explanation: tex('h-p=' + poly(res.map((x) => Number(x.toFixed(6))))) + ' is orthogonal to ' + tex('1') + ' and ' + tex('x') + ', and ' + tex('\\|h-p\\|^2=\\langle h-p,h-p\\rangle=' + dec(dist * dist)) + ', so the distance is ' + tex(dec(dist)) + '.',
      },
    ],
  }
}

export const build = (prm: Params): LQInstance => fixZero(buildRaw(prm))

export const genD: LQGenerator = { id: 'la2-lq-d-inner', generate: (rng) => build(sample(rng)) }
