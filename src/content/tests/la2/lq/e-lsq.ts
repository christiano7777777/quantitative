// LQ-E: least squares line fit through the normal equations; fitted values and residual as orthogonal projection.
// Lecture 6 (least squares, orthogonal projection).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { fixZero } from '../util'
import { dec, tex, tol3 } from '../../../shared/format'

const sg = (x: number) => (x < 0 ? '(' + x + ')' : String(x)) // parenthesise negatives inside formulas
const sn = (x: number) => (x < 0 ? '-' + -x : '+' + x) // signed term
export interface Params { t: number[]; y: number[] }

export function sample(rng: Rng): Params {
  for (;;) {
    const n = rng.pick([4, 5]), t0 = rng.pick([-2, -1, 0, 1])
    const t = Array.from({ length: n }, (_, i) => t0 + i)
    const y = Array.from({ length: n }, () => rng.int(0, 9))
    // the data must not lie exactly on a line, and y must not be constant
    const d1 = y.map((v, i) => (i ? v - y[i - 1] : 0)).slice(1)
    if (d1.every((v) => v === d1[0])) continue
    return { t, y }
  }
}

function buildRaw({ t, y }: Params): LQInstance {
  const n = t.length
  const st = t.reduce((s, v) => s + v, 0), stt = t.reduce((s, v) => s + v * v, 0)
  const sy = y.reduce((s, v) => s + v, 0), sty = t.reduce((s, v, i) => s + v * y[i], 0)
  const det = n * stt - st * st
  const c1 = (n * sty - st * sy) / det
  const c0 = (sy - c1 * st) / n
  const tNew = t[n - 1] + 1
  const fit = t.map((v) => c0 + c1 * v)
  const rss = y.reduce((s, v, i) => s + (v - fit[i]) ** 2, 0)
  const fitSq = fit.reduce((s, v) => s + v * v, 0)
  const pts = t.map((v, i) => '(' + v + ',' + y[i] + ')').join(', ')
  return {
    intro: 'Fit the line ' + tex('y=c_0+c_1t') + ' by least squares to the ' + tex(n) + ' data points ' + tex(pts) + '. Give decimals to 3 places.',
    parts: [
      {
        prompt: 'Find the slope ' + tex('c_1') + '.',
        answer: c1, tolerance: tol3, lecture: 6,
        explanation: 'The normal equations are ' + tex(n + 'c_0' + sn(st) + 'c_1=' + sy + ',\\ ' + st + 'c_0+' + stt + 'c_1=' + sty) + '. Eliminating ' + tex('c_0') + ': ' + tex('c_1=(' + n + '\\cdot' + sg(sty) + '-' + sg(st) + '\\cdot' + sy + ')/(' + n + '\\cdot' + stt + '-' + sg(st) + '^2)=' + dec(c1)) + '.',
      },
      {
        prompt: 'Find the intercept ' + tex('c_0') + '.',
        answer: c0, tolerance: tol3, lecture: 6,
        explanation: 'The first normal equation gives ' + tex('c_0=(' + sy + '-' + sg(Number(dec(c1))) + '\\cdot' + sg(st) + ')/' + n + '=' + dec(c0)) + '.',
      },
      {
        prompt: 'Use the fitted line to predict ' + tex('y') + ' at ' + tex('t=' + tNew) + '.',
        answer: c0 + c1 * tNew, tolerance: tol3, lecture: 6,
        explanation: tex(dec(c0) + '+' + sg(Number(dec(c1))) + '\\cdot' + sg(tNew) + '=' + dec(c0 + c1 * tNew)) + '.',
      },
      {
        prompt: 'Find the residual sum of squares ' + tex('\\|y-X\\hat c\\|^2') + ', where ' + tex('X') + ' has columns ' + tex('(1,\\dots,1)^{\\top}') + ' and ' + tex('(t_1,\\dots,t_n)^{\\top}') + '.',
        answer: rss, tolerance: tol3, lecture: 6,
        explanation: 'Fitted values ' + tex(fit.map((v) => dec(v)).join(',\\ ')) + '; residuals ' + tex(fit.map((v, i) => dec(y[i] - v)).join(',\\ ')) + '; the squares add to ' + tex(dec(rss)) + '.',
      },
      {
        prompt: 'The fitted vector ' + tex('X\\hat c') + ' is the orthogonal projection of ' + tex('y') + ' onto the column space of ' + tex('X') + '. Find its squared length ' + tex('\\|X\\hat c\\|^2') + '.',
        answer: fitSq, tolerance: tol3, lecture: 6,
        explanation: 'By Pythagoras ' + tex('\\|X\\hat c\\|^2=\\|y\\|^2-\\|y-X\\hat c\\|^2=' + y.reduce((s, v) => s + v * v, 0) + '-' + dec(rss) + '=' + dec(fitSq)) + '.',
      },
    ],
  }
}

export const build = (prm: Params): LQInstance => fixZero(buildRaw(prm))

export const genE: LQGenerator = { id: 'la2-lq-e-lsq', generate: (rng) => build(sample(rng)) }
