// LQ-A: a linear congruential generator by hand, its period, and inverse-transform sampling.
// Lectures 1 (random number generation) and 2 (inverse transform).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { m: number; a: number; c: number; x0: number; u1: number; lam: number; u2: number; xm: number; alpha: number }

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

export function sample(rng: Rng): Params {
  const m = rng.int(11, 40)
  let a = rng.int(2, m - 1)
  while (gcd(a, m) !== 1) a = rng.int(2, m - 1) // gcd(a, m) = 1 makes the map a permutation, so the sequence returns to x0
  return { m, a, c: rng.int(0, m - 1), x0: rng.int(0, m - 1), u1: rng.int(10, 90) / 100, lam: rng.int(2, 8) / 2, u2: rng.int(10, 90) / 100, xm: rng.int(1, 4), alpha: rng.int(2, 6) / 2 }
}

export function build({ m, a, c, x0, u1, lam, u2, xm, alpha }: Params): LQInstance {
  const next = (x: number) => (a * x + c) % m
  const x1 = next(x0), x2 = next(x1), x3 = next(x2)
  let period = 1
  for (let x = next(x0); x !== x0; x = next(x)) period++
  const expo = -Math.log(1 - u1) / lam
  const par = xm * (1 - u2) ** (-1 / alpha)
  const rule = tex('x_{n+1}=(' + a + 'x_n+' + c + ')\\bmod ' + m)

  return {
    intro: 'Integer answers are exact; give the other answers to 4 decimal places.',
    parts: [
      {
        prompt: 'A linear congruential generator uses ' + rule + ' with seed ' + tex('x_0=' + x0) + '. Find ' + tex('x_3') + '.',
        answer: x3, tolerance: tolInt, lecture: 1,
        explanation: 'Iterate: ' + tex('x_1=' + x1 + ',\\ x_2=' + x2 + ',\\ x_3=' + x3) + '.',
      },
      {
        prompt: 'The generator outputs ' + tex('u_n=x_n/' + m) + '. Find ' + tex('u_3') + ' from the sequence above.',
        answer: x3 / m, tolerance: tol4, lecture: 1,
        explanation: tex('u_3=' + x3 + '/' + m + '=' + dec(x3 / m)) + '.',
      },
      {
        prompt: 'The sequence is a permutation cycle (since ' + tex('\\gcd(' + a + ',' + m + ')=1') + '). How many steps until ' + tex('x_n') + ' first returns to the seed ' + tex('x_0=' + x0) + ' (the period of this orbit)?',
        answer: period, tolerance: tolInt, lecture: 1,
        explanation: 'Keep iterating until ' + tex('x_n=' + x0) + ': it first happens at ' + tex('n=' + period) + '. The full period ' + tex(String(m)) + ' needs the Hull-Dobell conditions.',
      },
      {
        prompt: 'Use the inverse transform to turn the uniform ' + tex('U=' + dec(u1)) + ' into an exponential variable with rate ' + tex('\\lambda=' + dec(lam)) + ': ' + tex('X=F^{-1}(U)') + '.',
        answer: expo, tolerance: tol4, lecture: 2,
        explanation: tex('F(x)=1-e^{-\\lambda x}') + ', so ' + tex('X=-\\ln(1-U)/\\lambda=-\\ln(' + dec(1 - u1) + ')/' + dec(lam) + '=' + dec(expo)) + '.',
      },
      {
        prompt: 'A Pareto variable has ' + tex('F(x)=1-(' + xm + '/x)^{' + dec(alpha) + '}') + ' for ' + tex('x\\ge ' + xm) + '. Use the inverse transform with ' + tex('U=' + dec(u2)) + ' to generate ' + tex('X') + '.',
        answer: par, tolerance: tol4, lecture: 2,
        explanation: tex('X=' + xm + '(1-U)^{-1/' + dec(alpha) + '}=' + xm + '\\times' + dec(1 - u2) + '^{-1/' + dec(alpha) + '}=' + dec(par)) + '.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'mc-lq-a-lcg', generate: (rng) => build(sample(rng)) }
