// LQ-H: ACF of a multiplicative seasonal MA, the airline-type model (lecture 9), AIC and BIC comparison of two fitted models (lecture 10).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol2, tol3 } from '../../../shared/format'

export interface Params { s: number; theta: number; Theta: number; n: number; v1: number; v2: number; k1: number; k2: number }

export function sample(rng: Rng): Params {
  const v1 = rng.int(20, 40) / 10
  const k1 = rng.pick([2, 3])
  return {
    s: rng.pick([4, 12]), theta: rng.pick([-1, 1]) * rng.int(2, 8) / 10, Theta: rng.pick([-1, 1]) * rng.int(3, 8) / 10,
    n: rng.pick([96, 120, 144, 200]), v1, v2: v1 - rng.int(1, 8) / 10, k1, k2: k1 + rng.int(1, 3),
  }
}

export function build({ s, theta, Theta, n, v1, v2, k1, k2 }: Params): LQInstance {
  const r1 = theta / (1 + theta * theta)
  const rs = Theta / (1 + Theta * Theta)
  const rs1 = r1 * rs
  const aic1 = n * Math.log(v1) + 2 * k1, aic2 = n * Math.log(v2) + 2 * k2
  const bic1 = n * Math.log(v1) + k1 * Math.log(n), bic2 = n * Math.log(v2) + k2 * Math.log(n)
  const sgn = (c: number) => (c < 0 ? '-' : '+') + dec(Math.abs(c))
  return {
    intro: 'A series is modelled by ' + tex('Y_t=(1' + sgn(theta) + 'B)(1' + sgn(Theta) + 'B^{' + s + '})Z_t') + ', where ' + tex('Y_t=\\nabla\\nabla_{' + s + '}X_t') + ' is the differenced series, ' + tex('B') + ' is the backshift operator and ' + tex('Z_t') + ' is white noise. Give answers to 3 decimal places unless stated.',
    parts: [
      {
        prompt: 'Find the autocorrelation ' + tex('\\rho_Y(1)') + ' of ' + tex('Y_t') + '.',
        answer: r1, tolerance: tol3, lecture: 9,
        explanation: 'Expanding gives ' + tex('Z_t+\\theta Z_{t-1}+\\Theta Z_{t-' + s + '}+\\theta\\Theta Z_{t-' + (s + 1) + '}') + '. Then ' + tex('\\rho_Y(1)=\\theta/(1+\\theta^2)') + ' = ' + dec(r1) + '.',
      },
      {
        prompt: 'Find the autocorrelation at the seasonal lag, ' + tex('\\rho_Y(' + s + ')') + '.',
        answer: rs, tolerance: tol3, lecture: 9,
        explanation: tex('\\rho_Y(' + s + ')=\\Theta/(1+\\Theta^2)') + ' = ' + dec(rs) + '.',
      },
      {
        prompt: 'Find the autocorrelation ' + tex('\\rho_Y(' + (s + 1) + ')') + ', one lag after the seasonal lag.',
        answer: rs1, tolerance: tol3, lecture: 9,
        explanation: tex('\\rho_Y(' + (s + 1) + ')=\\theta\\Theta/\\{(1+\\theta^2)(1+\\Theta^2)\\}=\\rho_Y(1)\\rho_Y(' + s + ')') + ' = ' + dec(rs1) + '. The same value appears at lag ' + (s - 1) + '.',
      },
      {
        prompt: 'Two models are fitted to the same ' + tex('n=' + n) + ' differenced values. Model 1 has ' + tex('\\hat\\sigma^2=' + dec(v1)) + ' and ' + k1 + ' coefficients; model 2 has ' + tex('\\hat\\sigma^2=' + dec(v2)) + ' and ' + k2 + ' coefficients. With ' + tex('\\mathrm{AIC}=n\\ln\\hat\\sigma^2+2k') + ', find ' + tex('\\mathrm{AIC}_1-\\mathrm{AIC}_2') + ' to 2 decimal places.',
        answer: aic1 - aic2, tolerance: tol2, lecture: 10,
        explanation: tex('\\mathrm{AIC}_1=' + dec(aic1) + ',\\ \\mathrm{AIC}_2=' + dec(aic2)) + ', difference ' + dec(aic1 - aic2) + '. A positive value favours model 2.',
      },
      {
        prompt: 'With ' + tex('\\mathrm{BIC}=n\\ln\\hat\\sigma^2+k\\ln n') + ', find ' + tex('\\mathrm{BIC}_1-\\mathrm{BIC}_2') + ' to 2 decimal places.',
        answer: bic1 - bic2, tolerance: tol2, lecture: 10,
        explanation: tex('\\mathrm{BIC}_1=' + dec(bic1) + ',\\ \\mathrm{BIC}_2=' + dec(bic2)) + ', difference ' + dec(bic1 - bic2) + '. BIC charges ' + tex('\\ln n=' + dec(Math.log(n))) + ' per coefficient instead of 2.',
      },
    ],
  }
}

export const genH: LQGenerator = { id: 'ts1-lq-h-seasonal', generate: (rng) => build(sample(rng)) }
