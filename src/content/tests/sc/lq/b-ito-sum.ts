// LQ-B: Riemann sums for the Ito integral of W against W, quadratic variation, the arcsine law and a fourth moment.
// Lectures 1 (Brownian motion), 2 (properties of paths) and 3 (Ito integral).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params { h: number; inc: number[]; s0: number; t0: number; p: number; q: number }

export function sample(rng: Rng): Params {
  const inc = Array.from({ length: 5 }, () => rng.pick([-8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8]) / 10)
  const s0 = rng.int(1, 5)
  const p = rng.int(1, 4)
  return { h: rng.pick([0.25, 0.5, 1]), inc, s0, t0: s0 + rng.int(1, 6), p, q: p + rng.int(1, 4) }
}

export function build({ h, inc, s0, t0, p, q }: Params): LQInstance {
  const n = inc.length
  const T = n * h
  const w: number[] = [0]
  inc.forEach((x, i) => w.push(w[i] + x))
  const qv = inc.reduce((a, x) => a + x * x, 0)
  const left = inc.reduce((a, x, i) => a + w[i] * x, 0)
  const wT = w[n]
  const exact = (wT * wT - T) / 2
  const arcsine = (2 / Math.PI) * Math.asin(Math.sqrt(s0 / t0))
  const moment = 2 * p * p + p * q
  const times = w.map((_, i) => dec(i * h))

  return {
    intro: 'A Brownian path is observed on a grid of step ' + tex('h=' + dec(h)) + ' on ' + tex('[0,' + dec(T) + ']') + ': ' + tex('W_{' + times.join('}, W_{') + '}') + ' take the values ' + tex(w.map((x) => dec(x)).join(',\\ ')) + ' respectively. Give every answer to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the sum of squared increments ' + tex('\\sum_i(W_{t_{i+1}}-W_{t_i})^2') + ' of this path, an estimate of the quadratic variation.',
        answer: qv, tolerance: tol3, lecture: 1,
        explanation: 'The increments are ' + tex(inc.map((x) => dec(x)).join(',\\ ')) + '; their squares add to ' + tex(dec(qv)) + '. For a fine grid this tends to ' + tex('T=' + dec(T)) + '.',
      },
      {
        prompt: 'Compute the left-endpoint sum ' + tex('\\sum_iW_{t_i}(W_{t_{i+1}}-W_{t_i})') + ', the grid approximation of the Ito integral ' + tex('\\int_0^TW\\,dW') + '.',
        answer: left, tolerance: tol3, lecture: 3,
        explanation: 'Multiply each value by the next increment and add: ' + tex(dec(left)) + '. (Check: ' + tex('\\tfrac12(W_T^2-\\sum\\Delta W^2)=\\tfrac12(' + dec(wT * wT) + '-' + dec(qv) + ')') + '.)',
      },
      {
        prompt: 'The exact Ito integral is ' + tex('\\int_0^TW_t\\,dW_t=\\tfrac12(W_T^2-T)') + '. Evaluate it for this path.',
        answer: exact, tolerance: tol3, lecture: 3,
        explanation: tex('\\tfrac12(' + dec(wT) + '^2-' + dec(T) + ')=' + dec(exact)) + '. It differs from the left sum by ' + tex('\\tfrac12(T-\\sum\\Delta W^2)') + ', which vanishes as the grid is refined.',
      },
      {
        prompt: 'For a Brownian motion, find the probability that ' + tex('W') + ' has no zero in the time interval ' + tex('(' + s0 + ',' + t0 + ')') + '.',
        answer: arcsine, tolerance: tol3, lecture: 2,
        explanation: 'Arcsine law: ' + tex('P(\\text{no zero in }(s,t))=\\tfrac2\\pi\\arcsin\\sqrt{s/t}=\\tfrac2\\pi\\arcsin\\sqrt{' + s0 + '/' + t0 + '}=' + dec(arcsine)) + '.',
      },
      {
        prompt: 'For ' + tex('p=' + p + ',\\ q=' + q) + ', find ' + tex('E[W_p^2W_q^2]') + '.',
        answer: moment, tolerance: tol3, lecture: 1,
        explanation: 'Write ' + tex('W_q=W_p+\\Delta') + ' with ' + tex('\\Delta\\sim N(0,q-p)') + ' independent of ' + tex('W_p') + ': ' + tex('E[W_p^4]+E[W_p^2]E[\\Delta^2]=3p^2+p(q-p)=2p^2+pq=' + moment) + '.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'sc-lq-b-ito-sum', generate: (rng) => build(sample(rng)) }
