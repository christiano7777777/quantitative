// LQ-F: Engle-Granger regression slope and residual, an error-correction forecast, spread persistence and half-life.
// Lecture 7 (cointegration, error correction).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params { x: number[]; y: number[]; ay: number; ax: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const beta = rng.pick([1, 1.5, 2])
    const x: number[] = [rng.int(10, 20)]
    while (x.length < 6) x.push(x[x.length - 1] + rng.int(-3, 3))
    const y = x.map((v) => Math.round((beta * v + rng.int(-6, 6) / 2) * 10) / 10)
    const ay = rng.pick([-0.1, -0.2, -0.3, -0.4]), ax = rng.pick([0, 0.05, 0.1])
    const mx = x.reduce((p, v) => p + v, 0) / 6
    const sxx = x.reduce((p, v) => p + (v - mx) ** 2, 0)
    if (sxx < 10) continue
    const phi = 1 + ay - fit(x, y).b * ax
    if (phi > 0.2 && phi < 0.98) return { x, y, ay, ax }
  }
}

export function fit(x: number[], y: number[]) {
  const n = x.length
  const mx = x.reduce((a, v) => a + v, 0) / n, my = y.reduce((a, v) => a + v, 0) / n
  let sxy = 0, sxx = 0
  for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2 }
  const b = sxy / sxx
  return { b, a: my - b * mx }
}

export function build({ x, y, ay, ax }: Params): LQInstance {
  const { b, a } = fit(x, y)
  const e = y[5] - a - b * x[5]
  const dy = ay * e
  const phi = 1 + ay - b * ax
  const half = Math.log(0.5) / Math.log(phi)

  return {
    intro:
      'Two price series (levels) observed on six days are ' + tex('x=(' + x.join(',') + ')') + ' and ' + tex('y=(' + y.map(dec).join(',') + ')') + '. First regress ' + tex('y_t=a+bx_t+e_t') + ' by least squares (the Engle-Granger first step). Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the least squares slope ' + tex('\\hat b') + '.',
        answer: b, tolerance: tol4, lecture: 7,
        explanation: tex('\\hat b=\\sum(x_t-\\bar x)(y_t-\\bar y)/\\sum(x_t-\\bar x)^2') + ' = ' + dec(b) + '.',
      },
      {
        prompt: 'Find the residual ' + tex('\\hat e_6=y_6-\\hat a-\\hat bx_6') + ' on the last day (the spread, to be tested for a unit root in the second step).',
        answer: e, tolerance: tol4, lecture: 7,
        explanation: tex('\\hat a=' + dec(a)) + ', so ' + tex('\\hat e_6=' + dec(y[5]) + '-' + dec(a) + '-' + dec(b) + '\\cdot' + x[5]) + ' = ' + dec(e) + '.',
      },
      {
        prompt: 'In the error-correction model ' + tex('\\Delta y_{t+1}=\\alpha_y\\hat e_t+\\dots') + ' the adjustment speed is ' + tex('\\alpha_y=' + dec(ay)) + '. Find the expected change ' + tex('\\Delta y_7') + ' attributable to the error-correction term at ' + tex('t=6') + '.',
        answer: dy, tolerance: tol4, lecture: 7,
        explanation: tex(dec(ay) + '\\cdot' + dec(e)) + ' = ' + dec(dy) + ': ' + (dy * e < 0 ? 'the series moves back towards the long-run relation.' : 'the spread is zero.'),
      },
      {
        prompt: 'If also ' + tex('\\Delta x_{t+1}=\\alpha_x\\hat e_t+\\dots') + ' with ' + tex('\\alpha_x=' + dec(ax)) + ', the spread ' + tex('z_t=y_t-\\hat bx_t') + ' follows ' + tex('z_{t+1}=\\phi z_t') + ' with ' + tex('\\phi=1+\\alpha_y-\\hat b\\alpha_x') + '. Find ' + tex('\\phi') + '.',
        answer: phi, tolerance: tol4, lecture: 7,
        explanation: tex('z_{t+1}=z_t+\\Delta y_{t+1}-\\hat b\\Delta x_{t+1}=(1+\\alpha_y-\\hat b\\alpha_x)z_t') + ' = ' + dec(phi) + ', inside the unit circle, so the spread is stationary.',
      },
      {
        prompt: 'Find the half-life of a deviation of the spread, ' + tex('\\ln(0.5)/\\ln\\phi') + ' days (3 decimal places).',
        answer: half, tolerance: tol3, lecture: 7,
        explanation: tex('\\phi^{h}=0.5') + ' gives ' + tex('h=\\ln0.5/\\ln' + dec(phi)) + ' = ' + dec(half) + '.',
      },
    ],
  }
}

export const genF: LQGenerator = { id: 'ts2-lq-f-cointegration', generate: (rng) => build(sample(rng)) }
