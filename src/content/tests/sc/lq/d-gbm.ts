// LQ-D: geometric Brownian motion: mean, a probability, the median, the standard deviation and a power moment.
// Lecture 5 (geometric Brownian motion), with Ito's formula for the power (lecture 4).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, normalCdf, tex, tol2, tol3, tol4 } from '../../../shared/format'

export interface Params { s0: number; mu: number; sigma: number; T: number; K: number; pw: number }

export function sample(rng: Rng): Params {
  const s0 = rng.int(50, 150)
  return {
    s0, mu: rng.int(2, 12) / 100, sigma: rng.int(2, 5) / 10, T: rng.pick([0.5, 1, 2]),
    K: Math.round(s0 * rng.int(85, 115) / 100), pw: rng.pick([2, 3, -1, 0.5, -2]),
  }
}

export function build({ s0, mu, sigma, T, K, pw }: Params): LQInstance {
  const mean = s0 * Math.exp(mu * T)
  const d2 = (Math.log(s0 / K) + (mu - 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T))
  const prob = normalCdf(d2)
  const median = s0 * Math.exp((mu - 0.5 * sigma * sigma) * T)
  const sd = s0 * Math.exp(mu * T) * Math.sqrt(Math.exp(sigma * sigma * T) - 1)
  const rate = pw * mu + 0.5 * pw * (pw - 1) * sigma * sigma
  const power = Math.exp(rate * T)
  const sde = tex('dS_t=' + dec(mu) + 'S_t\\,dt+' + dec(sigma) + 'S_t\\,dW_t')

  return {
    intro: 'A stock follows geometric Brownian motion ' + sde + ' with ' + tex('S_0=' + s0) + ', and ' + tex('T=' + dec(T)) + ' years. Give the first, third and fourth answers to 2 decimal places, the second to 3 and the last to 4.',
    parts: [
      {
        prompt: 'Find ' + tex('E[S_T]') + '.',
        answer: mean, tolerance: tol2, lecture: 5,
        explanation: tex('E[S_T]=S_0e^{\\mu T}=' + s0 + 'e^{' + dec(mu * T) + '}=' + dec(mean)) + '; the Ito correction cancels in the mean.',
      },
      {
        prompt: 'Find ' + tex('P(S_T>' + K + ')') + '.',
        answer: prob, tolerance: tol3, lecture: 5,
        explanation: tex('\\ln S_T\\sim N(\\ln S_0+(\\mu-\\sigma^2/2)T,\\sigma^2T)') + ', so the probability is ' + tex('\\Phi(d)') + ' with ' + tex('d=\\{\\ln(' + s0 + '/' + K + ')+(\\mu-\\sigma^2/2)T\\}/(\\sigma\\sqrt T)=' + dec(d2)) + ', giving ' + tex(dec(prob)) + '.',
      },
      {
        prompt: 'Find the median of ' + tex('S_T') + '.',
        answer: median, tolerance: tol2, lecture: 5,
        explanation: 'The median of the lognormal is ' + tex('e^{\\text{median of }\\ln S_T}=S_0e^{(\\mu-\\sigma^2/2)T}=' + dec(median)) + ', below the mean.',
      },
      {
        prompt: 'Find the standard deviation of ' + tex('S_T') + '.',
        answer: sd, tolerance: tol2, lecture: 5,
        explanation: tex('\\operatorname{Var}(S_T)=S_0^2e^{2\\mu T}(e^{\\sigma^2T}-1)') + ', so ' + tex('\\text{sd}=E[S_T]\\sqrt{e^{\\sigma^2T}-1}=' + dec(mean) + '\\times' + dec(Math.sqrt(Math.exp(sigma * sigma * T) - 1)) + '=' + dec(sd)) + '.',
      },
      {
        prompt: 'Find ' + tex('E[(S_T/S_0)^{' + dec(pw) + '}]') + '.',
        answer: power, tolerance: tol4, lecture: 4,
        explanation: 'Ito on ' + tex('S^p') + ' gives a GBM with drift ' + tex('p\\mu+\\tfrac12p(p-1)\\sigma^2=' + dec(rate)) + ', so ' + tex('E[(S_T/S_0)^p]=e^{' + dec(rate) + '\\cdot' + dec(T) + '}=' + dec(power)) + '.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'sc-lq-d-gbm', generate: (rng) => build(sample(rng)) }
