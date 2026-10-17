// LQ-C: empirical Rademacher complexity of two hypotheses, the linear-class bound, the geometric margin, a margin bound and an AdaBoost vote weight.
// Lectures 4 (Rademacher complexity), 5 (margin theory), 6 (boosting).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params {
  h1: number[]; h2: number[]
  B: number; R: number; n: number
  w: [number, number]; b: number; pts: [number, number][]; ys: number[]
  err: number; gam: number; R2: number; n2: number; delta: number
  eps: number
}

const WS: [number, number][] = [[3, 4], [4, 3], [5, 12], [12, 5], [6, 8], [8, 6], [8, 15], [15, 8]]

export function sample(rng: Rng): Params {
  const m = rng.int(4, 5)
  let h1: number[], h2: number[]
  do {
    h1 = Array.from({ length: m }, () => rng.pick([-1, 1]))
    h2 = Array.from({ length: m }, () => rng.pick([-1, 1]))
  } while (h1.filter((v, i) => v !== h2[i]).length < 2)
  const w = rng.pick(WS)
  let b: number, pts: [number, number][], ys: number[]
  for (;;) {
    b = rng.int(-6, 6)
    pts = Array.from({ length: 3 }, () => [rng.int(-6, 6), rng.int(-6, 6)] as [number, number])
    const s = pts.map(([x, y]) => w[0] * x + w[1] * y + b)
    if (s.some((v) => v === 0)) continue
    if (new Set(pts.map((p) => p.join(','))).size < 3) continue
    ys = s.map((v) => (v > 0 ? 1 : -1))
    break
  }
  return {
    h1, h2, B: rng.pick([2, 3, 4, 5]), R: rng.pick([1, 2, 3, 5]), n: rng.pick([100, 400, 900, 2500, 10000]),
    w, b, pts, ys,
    err: rng.int(2, 12) / 100, gam: rng.pick([0.5, 1, 2]), R2: rng.pick([1, 2, 4, 5]), n2: rng.pick([1000, 4000, 10000, 40000]), delta: rng.pick([0.01, 0.05]),
    eps: rng.int(5, 40) / 100,
  }
}

export function build(p: Params): LQInstance {
  const m = p.h1.length
  // part 1: enumerate every sign vector
  let total = 0
  for (let mask = 0; mask < 2 ** m; mask++) {
    const s = Array.from({ length: m }, (_, i) => (mask >> i & 1 ? 1 : -1))
    const a = s.reduce((t, v, i) => t + v * p.h1[i], 0), c = s.reduce((t, v, i) => t + v * p.h2[i], 0)
    total += Math.max(a, c) / m
  }
  const rad = total / 2 ** m
  const bound = (p.B * p.R) / Math.sqrt(p.n)
  const wn = Math.hypot(p.w[0], p.w[1])
  const marg = Math.min(...p.pts.map(([x, y], i) => (p.ys[i] * (p.w[0] * x + p.w[1] * y + p.b)) / wn))
  const gb = p.err + (2 * p.R2) / (p.gam * Math.sqrt(p.n2)) + Math.sqrt(Math.log(1 / p.delta) / (2 * p.n2))
  const alpha = 0.5 * Math.log((1 - p.eps) / p.eps)
  const vec = (v: number[]) => tex('(' + v.map((x) => (x > 0 ? '+1' : '-1')).join(',') + ')')
  const dis = p.h1.filter((v, i) => v !== p.h2[i]).length

  return {
    intro: 'Give all answers to 4 decimal places.',
    parts: [
      {
        prompt: 'A class has two hypotheses whose values on a sample of ' + tex(m) + ' points are ' + tex('h_1=') + vec(p.h1) + ' and ' + tex('h_2=') + vec(p.h2) + '. Find its empirical Rademacher complexity ' + tex('\\mathbb E_\\sigma\\max_{h}\\frac1m\\sum_i\\sigma_ih(x_i)') + ' over uniform random signs ' + tex('\\sigma\\in\\{\\pm1\\}^{' + m + '}') + '.',
        answer: rad, tolerance: tol4, lecture: 4,
        explanation: 'The hypotheses disagree on ' + tex(dis) + ' points. Use ' + tex('\\max(a,b)=\\tfrac{a+b}{2}+\\tfrac{|a-b|}{2}') + ' with ' + tex('\\mathbb E a=\\mathbb E b=0') + ': the value is ' + tex('\\mathbb E|S_{' + dis + '}|/' + m) + ' with ' + tex('S_k') + ' a sum of ' + tex('k') + ' random signs, which gives ' + tex(dec(rad)) + '.',
      },
      {
        prompt: 'Linear predictors ' + tex('x\\mapsto\\langle w,x\\rangle') + ' with ' + tex('\\|w\\|_2\\le' + p.B) + ' are used on inputs with ' + tex('\\|x\\|_2\\le' + p.R) + ' and ' + tex('m=' + p.n) + ' examples. Evaluate the bound ' + tex('BR/\\sqrt m') + ' on the Rademacher complexity.',
        answer: bound, tolerance: tol4, lecture: 4,
        explanation: tex(p.B + '\\times' + p.R + '/\\sqrt{' + p.n + '}=' + p.B * p.R + '/' + Math.sqrt(p.n) + '=' + dec(bound)) + '. The bound does not depend on the dimension.',
      },
      {
        prompt: 'A linear classifier ' + tex('\\mathrm{sign}(\\langle w,x\\rangle+b)') + ' has ' + tex('w=(' + p.w[0] + ',' + p.w[1] + ')') + ' and ' + tex('b=' + p.b) + '. It is applied to the points ' + p.pts.map(([x, y], i) => tex('(' + x + ',' + y + ')') + ' with label ' + tex(p.ys[i] > 0 ? '+1' : '-1')).join(', ') + '. All are classified correctly. Find the geometric margin of the data set, i.e. the smallest value of ' + tex('y(\\langle w,x\\rangle+b)/\\|w\\|') + '.',
        answer: marg, tolerance: tol4, lecture: 5,
        explanation: tex('\\|w\\|=' + dec(wn)) + '. The values ' + tex('y(\\langle w,x\\rangle+b)') + ' are ' + p.pts.map(([x, y], i) => tex(String(p.ys[i] * (p.w[0] * x + p.w[1] * y + p.b)))).join(', ') + '; the smallest divided by ' + tex(dec(wn)) + ' is ' + tex(dec(marg)) + '.',
      },
      {
        prompt: 'A margin bound states: with probability at least ' + tex('1-\\delta') + ', test error ' + tex('\\le\\hat L_\\gamma+\\dfrac{2R}{\\gamma\\sqrt m}+\\sqrt{\\dfrac{\\ln(1/\\delta)}{2m}}') + ', where ' + tex('\\hat L_\\gamma') + ' is the training margin error. Evaluate the bound for ' + tex('\\hat L_\\gamma=' + dec(p.err) + ',\\ R=' + p.R2 + ',\\ \\gamma=' + dec(p.gam) + ',\\ m=' + p.n2 + ',\\ \\delta=' + dec(p.delta)) + '.',
        answer: gb, tolerance: tol4, lecture: 5,
        explanation: tex('2R/(\\gamma\\sqrt m)=' + dec((2 * p.R2) / (p.gam * Math.sqrt(p.n2)))) + ' and ' + tex('\\sqrt{\\ln(1/\\delta)/(2m)}=' + dec(Math.sqrt(Math.log(1 / p.delta) / (2 * p.n2)))) + '; the sum with ' + tex(dec(p.err)) + ' is ' + tex(dec(gb)) + '.',
      },
      {
        prompt: 'In one round of AdaBoost the weak learner has weighted error ' + tex('\\epsilon_t=' + dec(p.eps)) + '. Find its vote weight ' + tex('\\alpha_t=\\tfrac12\\ln\\{(1-\\epsilon_t)/\\epsilon_t\\}') + '.',
        answer: alpha, tolerance: tol4, lecture: 6,
        explanation: tex('\\alpha_t=\\tfrac12\\ln(' + dec(1 - p.eps) + '/' + dec(p.eps) + ')=\\tfrac12\\ln(' + dec((1 - p.eps) / p.eps) + ')=' + dec(alpha)) + '.',
      },
    ],
  }
}

export const genC: LQGenerator = { id: 'lt-lq-c-complexity', generate: (rng) => build(sample(rng)) }
