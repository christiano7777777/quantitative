// np lecture 10 (kernel density estimation): one story. Five observations: Silverman's bandwidth, a Gaussian-kernel density estimate and a
// box-kernel estimate at a point, and how the optimal bandwidth shrinks with the sample size.
// Lecture 10.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { x: number[]; t: number; h: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const x = rng.sample(Array.from({ length: 16 }, (_, i) => i + 1), 5)
    const t = rng.int(4, 12)
    const h = rng.pick([1.5, 2, 2.5, 3])
    if (x.some((v) => Math.abs(v - t) <= h)) return { x, t, h }
  }
}

const phi = (u: number) => Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI)

export function build({ x, t, h }: Params): LQInstance {
  const n = x.length
  const mean = x.reduce((a, b) => a + b, 0) / n
  const sd = Math.sqrt(x.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1))
  const silver = 1.06 * sd * n ** -0.2
  const gauss = x.reduce((s, v) => s + phi((t - v) / h), 0) / (n * h)
  const inWin = x.filter((v) => Math.abs(v - t) <= h).length
  const box = inWin / (2 * n * h)
  const hNew = h * (n / 160) ** 0.2

  return {
    intro: 'Five observations are ' + tex(x.join(',\\ ')) + '. A kernel density estimate is ' + tex('\\hat f(t)=\\dfrac{1}{nh}\\sum_{i=1}^nK\\!\\left(\\dfrac{t-x_i}{h}\\right)') + ' with bandwidth ' + tex('h') + ' and kernel ' + tex('K') + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the sample standard deviation ' + tex('s') + ' (divisor ' + tex(n - 1) + ').',
        answer: sd, tolerance: tol4, lecture: 10,
        explanation: tex('\\bar x=' + dec(mean)) + ' and ' + tex('s=' + dec(sd)) + '.',
      },
      {
        prompt: 'Silverman\'s rule of thumb for a Gaussian kernel is ' + tex('h=1.06\\,s\\,n^{-1/5}') + '. Find it.',
        answer: silver, tolerance: tol4, lecture: 10,
        explanation: tex('1.06\\times' + dec(sd) + '\\times' + n + '^{-1/5}') + ' = ' + dec(silver) + '.',
      },
      {
        prompt: 'Using the Gaussian kernel ' + tex('K(u)=e^{-u^2/2}/\\sqrt{2\\pi}') + ' and the bandwidth ' + tex('h=' + dec(h)) + ', find ' + tex('\\hat f(' + t + ')') + '.',
        answer: gauss, tolerance: tol4, lecture: 10,
        explanation: 'The scaled distances ' + tex('(t-x_i)/h') + ' are ' + x.map((v) => dec((t - v) / h)).join(', ') + ', with kernel values ' + x.map((v) => dec(phi((t - v) / h))).join(', ') + '. Their sum divided by ' + tex(n + '\\times' + dec(h)) + ' is ' + dec(gauss) + '.',
      },
      {
        prompt: 'With the box kernel ' + tex('K(u)=\\tfrac12\\mathbf 1\\{|u|\\le1\\}') + ' and the same ' + tex('h=' + dec(h)) + ', find ' + tex('\\hat f(' + t + ')') + '.',
        answer: box, tolerance: tol4, lecture: 10,
        explanation: inWin + ' observation(s) lie within ' + tex(dec(h)) + ' of ' + tex(t) + ', so ' + tex('\\hat f(' + t + ')=' + inWin + '/(2\\times' + n + '\\times' + dec(h) + ')') + ' = ' + dec(box) + '.',
      },
      {
        prompt: 'The bandwidth that minimises the asymptotic mean integrated squared error shrinks like ' + tex('n^{-1/5}') + '. If the sample size grows from ' + tex(n) + ' to ' + tex(160) + ', what bandwidth replaces ' + tex('h=' + dec(h)) + '?',
        answer: hNew, tolerance: tol4, lecture: 10,
        explanation: tex(dec(h) + '\\times(' + n + '/160)^{1/5}=' + dec(h) + '\\times(1/32)^{1/5}=' + dec(h) + '/2') + ' = ' + dec(hNew) + '. A smaller bandwidth lowers bias and raises variance; more data can afford it.',
      },
    ],
  }
}

export const genLec10: LQGenerator = { id: 'np-lq-lec10', generate: (rng) => build(sample(rng)) }
