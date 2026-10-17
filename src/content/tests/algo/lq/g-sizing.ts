// LQ-G: position sizing: volatility targeting and Kelly fractions.
// Lecture 9.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol2, tol4 } from '../../../shared/format'

export interface Params { target: number; real: number; capital: number; mu: number; sigma: number; pw: number; b: number }

export function sample(rng: Rng): Params {
  return { target: rng.int(8, 15) / 100, real: rng.int(5, 30) / 100, capital: rng.pick([1, 2, 5, 10]) * 1000000, mu: rng.int(3, 12) / 100, sigma: rng.int(10, 30) / 100, pw: rng.int(52, 65) / 100, b: rng.pick([1, 1.5, 2]) }
}

export function build({ target, real, capital, mu, sigma, pw, b }: Params): LQInstance {
  const lev = target / real
  const pos = lev * capital
  const kelly = mu / (sigma * sigma)
  const q = 1 - pw
  const kd = pw - q / b
  const g = pw * Math.log(1 + b * kd) + q * Math.log(1 - kd)

  return {
    intro: 'Give answers to 4 decimal places except dollar amounts (2 decimal places).',
    parts: [
      {
        prompt: 'Volatility targeting scales exposure by ' + tex('\\text{target vol}/\\text{realised vol}') + '. The target is ' + tex(dec(target * 100) + '\\%') + ' annualised and the strategy\'s realised volatility is ' + tex(dec(real * 100) + '\\%') + '. Find the leverage.',
        answer: lev, tolerance: tol4, lecture: 9,
        explanation: tex(dec(target) + '/' + dec(real) + '=' + dec(lev)) + '.',
      },
      {
        prompt: 'With capital of ' + tex(capital) + ' dollars, find the dollar position implied by that leverage. Give it to 2 decimal places.',
        answer: pos, tolerance: tol2, lecture: 9,
        explanation: tex(dec(lev) + '\\times' + capital + '=' + dec(pos)) + '. When realised volatility rises, leverage falls.',
      },
      {
        prompt: 'The continuous-time Kelly fraction for an asset with excess return ' + tex(dec(mu * 100) + '\\%') + ' and volatility ' + tex(dec(sigma * 100) + '\\%') + ' is ' + tex('f^*=\\mu/\\sigma^2') + '. Find it.',
        answer: kelly, tolerance: tol4, lecture: 9,
        explanation: tex(dec(mu) + '/' + dec(sigma) + '^2=' + dec(kelly)) + '. In practice people bet a fraction of Kelly because the inputs are uncertain.',
      },
      {
        prompt: 'A bet wins ' + tex(dec(b)) + ' per unit staked with probability ' + tex(dec(pw)) + ' and loses the stake otherwise. Find the Kelly fraction ' + tex('f^*=p-q/b') + '.',
        answer: kd, tolerance: tol4, lecture: 9,
        explanation: tex(dec(pw) + '-' + dec(q) + '/' + dec(b) + '=' + dec(kd)) + '.',
      },
      {
        prompt: 'Find the expected log growth per bet at that Kelly fraction, ' + tex('p\\ln(1+bf)+q\\ln(1-f)') + '.',
        answer: g, tolerance: tol4, lecture: 9,
        explanation: tex(dec(pw) + '\\ln(1+' + dec(b) + '\\times' + dec(kd) + ')+' + dec(q) + '\\ln(1-' + dec(kd) + ')=' + dec(g)) + '. Growth is maximised at Kelly and falls on either side.',
      },
    ],
  }
}

export const genG: LQGenerator = { id: 'algo-lq-g-sizing', generate: (rng) => build(sample(rng)) }
