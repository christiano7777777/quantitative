// bay lecture 4 (Monte Carlo basics and inverse transform sampling): one story. Exponential waiting times simulated from uniforms by the
// inverse cdf: one draw, the Monte Carlo mean, the tail fraction, the sample sd, the Monte Carlo standard error, and the required number of draws.
// Lecture 4.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { lam: number; u: number[] }

export function sample(rng: Rng): Params {
  return { lam: rng.pick([0.5, 1, 2]), u: rng.sample([0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95], 5) }
}

export function build({ lam, u }: Params): LQInstance {
  const n = u.length
  const x = u.map((v) => -Math.log(1 - v) / lam)
  const mean = x.reduce((a, b) => a + b, 0) / n
  const sd = Math.sqrt(x.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1))
  const c = 1 / lam
  const frac = x.filter((v) => v > c).length / n
  const mcse = sd / Math.sqrt(n)
  const need = Math.round(1 / (lam * 0.05) ** 2)

  return {
    intro: 'We want to simulate the waiting time ' + tex('X') + ' of an exponential distribution with rate ' + tex('\\lambda=' + dec(lam)) + ' (cdf ' + tex('F(x)=1-e^{-\\lambda x}') + ', mean ' + tex('1/\\lambda') + ', standard deviation ' + tex('1/\\lambda') + '). A random number generator gives the uniform draws ' + tex('U:\\ ' + u.map(dec).join(',\\ ')) + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'The inverse transform method sets ' + tex('X=F^{-1}(U)=-\\ln(1-U)/\\lambda') + '. Find the first draw from ' + tex('U=' + dec(u[0]))+ '.',
        answer: x[0], tolerance: tol4, lecture: 4,
        explanation: tex('-\\ln(1-' + dec(u[0]) + ')/' + dec(lam)) + ' = ' + dec(x[0]) + '. If ' + tex('U') + ' is uniform on ' + tex('(0,1)') + ' then ' + tex('F^{-1}(U)') + ' has cdf ' + tex('F') + '.',
      },
      {
        prompt: 'Transform all ' + tex(n) + ' uniforms and find the Monte Carlo estimate of ' + tex('E[X]') + ', the sample mean of the draws.',
        answer: mean, tolerance: tol4, lecture: 4,
        explanation: 'The draws are ' + x.map(dec).join(', ') + '; their mean is ' + dec(mean) + ' (the true mean is ' + tex(dec(c)) + ').',
      },
      {
        prompt: 'Estimate ' + tex('P(X>' + dec(c) + ')') + ' by the fraction of the draws above ' + tex(dec(c)) + ' (the true value is ' + tex('e^{-1}\\approx0.3679') + ').',
        answer: frac, tolerance: tol4, lecture: 4,
        explanation: x.filter((v) => v > c).length + ' of the ' + n + ' draws exceed ' + dec(c) + ', so the estimate is ' + dec(frac) + '. A Monte Carlo probability is an average of indicators.',
      },
      {
        prompt: 'Find the sample standard deviation of the draws (divisor ' + tex(n - 1) + ').',
        answer: sd, tolerance: tol4, lecture: 4,
        explanation: 'Deviations from ' + dec(mean) + ' give variance ' + dec(sd * sd) + ', so the standard deviation is ' + dec(sd) + '.',
      },
      {
        prompt: 'Find the Monte Carlo standard error of the mean, ' + tex('s/\\sqrt n') + '.',
        answer: mcse, tolerance: tol4, lecture: 4,
        explanation: tex(dec(sd) + '/\\sqrt{' + n + '}') + ' = ' + dec(mcse) + '. It shrinks like ' + tex('1/\\sqrt n') + ', whatever the dimension.',
      },
      {
        prompt: 'How many independent draws are needed for the Monte Carlo standard error of the mean to be ' + tex(0.05) + '? Use the true standard deviation ' + tex('\\sigma=1/\\lambda=' + dec(c)) + ' and ' + tex('n=(\\sigma/0.05)^2') + '. Give a whole number.',
        answer: need, tolerance: tolInt, lecture: 4,
        explanation: tex('(' + dec(c) + '/0.05)^2') + ' = ' + need + '.',
      },
    ],
  }
}

export const genLec4: LQGenerator = { id: 'bay-lq-lec4', generate: (rng) => build(sample(rng)) }
