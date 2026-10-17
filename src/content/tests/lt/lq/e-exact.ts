// LQ-E: exact empirical Rademacher complexities, the Jensen bound, a margin error and the number of boosting rounds.
// Lectures 4 (Rademacher complexity), 5 (margin theory), 6 (boosting).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4, tolInt } from '../../../shared/format'

export interface Params { m: number; h: number[]; B: number; xs: [number, number][]; vals: number[]; gamma: number; n: number; g: number }

export function sample(rng: Rng): Params {
  const m = rng.int(4, 9)
  const xs: [number, number][] = []
  while (xs.length < 3) {
    const x: [number, number] = [rng.int(-4, 4), rng.int(-4, 4)]
    if (x[0] !== 0 || x[1] !== 0) xs.push(x)
  }
  const gamma = rng.pick([0.5, 1, 1.5])
  const vals: number[] = []
  while (vals.length < 10) {
    const v = rng.int(-30, 200) / 100
    if (Math.abs(v - gamma) > 1e-9) vals.push(v)
  }
  for (;;) {
    const n = rng.pick([100, 200, 500, 1000, 5000])
    const g = rng.pick([0.05, 0.1, 0.15, 0.2, 0.25])
    const T = Math.log(n) / (2 * g * g)
    if (Math.abs(T - Math.round(T)) > 0.05) return { m, h: Array.from({ length: m }, () => rng.pick([-1, 1])), B: rng.pick([1, 2, 3]), xs, vals, gamma, n, g }
  }
}

export function build({ m, h, B, xs, vals, gamma, n, g }: Params): LQInstance {
  // part 1: enumerate all sign vectors; the class is {h, -h}
  let tot = 0
  for (let mask = 0; mask < 2 ** m; mask++) {
    let s = 0
    for (let i = 0; i < m; i++) s += (mask >> i & 1 ? 1 : -1) * h[i]
    tot += Math.abs(s) / m
  }
  const rad = tot / 2 ** m
  // part 2: the sup over the ball is B||sum sigma_i x_i||; average over the four patterns with sigma_1 = +1
  let sum = 0
  for (const [s2, s3] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    sum += Math.hypot(xs[0][0] + s2 * xs[1][0] + s3 * xs[2][0], xs[0][1] + s2 * xs[1][1] + s3 * xs[2][1])
  }
  const exact = (B * sum) / 4 / 3
  const jensen = (B * Math.sqrt(xs.reduce((t, x) => t + x[0] * x[0] + x[1] * x[1], 0))) / 3
  const marginErr = vals.filter((v) => v < gamma).length / vals.length
  const T = Math.floor(Math.log(n) / (2 * g * g)) + 1
  const hv = tex('h=(' + h.map((x) => (x > 0 ? '+1' : '-1')).join(',') + ')')

  return {
    intro: 'Give answers to 4 decimal places unless told otherwise. Use natural logarithms.',
    parts: [
      {
        prompt: 'The class is ' + tex('\\{h,-h\\}') + ' with ' + hv + ' on ' + tex('m=' + m) + ' sample points. Find its empirical Rademacher complexity ' + tex('\\mathbb E_\\sigma\\sup_{f}\\frac1m\\sum_i\\sigma_if(x_i)') + '.',
        answer: rad, tolerance: tol4, lecture: 4,
        explanation: 'The supremum is ' + tex('|\\sum_i\\sigma_ih_i|/m') + ', and ' + tex('\\sigma_ih_i') + ' are again independent random signs, so the value is ' + tex('\\mathbb E|S_{' + m + '}|/' + m + '=' + dec(rad)) + '.',
      },
      {
        prompt: 'The class is ' + tex('\\{x\\mapsto\\langle w,x\\rangle:\\|w\\|_2\\le' + B + '\\}') + ' and the sample is ' + xs.map((x) => tex('(' + x[0] + ',' + x[1] + ')')).join(', ') + '. Using ' + tex('\\sup_{\\|w\\|\\le B}\\langle w,v\\rangle=B\\|v\\|') + ', find the empirical Rademacher complexity exactly. (By symmetry, only the four sign patterns with ' + tex('\\sigma_1=+1') + ' are needed.)',
        answer: exact, tolerance: tol4, lecture: 4,
        explanation: 'With ' + tex('v=\\sum\\sigma_ix_i') + ': ' + tex('\\|x_1\\pm x_2\\pm x_3\\|') + ' takes four values with sum ' + tex(dec(sum)) + '. The result is ' + tex(B + '\\times' + dec(sum) + '/(4\\times3)=' + dec(exact)) + '.',
      },
      {
        prompt: 'For the same class and sample, evaluate the upper bound ' + tex('\\dfrac Bm\\sqrt{\\sum_i\\|x_i\\|^2}') + ' that follows from Jensen\'s inequality.',
        answer: jensen, tolerance: tol4, lecture: 4,
        explanation: tex('\\sum\\|x_i\\|^2=' + xs.reduce((t, x) => t + x[0] * x[0] + x[1] * x[1], 0)) + ', so the bound is ' + tex(B + '\\sqrt{' + xs.reduce((t, x) => t + x[0] * x[0] + x[1] * x[1], 0) + '}/3=' + dec(jensen)) + ' (it is at least the exact value from the previous part).',
      },
      {
        prompt: 'The margins ' + tex('y_if(x_i)') + ' of ten training points are ' + vals.map((v) => tex(dec(v))).join(', ') + '. The empirical margin error at level ' + tex('\\gamma=' + dec(gamma)) + ' is the fraction of points with ' + tex('y_if(x_i)<\\gamma') + '. Find it (3 decimal places).',
        answer: marginErr, tolerance: tol3, lecture: 5,
        explanation: 'Count the margins below ' + tex(dec(gamma)) + ': there are ' + tex(vals.filter((v) => v < gamma).length) + ' of 10, so the margin error is ' + tex(dec(marginErr)) + '. Negative margins are misclassified points and are included.',
      },
      {
        prompt: 'Every round of AdaBoost has edge ' + tex('\\gamma_t=' + dec(g)) + ' on a sample of ' + tex('m=' + n) + ' points. The training error is at most ' + tex('\\exp(-2T\\gamma^2)') + '. Since the training error is a multiple of ' + tex('1/m') + ', it is zero once this bound is below ' + tex('1/m') + '. What is the smallest number of rounds ' + tex('T') + ' that guarantees this?',
        answer: T, tolerance: tolInt, lecture: 6,
        explanation: tex('e^{-2T\\gamma^2}<1/m') + ' means ' + tex('T>\\ln m/(2\\gamma^2)=' + dec(Math.log(n) / (2 * g * g))) + ', so ' + tex('T=' + T) + '.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'lt-lq-e-exact', generate: (rng) => build(sample(rng)) }
