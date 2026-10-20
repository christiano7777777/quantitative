// np lecture 11 (nonparametric regression): one story. Six (x, y) points and the fit at one x0: points in the window, Nadaraya-Watson
// with a box kernel and with a Gaussian kernel, a local linear fit, and a tricube weight.
// Lecture 11.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { x: number[]; y: number[]; x0: number; h: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const x = rng.sample(Array.from({ length: 12 }, (_, i) => i + 1), 6).sort((a, b) => a - b)
    const y = x.map((v) => Math.round(2 + 1.5 * v + rng.int(-3, 3)))
    const x0 = rng.int(4, 9)
    const h = rng.pick([2, 3])
    const inWin = x.filter((v) => Math.abs(v - x0) <= h)
    // the farthest point in the window must lie strictly inside it, so that its tricube weight is not 0
    if (inWin.length >= 3 && inWin.length <= 5 && Math.max(...inWin.map((v) => Math.abs(v - x0))) < h) return { x, y, x0, h }
  }
}

const phi = (u: number) => Math.exp(-0.5 * u * u)
/** A signed term for an explanation: '+1.5000' or '-1.5000'. */
const signed = (v: number) => (v < 0 ? '-' + dec(-v) : '+' + dec(v))

export function build({ x, y, x0, h }: Params): LQInstance {
  const idx = x.map((v, i) => i).filter((i) => Math.abs(x[i] - x0) <= h)
  const k = idx.length
  const nwBox = idx.reduce((s, i) => s + y[i], 0) / k
  const w = x.map((v) => phi((v - x0) / h))
  const nwGauss = x.reduce((s, _, i) => s + w[i] * y[i], 0) / w.reduce((a, b) => a + b, 0)
  // local linear with a box kernel: ordinary least squares on the points in the window, evaluated at x0
  const mx = idx.reduce((s, i) => s + x[i], 0) / k, my = idx.reduce((s, i) => s + y[i], 0) / k
  const slope = idx.reduce((s, i) => s + (x[i] - mx) * (y[i] - my), 0) / idx.reduce((s, i) => s + (x[i] - mx) ** 2, 0)
  const local = my + slope * (x0 - mx)
  const far = idx.reduce((best, i) => (Math.abs(x[i] - x0) > Math.abs(x[best] - x0) ? i : best), idx[0])
  const u = Math.abs(x[far] - x0) / h
  const tricube = (1 - u ** 3) ** 3

  return {
    intro: 'A scientist records the response ' + tex('y') + ' at six settings ' + tex('x') + ': ' + x.map((v, i) => tex('(' + v + ',' + y[i] + ')')).join(', ') + '. She wants to estimate the mean response at ' + tex('x_0=' + x0) + ' without assuming a functional form, using a window of half-width ' + tex('h=' + h) + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'How many observations have ' + tex('|x_i-x_0|\\le h') + '? Give a whole number.',
        answer: k, tolerance: tolInt, lecture: 11,
        explanation: 'The points with ' + tex('x') + ' in ' + tex('[' + (x0 - h) + ',' + (x0 + h) + ']') + ' are ' + idx.map((i) => '(' + x[i] + ',' + y[i] + ')').join(', ') + ': ' + tex(k) + ' of them.',
      },
      {
        prompt: 'Nadaraya-Watson with a box kernel is the average of ' + tex('y_i') + ' over the points in the window. Find ' + tex('\\hat m(x_0)') + '.',
        answer: nwBox, tolerance: tol4, lecture: 11,
        explanation: tex('(' + idx.map((i) => y[i]).join('+') + ')/' + k) + ' = ' + dec(nwBox) + '.',
      },
      {
        prompt: 'Now fit a straight line by ordinary least squares to the points in the window (a local linear fit with a box kernel) and evaluate it at ' + tex('x_0') + '. Find the fitted value.',
        answer: local, tolerance: tol4, lecture: 11,
        explanation: 'In the window ' + tex('\\bar x=' + dec(mx) + ',\\ \\bar y=' + dec(my)) + ' and slope ' + dec(slope) + ', so the fit at ' + tex('x_0') + ' is ' + tex(dec(my) + signed(slope) + '\\times(' + x0 + '-' + dec(mx) + ')') + ' = ' + dec(local) + '. A local linear fit removes the boundary and slope bias of the local average.',
      },
      {
        prompt: 'Nadaraya-Watson with a Gaussian kernel weights every point by ' + tex('w_i=e^{-(x_i-x_0)^2/(2h^2)}') + ': ' + tex('\\hat m(x_0)=\\sum w_iy_i/\\sum w_i') + '. Find it.',
        answer: nwGauss, tolerance: tol4, lecture: 11,
        explanation: 'The weights are ' + w.map(dec).join(', ') + ' (sum ' + dec(w.reduce((a, b) => a + b, 0)) + '), so ' + tex('\\hat m(x_0)=' + dec(nwGauss)) + '. Points far from ' + tex('x_0') + ' still count a little.',
      },
      {
        prompt: 'LOESS weights by the tricube function ' + tex('(1-|u|^3)^3') + ' with ' + tex('u=|x_i-x_0|/h') + '. Find the weight of the point in the window farthest from ' + tex('x_0') + ', ' + tex('x=' + x[far]) + '.',
        answer: tricube, tolerance: tol4, lecture: 11,
        explanation: tex('u=|' + x[far] + '-' + x0 + '|/' + h + '=' + dec(u)) + ', so the weight is ' + tex('(1-' + dec(u ** 3) + ')^3') + ' = ' + dec(tricube) + '.',
      },
    ],
  }
}

export const genLec11: LQGenerator = { id: 'np-lq-lec11', generate: (rng) => build(sample(rng)) }
