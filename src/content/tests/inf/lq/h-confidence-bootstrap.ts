// LQ-H: confidence sets by inverting tests (uniform maximum, order-statistic interval for the median) and exact bootstrap calculations on a tiny sample.
// Lectures 10 (confidence sets and duality) and 11 (bootstrap).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { n: number; mx: number; alpha: number; th: number; n2: number; k: number; data: number[] }

function distinct(rng: Rng): number[] {
  for (;;) {
    const d = Array.from({ length: 5 }, () => rng.int(1, 12))
    if (new Set(d).size >= 3) return d
  }
}

export function sample(rng: Rng): Params {
  const n2 = rng.int(8, 12)
  return { n: rng.int(5, 12), mx: rng.pick([2.4, 3.1, 4.7, 5.6, 7.3, 8.8]), alpha: rng.pick([0.05, 0.1]), th: rng.pick([5, 8, 10]), n2, k: rng.int(2, 3), data: distinct(rng) }
}

export function build({ n, mx, alpha, th, n2, k, data }: Params): LQInstance {
  const c = alpha ** (-1 / n)
  const upper = mx * c
  const expLen = (c - 1) * ((th * n) / (n + 1))
  let tailP = 0
  const ch = (a: number, b: number) => { let r = 1; for (let i = 1; i <= b; i++) r = (r * (a - b + i)) / i; return r }
  for (let j = 0; j <= k - 1; j++) tailP += ch(n2, j) / 2 ** n2
  const cover = 1 - 2 * tailP
  const nb = data.length
  const mean = data.reduce((s, v) => s + v, 0) / nb
  const ss = data.reduce((s, v) => s + (v - mean) ** 2, 0)
  const se = Math.sqrt(ss) / nb
  const bias = -ss / (nb * nb)
  const sorted = [...data].sort((p, q) => p - q)

  return {
    intro: 'Part A: ' + tex('X_1,\\dots,X_{' + n + '}') + ' are i.i.d. uniform on ' + tex('(0,\\theta)') + ' with sample maximum ' + tex('M=' + mx) + '. Part B: a sample of ' + tex(n2) + ' observations from a continuous distribution. Part C: a small data set ' + tex(data.join(',\\ ')) + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Part A. Inverting the level-' + tex('\\alpha') + ' test of ' + tex('H_0:\\theta=\\theta_0') + ' that rejects when ' + tex('M>\\theta_0') + ' or ' + tex('M<\\theta_0\\alpha^{1/n}') + ' gives the confidence interval ' + tex('[M,\\ M\\alpha^{-1/n}]') + ' at level ' + tex('1-\\alpha=' + dec(1 - alpha)) + '. Find its upper limit.',
        answer: upper, tolerance: tol4, lecture: 17,
        explanation: tex('\\theta_0') + ' is accepted iff ' + tex('M\\le\\theta_0\\le M\\alpha^{-1/n}') + ', since ' + tex('P_{\\theta_0}(M<\\theta_0\\alpha^{1/n})=\\alpha') + '. The upper limit is ' + tex(mx + '\\cdot' + dec(alpha) + '^{-1/' + n + '}=' + mx + '\\cdot' + dec(c) + '=' + dec(upper)) + '.',
      },
      {
        prompt: 'Part A. If the true value is ' + tex('\\theta=' + th) + ', the maximum has mean ' + tex('E[M]=\\theta n/(n+1)') + '. Find the expected length of the interval ' + tex('[M,M\\alpha^{-1/n}]') + '.',
        answer: expLen, tolerance: tol4, lecture: 17,
        explanation: 'Length ' + tex('M(\\alpha^{-1/n}-1)') + ' has expectation ' + tex('(' + dec(c) + '-1)\\cdot' + th + '\\cdot' + n + '/' + (n + 1) + '=' + dec(expLen)) + '.',
      },
      {
        prompt: 'Part B. The interval from the ' + tex(k) + '-th smallest to the ' + tex(k) + '-th largest observation is a confidence interval for the median, obtained by inverting the sign test. Find its exact coverage probability ' + tex('1-2P(\\mathrm{Bin}(' + n2 + ',\\tfrac12)\\le' + (k - 1) + ')') + '.',
        answer: cover, tolerance: tol4, lecture: 17,
        explanation: tex('P(\\mathrm{Bin}(' + n2 + ',0.5)\\le' + (k - 1) + ')=' + dec(tailP)) + ', so the coverage is ' + tex('1-2\\cdot' + dec(tailP) + '=' + dec(cover)) + ', whatever the continuous distribution.',
      },
      {
        prompt: 'Part C. The bootstrap resamples ' + tex(nb) + ' values with replacement from the data. Find the exact bootstrap standard error of the resample mean, ' + tex('\\sqrt{\\sum_i(x_i-\\bar x)^2}\\big/n') + '.',
        answer: se, tolerance: tol4, lecture: 18,
        explanation: tex('\\bar x=' + dec(mean) + ',\\ \\sum(x_i-\\bar x)^2=' + dec(ss)) + ' (sorted data ' + sorted.join(', ') + '), so the standard error is ' + tex('\\sqrt{' + dec(ss) + '}/' + nb + '=' + dec(se)) + '. This is the plug-in value with divisor ' + tex('n') + ', slightly below ' + tex('s/\\sqrt n') + '.',
      },
      {
        prompt: 'Part C. For the plug-in variance ' + tex('\\hat\\sigma^2=\\frac1n\\sum(x_i-\\bar x)^2') + ', the bootstrap expectation of ' + tex('\\hat\\sigma^{*2}') + ' is ' + tex('(1-1/n)\\hat\\sigma^2') + '. Find the bootstrap bias estimate ' + tex('E^*[\\hat\\sigma^{*2}]-\\hat\\sigma^2') + '.',
        answer: bias, tolerance: tol4, lecture: 18,
        explanation: tex('\\hat\\sigma^2=' + dec(ss / nb)) + ', so the bias estimate is ' + tex('-\\hat\\sigma^2/n=-' + dec(ss / nb) + '/' + nb + '=' + dec(bias)) + '. The bias-corrected estimate is ' + tex('2\\hat\\sigma^2-E^*\\hat\\sigma^{*2}') + '.',
      },
    ],
  }
}

export const genH: LQGenerator = { id: 'inf-lq-h-confidence-bootstrap', generate: (rng) => build(sample(rng)) }
